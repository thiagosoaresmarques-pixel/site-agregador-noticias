/**
 * Pipeline Orchestrator
 * Executes the editorial pipeline: Raw News → Ficha Factual (JSON) → Objeções (JSON) → Editorial Final → SEO
 */

import { generateThesis, generateAntithesis, generateSynthesis, generateSEO } from './geminiClient.js';
import { fetchArticles } from './newsClient.js';
import { publishToWordPress, isAuthenticated } from './wordpressClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

// ─── GCS Persistence Layer ────────────────────────────────
const GCS_BUCKET = process.env.GCS_BUCKET || 'dialetica-news-data';
const GCS_FILE = 'articles.json';
const isProd = process.env.NODE_ENV === 'production';

// In-memory pipeline status tracking
const pipelineRuns = new Map();

let gcsStorage = null;
let gcsBucket = null;
let articlesCache = null; // in-memory cache

if (isProd) {
    try {
        const { Storage } = await import('@google-cloud/storage');
        gcsStorage = new Storage();
        gcsBucket = gcsStorage.bucket(GCS_BUCKET);
        console.log(`[Storage] GCS enabled: gs://${GCS_BUCKET}/${GCS_FILE}`);
    } catch (err) {
        console.warn('[Storage] GCS not available, using local file:', err.message);
    }
}

/**
 * Load articles — GCS (production) or local file (development)
 */
async function loadArticlesFromGCS() {
    if (!gcsBucket) return null;
    try {
        const file = gcsBucket.file(GCS_FILE);
        const [exists] = await file.exists();
        if (!exists) return [];
        const [content] = await file.download();
        return JSON.parse(content.toString('utf-8'));
    } catch (err) {
        console.error('[Storage] GCS read error:', err.message);
        return null;
    }
}

async function saveArticlesToGCS(articles) {
    if (!gcsBucket) return;
    try {
        const file = gcsBucket.file(GCS_FILE);
        await file.save(JSON.stringify(articles, null, 2), { contentType: 'application/json' });
    } catch (err) {
        console.error('[Storage] GCS write error:', err.message);
    }
}

function loadArticles() {
    // Use cache if available
    if (articlesCache !== null) return articlesCache;

    // Load from local file
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ARTICLES_FILE)) {
        fs.writeFileSync(ARTICLES_FILE, '[]', 'utf-8');
    }
    articlesCache = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));
    return articlesCache;
}

function saveArticles(articles) {
    // Update cache
    articlesCache = articles;

    // Save to local file
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf-8');

    // Sync to GCS (async, non-blocking)
    saveArticlesToGCS(articles);
}

/**
 * Initialize: load from GCS into local cache on startup
 */
export async function initArticleStorage() {
    if (!gcsBucket) return;
    console.log('[Storage] Loading articles from GCS...');
    const gcsArticles = await loadArticlesFromGCS();
    if (gcsArticles && gcsArticles.length > 0) {
        articlesCache = gcsArticles;
        // Also save locally for fast access
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(ARTICLES_FILE, JSON.stringify(gcsArticles, null, 2), 'utf-8');
        console.log(`[Storage] Loaded ${gcsArticles.length} articles from GCS`);
    } else {
        // If GCS is empty but local has data, sync up
        const local = loadArticles();
        if (local.length > 0) {
            await saveArticlesToGCS(local);
            console.log(`[Storage] Synced ${local.length} local articles to GCS`);
        }
    }
}

/**
 * Get all stored articles
 */
export function getArticles() {
    return loadArticles();
}

/**
 * Get article by ID
 */
export function getArticleById(id) {
    const articles = loadArticles();
    return articles.find((a) => a.id === id) || null;
}

/**
 * Update an article's status and optional metadata
 */
export function updateArticleStatus(id, status, meta = {}) {
    const articles = loadArticles();
    const idx = articles.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    articles[idx].status = status;
    Object.assign(articles[idx], meta);
    saveArticles(articles);
    return articles[idx];
}

/**
 * Get pipeline run status
 */
export function getPipelineStatus(runId) {
    return pipelineRuns.get(runId) || null;
}

/**
 * Get all pipeline runs
 */
export function getAllPipelineRuns() {
    return Array.from(pipelineRuns.values()).sort((a, b) =>
        new Date(b.startedAt) - new Date(a.startedAt)
    );
}

/**
 * Execute the full dialectical pipeline for a set of news articles
 */
export async function runPipeline({ newsApiKey, category = 'politica', language = 'por', maxArticles = 5, sortBy = 'date', period = '3days', sourceFilter = '', skipDuplicates = true, autoPublish = true }) {
    const runId = `run-${Date.now()}`;
    const status = {
        id: runId,
        status: 'running',
        stage: 'fetching',
        startedAt: new Date().toISOString(),
        completedAt: null,
        articlesProcessed: 0,
        articlesPublished: 0,
        totalArticles: 0,
        currentArticle: null,
        tokens: { input: 0, output: 0, total: 0 },
        stages: {},
        errors: [],
    };

    pipelineRuns.set(runId, status);

    // Run in background (non-blocking)
    processPipeline(runId, { newsApiKey, category, language, maxArticles, sortBy, period, sourceFilter, skipDuplicates, autoPublish }).catch((err) => {
        const run = pipelineRuns.get(runId);
        if (run) {
            run.status = 'error';
            run.errors.push(err.message);
        }
    });

    return runId;
}

/**
 * Internal: Process the full pipeline
 */
async function processPipeline(runId, { newsApiKey, category, language, maxArticles, sortBy, period, sourceFilter, skipDuplicates, autoPublish }) {
    const run = pipelineRuns.get(runId);

    try {
        // Stage 1: Fetch raw news
        updateStage(run, 'fetching', 'in_progress');
        const rawArticles = await fetchArticles({ apiKey: newsApiKey, category, language, maxArticles, sortBy, period, sourceFilter, skipDuplicates });
        run.totalArticles = rawArticles.length;
        updateStage(run, 'fetching', 'complete', { count: rawArticles.length });

        const articles = loadArticles();

        // Process each article through the dialectical triad
        for (let i = 0; i < rawArticles.length; i++) {
            const raw = rawArticles[i];
            run.currentArticle = raw.title;
            run.articlesProcessed = i;

            const article = {
                id: `art-${Date.now()}-${i}`,
                rawTitle: raw.title,
                rawBody: raw.body,
                rawSource: raw.source,
                rawSourceUrl: raw.sourceUrl,
                rawDate: raw.datePublished,
                rawImage: raw.image,
                category: raw.category,
                thesis: null,
                antithesis: null,
                synthesis: null,
                seo: null,
                status: 'processing',
                tokens: { input: 0, output: 0, total: 0 },
                timestamps: {
                    created: new Date().toISOString(),
                    thesisAt: null,
                    antithesisAt: null,
                    synthesisAt: null,
                    seoAt: null,
                },
            };

            try {
                // Stage 2: Generate Thesis (Ficha Factual — JSON)
                updateStage(run, `thesis-${i}`, 'in_progress');
                run.stage = 'thesis';
                const rawContent = `# ${raw.title}\n\nFonte: ${raw.source} (${raw.sourceUrl})\nData: ${raw.datePublished}\n\n${raw.body}`;
                const thesisResult = await generateThesis(rawContent);
                // Parse JSON output, fallback to raw text
                try {
                    const jsonMatch = thesisResult.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                        thesisResult.text.match(/\{[\s\S]*\}/);
                    article.thesis = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : thesisResult.text;
                } catch {
                    article.thesis = thesisResult.text;
                }
                article.timestamps.thesisAt = new Date().toISOString();
                addTokens(run, article, thesisResult.tokens);
                updateStage(run, `thesis-${i}`, 'complete');

                // Stage 3: Generate Antithesis (Mapa de Objeções — JSON)
                updateStage(run, `antithesis-${i}`, 'in_progress');
                run.stage = 'antithesis';
                const antithesisResult = await generateAntithesis(article.thesis);
                // Parse JSON output, fallback to raw text
                try {
                    const jsonMatch = antithesisResult.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                        antithesisResult.text.match(/\{[\s\S]*\}/);
                    article.antithesis = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : antithesisResult.text;
                } catch {
                    article.antithesis = antithesisResult.text;
                }
                article.timestamps.antithesisAt = new Date().toISOString();
                addTokens(run, article, antithesisResult.tokens);
                updateStage(run, `antithesis-${i}`, 'complete');

                // Stage 4: Generate Synthesis (Editorial Final Único)
                updateStage(run, `synthesis-${i}`, 'in_progress');
                run.stage = 'synthesis';
                const synthesisResult = await generateSynthesis(article.thesis, article.antithesis);
                article.synthesis = synthesisResult.text;
                article.timestamps.synthesisAt = new Date().toISOString();
                addTokens(run, article, synthesisResult.tokens);
                updateStage(run, `synthesis-${i}`, 'complete');

                // Stage 5: Generate SEO metadata
                updateStage(run, `seo-${i}`, 'in_progress');
                run.stage = 'seo';
                const seoResult = await generateSEO(article.synthesis);
                try {
                    // Try to parse as JSON, fallback to raw text
                    const jsonMatch = seoResult.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                        seoResult.text.match(/\{[\s\S]*\}/);
                    article.seo = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : { raw: seoResult.text };
                } catch {
                    article.seo = { raw: seoResult.text };
                }
                article.timestamps.seoAt = new Date().toISOString();
                addTokens(run, article, seoResult.tokens);
                updateStage(run, `seo-${i}`, 'complete');

                article.status = 'draft';
            } catch (err) {
                article.status = 'error';
                run.errors.push(`Article "${raw.title}": ${err.message}`);
                console.error(`[Pipeline] Error processing article: ${err.message}`);
            }

            articles.push(article);
            run.articlesProcessed = i + 1;

            // Auto-publish to WordPress if enabled
            if (autoPublish && article.status === 'draft' && isAuthenticated()) {
                try {
                    updateStage(run, `publish-${i}`, 'in_progress');
                    run.stage = 'publishing';
                    const result = await publishToWordPress({ article, asDraft: false });
                    if (result.success) {
                        article.status = 'published';
                        article.wpPostId = result.postId;
                        article.wpPostUrl = result.postUrl;
                        run.articlesPublished = (run.articlesPublished || 0) + 1;
                        console.log(`[Pipeline] 📤 Published: ${article.seo?.title || article.rawTitle}`);
                    }
                    updateStage(run, `publish-${i}`, 'complete');
                } catch (pubErr) {
                    run.errors.push(`Publish: ${pubErr.message}`);
                    console.error(`[Pipeline] Publish error: ${pubErr.message}`);
                }
            }
        }

        saveArticles(articles);
        run.status = 'complete';
        run.stage = 'done';
        run.completedAt = new Date().toISOString();
        run.currentArticle = null;

    } catch (err) {
        run.status = 'error';
        run.errors.push(err.message);
        console.error(`[Pipeline] Fatal error: ${err.message}`);
    }
}

function updateStage(run, stageName, status, meta = {}) {
    run.stages[stageName] = { status, updatedAt: new Date().toISOString(), ...meta };
}

function addTokens(run, article, tokens) {
    article.tokens.input += tokens.input;
    article.tokens.output += tokens.output;
    article.tokens.total += tokens.total;
    run.tokens.input += tokens.input;
    run.tokens.output += tokens.output;
    run.tokens.total += tokens.total;
}
