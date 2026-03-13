/**
 * Scheduler Service
 * Built-in cron scheduler for automated pipeline execution and auto-publishing
 */

import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline, getArticles } from './pipeline.js';
import { publishToWordPress, isAuthenticated } from './wordpressClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const CONFIG_FILE = path.join(DATA_DIR, 'scheduler.json');

// ─── State ────────────────────────────────────────────────
let cronJob = null;
let isRunning = false;

const DEFAULT_CONFIG = {
    enabled: true,
    cronExpression: '0 */6 * * *', // Every 6 hours
    categoryRuns: [
        { category: 'politica', maxArticles: 8 },
        { category: 'economia', maxArticles: 2 },
    ],
    // Full pool for rotation — scheduler cycles through these
    categoryPool: ['politica', 'internacional', 'economia', 'tecnologia', 'meio-ambiente', 'educacao', 'saude', 'ciencia', 'esportes', 'geral'],
    // How many categories from the pool per run
    categoriesPerRun: 3,
    // Rotation index — tracks which categories to pick next
    rotationIndex: 0,
    // Legacy field for backward compat
    categories: ['politica', 'internacional', 'economia', 'tecnologia', 'meio-ambiente', 'educacao', 'saude', 'ciencia', 'esportes', 'geral'],
    maxArticlesPerRun: 10,
    autoPublish: true,
    publishAsDraft: false,
    language: 'por',
    period: 'today',
    sortBy: 'rel',
};

// ─── Persistence ──────────────────────────────────────────
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return { ...DEFAULT_CONFIG, ...data.config, history: data.history || [] };
        }
    } catch (err) {
        console.error('[Scheduler] Error loading config:', err.message);
    }
    return { ...DEFAULT_CONFIG, history: [] };
}

function saveConfig(config, history) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ config, history: history.slice(0, 50) }, null, 2));
    } catch (err) {
        console.error('[Scheduler] Error saving config:', err.message);
    }
}

let config = loadConfig();
let history = config.history || [];
delete config.history;

// ─── Cron Labels ──────────────────────────────────────────
const CRON_PRESETS = {
    '0 */2 * * *': 'A cada 2 horas',
    '0 */3 * * *': 'A cada 3 horas',
    '0 */4 * * *': 'A cada 4 horas',
    '0 */6 * * *': 'A cada 6 horas',
    '0 */8 * * *': 'A cada 8 horas',
    '0 */12 * * *': 'A cada 12 horas',
    '0 8 * * *': '1x/dia (08:00)',
    '0 8,20 * * *': '2x/dia (08:00 e 20:00)',
    '0 7,13,19 * * *': '3x/dia (07:00, 13:00, 19:00)',
    '0 6,10,14,18,22 * * *': '5x/dia',
    '0 8 * * 1-5': 'Dias úteis (08:00)',
    '*/1 * * * *': 'A cada minuto (teste)',
};

function getCronLabel(expr) {
    return CRON_PRESETS[expr] || expr;
}

// ─── Core: Execute Scheduled Run ──────────────────────────
async function executeScheduledRun() {
    if (isRunning) {
        console.log('[Scheduler] ⏳ Pipeline already running, skipping...');
        return;
    }

    isRunning = true;
    const runRecord = {
        id: `sched-${Date.now()}`,
        startedAt: new Date().toISOString(),
        categories: [],
        articlesProcessed: 0,
        articlesPublished: 0,
        status: 'running',
        errors: [],
    };

    // Build category runs via rotation through the pool
    const pool = config.categoryPool || config.categories || ['politica'];
    const perRun = config.categoriesPerRun || 3;
    const totalArticles = config.maxArticlesPerRun || 10;
    const startIdx = config.rotationIndex || 0;

    const categoryRuns = [];
    for (let i = 0; i < perRun; i++) {
        const idx = (startIdx + i) % pool.length;
        // 80/20 distribution: first category gets 80%, rest share 20%
        const articlesForCat = i === 0
            ? Math.round(totalArticles * 0.8)
            : Math.max(1, Math.floor((totalArticles * 0.2) / (perRun - 1)));
        categoryRuns.push({ category: pool[idx], maxArticles: articlesForCat });
    }

    // Advance rotation index for next run
    config.rotationIndex = (startIdx + perRun) % pool.length;
    saveConfig(config, history);

    console.log(`\n[Scheduler] 🔄 Starting scheduled run (rotation ${startIdx}→${config.rotationIndex}) — ${categoryRuns.map(r => `${r.category}(${r.maxArticles})`).join(' + ')}`);

    try {
        for (const catRun of categoryRuns) {
            const { category, maxArticles } = catRun;
            runRecord.categories.push(category);

            console.log(`[Scheduler]   📂 Category: ${category} (${maxArticles} articles)`);

            // Run the pipeline with auto-publish enabled (pipeline handles publishing internally)
            const runId = await runPipeline({
                newsApiKey: process.env.NEWS_API_KEY,
                category,
                language: config.language,
                maxArticles,
                sortBy: config.sortBy,
                period: config.period,
                autoPublish: config.autoPublish,
            });

            // Wait for pipeline to complete
            await waitForPipelineCompletion(runId);

            // Count results from pipeline run
            const pipelineStatus = getPipelineStatus(runId);
            if (pipelineStatus) {
                runRecord.articlesProcessed += pipelineStatus.articlesProcessed || 0;
                runRecord.articlesPublished += pipelineStatus.articlesPublished || 0;
            }

            console.log(`[Scheduler]   ✅ ${category} done — ${pipelineStatus?.articlesProcessed || 0} processed, ${pipelineStatus?.articlesPublished || 0} published`);
        }

        runRecord.status = runRecord.errors.length > 0 ? 'partial' : 'complete';

    } catch (err) {
        runRecord.status = 'error';
        runRecord.errors.push(err.message);
        console.error(`[Scheduler] ❌ Scheduled run failed:`, err.message);
    } finally {
        runRecord.completedAt = new Date().toISOString();
        history.unshift(runRecord);
        if (history.length > 50) history = history.slice(0, 50);
        saveConfig(config, history);
        isRunning = false;
    }
}

// Wait for a pipeline run to finish (max 10 minutes)
async function waitForPipelineCompletion(runId) {
    const { getPipelineStatus } = await import('./pipeline.js');
    const MAX_WAIT = 10 * 60 * 1000; // 10 minutes
    const POLL_INTERVAL = 3000; // 3 seconds
    const start = Date.now();

    return new Promise((resolve, reject) => {
        const check = () => {
            const status = getPipelineStatus(runId);
            if (!status) return reject(new Error('Pipeline run not found'));
            if (status.status === 'complete') return resolve(status);
            if (status.status === 'error') return reject(new Error('Pipeline failed: ' + (status.errors?.[0] || 'unknown')));
            if (Date.now() - start > MAX_WAIT) return reject(new Error('Pipeline timeout (10 min)'));
            setTimeout(check, POLL_INTERVAL);
        };
        check();
    });
}

// ─── Scheduler Control ────────────────────────────────────
export function startScheduler(newConfig = {}) {
    // Merge config
    Object.assign(config, newConfig);

    // Validate cron expression
    if (!cron.validate(config.cronExpression)) {
        throw new Error(`Invalid cron expression: ${config.cronExpression}`);
    }

    // Stop existing job
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
    }

    // Start new cron job
    cronJob = cron.schedule(config.cronExpression, executeScheduledRun, {
        timezone: 'America/Sao_Paulo',
    });

    config.enabled = true;
    saveConfig(config, history);

    console.log(`[Scheduler] ⏰ Started — ${getCronLabel(config.cronExpression)} (${config.cronExpression})`);
    console.log(`[Scheduler]    Categories: ${config.categories.join(', ')}`);
    console.log(`[Scheduler]    Auto-publish: ${config.autoPublish ? 'Yes (as ' + (config.publishAsDraft ? 'draft' : 'published') + ')' : 'No'}`);

    return getSchedulerStatus();
}

export function stopScheduler() {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
    }
    config.enabled = false;
    saveConfig(config, history);
    console.log('[Scheduler] ⏹️  Stopped');
    return getSchedulerStatus();
}

export function getSchedulerStatus() {
    return {
        enabled: config.enabled,
        isRunning,
        cronExpression: config.cronExpression,
        cronLabel: getCronLabel(config.cronExpression),
        categories: config.categories,
        maxArticlesPerRun: config.maxArticlesPerRun,
        autoPublish: config.autoPublish,
        publishAsDraft: config.publishAsDraft,
        language: config.language,
        period: config.period,
        sortBy: config.sortBy,
        nextRun: config.enabled ? getNextRunTime(config.cronExpression) : null,
        lastRun: history[0] || null,
        presets: CRON_PRESETS,
    };
}

export function updateSchedulerConfig(newConfig) {
    const wasEnabled = config.enabled;
    Object.assign(config, newConfig);
    saveConfig(config, history);

    // Restart if enabled and cron changed
    if (config.enabled) {
        return startScheduler();
    }
    return getSchedulerStatus();
}

export function getSchedulerHistory() {
    return history;
}

export function triggerManualScheduledRun() {
    if (isRunning) {
        return { triggered: false, reason: 'Pipeline already running' };
    }
    executeScheduledRun(); // fire and forget
    return { triggered: true };
}

// ─── Helpers ──────────────────────────────────────────────
function getNextRunTime(cronExpr) {
    // Simple next-run estimation based on cron expression
    try {
        const parts = cronExpr.split(' ');
        const now = new Date();
        const minute = parts[0] === '*' ? now.getMinutes() : parseInt(parts[0]) || 0;
        const hourPart = parts[1];

        if (hourPart.startsWith('*/')) {
            // Interval-based (e.g., */6)
            const interval = parseInt(hourPart.replace('*/', ''));
            const currentHour = now.getHours();
            let nextHour = Math.ceil((currentHour + 1) / interval) * interval;
            if (nextHour > 23) nextHour = 0;
            const next = new Date(now);
            next.setHours(nextHour, minute, 0, 0);
            if (next <= now) next.setDate(next.getDate() + 1);
            return next.toISOString();
        }

        if (hourPart.includes(',')) {
            // Multiple hours (e.g., 8,20)
            const hours = hourPart.split(',').map(Number).sort((a, b) => a - b);
            const currentHour = now.getHours();
            const nextHour = hours.find(h => h > currentHour) || hours[0];
            const next = new Date(now);
            next.setHours(nextHour, minute, 0, 0);
            if (next <= now) next.setDate(next.getDate() + 1);
            return next.toISOString();
        }

        // Single hour
        const hour = parseInt(hourPart) || 0;
        const next = new Date(now);
        next.setHours(hour, minute, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next.toISOString();
    } catch {
        return null;
    }
}

// ─── Auto-start on boot ──────────────────────────────────
export function initScheduler() {
    const savedConfig = loadConfig();
    config = { ...DEFAULT_CONFIG, ...savedConfig };
    delete config.history;
    history = savedConfig.history || [];

    if (config.enabled) {
        console.log('[Scheduler] ⏰ Auto-starting scheduler on boot...');
        startScheduler();
    }
}
