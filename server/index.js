/**
 * Express API Server
 * Serves the backend for the dialectical news pipeline
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, createToken, verifyToken } from './middleware/auth.js';
import { initGemini } from './services/geminiClient.js';
import {
    runPipeline,
    getPipelineStatus,
    getAllPipelineRuns,
    getArticles,
    getArticleById,
    initArticleStorage,
} from './services/pipeline.js';
import { publishToWordPress, isAuthenticated, getStatus } from './services/wordpressClient.js';
import { updateArticleStatus } from './services/pipeline.js';
import {
    initScheduler,
    startScheduler,
    stopScheduler,
    getSchedulerStatus,
    updateSchedulerConfig,
    getSchedulerHistory,
    triggerManualScheduledRun,
} from './services/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requireAuth);

// Initialize Gemini if key is available
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    initGemini(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite');
} else {
    console.warn('[Server] GEMINI_API_KEY not configured. Pipeline will not process articles via AI.');
}

// Serve static files in production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
}

// Initialize storage and scheduler
await initArticleStorage();
initScheduler();

// ─── Auth ─────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (!process.env.DASHBOARD_PASSWORD) {
        return res.json({ success: true, token: createToken(), message: 'Auth disabled (no password set)' });
    }
    if (password !== process.env.DASHBOARD_PASSWORD) {
        return res.status(401).json({ error: 'Senha incorreta' });
    }
    res.json({ success: true, token: createToken() });
});

app.get('/api/auth/check', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!process.env.DASHBOARD_PASSWORD) {
        return res.json({ authenticated: true, authRequired: false });
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ authenticated: false, authRequired: true });
    }
    const payload = verifyToken(authHeader.slice(7));
    res.json({ authenticated: !!payload, authRequired: true });
});

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
        newsApiConfigured: !!(process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'your_newsapi_ai_key_here'),
        wordpressConfigured: !!(process.env.WP_URL),
        wordpressConnected: isAuthenticated(),
        authEnabled: !!process.env.DASHBOARD_PASSWORD,
    });
});

// ─── Pipeline ─────────────────────────────────────────────
app.post('/api/pipeline/run', async (req, res) => {
    try {
        const { category = 'politica', language = 'por', maxArticles = 5, sortBy = 'date', period = '3days', sourceFilter = '', skipDuplicates = true } = req.body;

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.status(400).json({
                error: 'GEMINI_API_KEY not configured',
                message: 'Add your Gemini API key to the .env file to run the pipeline.',
            });
        }

        const runId = await runPipeline({
            newsApiKey: process.env.NEWS_API_KEY,
            category,
            language,
            maxArticles,
            sortBy,
            period,
            sourceFilter,
            skipDuplicates,
        });

        res.json({ runId, message: 'Pipeline started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/pipeline/status/:runId', (req, res) => {
    const status = getPipelineStatus(req.params.runId);
    if (!status) {
        return res.status(404).json({ error: 'Pipeline run not found' });
    }
    res.json(status);
});

app.get('/api/pipeline/runs', (req, res) => {
    res.json(getAllPipelineRuns());
});

// ─── Articles ─────────────────────────────────────────────
app.get('/api/articles', (req, res) => {
    const articles = getArticles();
    // Return summary (no full body for list view)
    const summaries = articles.map((a) => ({
        id: a.id,
        rawTitle: a.rawTitle,
        rawSource: a.rawSource,
        category: a.category,
        status: a.status,
        tokens: a.tokens,
        timestamps: a.timestamps,
        hasSynthesis: !!a.synthesis,
        hasSeo: !!a.seo,
    }));
    res.json(summaries);
});

app.get('/api/articles/:id', (req, res) => {
    const article = getArticleById(req.params.id);
    if (!article) {
        return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
});

// ─── WordPress Self-Hosted ────────────────────────────────
// Update article content (editor save)
app.put('/api/articles/:id', (req, res) => {
    const article = getArticleById(req.params.id);
    if (!article) {
        return res.status(404).json({ error: 'Article not found' });
    }

    const { thesis, antithesis, synthesis, seo } = req.body;
    const updates = {};
    if (thesis !== undefined) updates.thesis = thesis;
    if (antithesis !== undefined) updates.antithesis = antithesis;
    if (synthesis !== undefined) updates.synthesis = synthesis;
    if (seo !== undefined) updates.seo = { ...article.seo, ...seo };

    const updated = updateArticleStatus(article.id, article.status, updates);
    res.json({ success: true, article: updated });
});

// Check WordPress connection status
app.get('/api/wordpress/status', async (req, res) => {
    const status = await getStatus();
    res.json(status);
});

// Publish article to WordPress.com
app.post('/api/articles/:id/publish', async (req, res) => {
    try {
        const article = getArticleById(req.params.id);
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        const { asDraft = true } = req.body;

        const result = await publishToWordPress({
            article,
            asDraft,
        });

        if (result.success) {
            updateArticleStatus(article.id, asDraft ? 'draft' : 'published', {
                wpPostId: result.postId,
                wpPostUrl: result.postUrl,
                publishedAt: new Date().toISOString(),
            });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── n8n Webhook ──────────────────────────────────────────
app.post('/api/webhook/trigger', async (req, res) => {
    try {
        const { category = 'politica', maxArticles = 5, language = 'por', publishAsDraft = true, sortBy = 'date', period = '3days' } = req.body;

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.status(400).json({ error: 'GEMINI_API_KEY not configured' });
        }

        const runId = await runPipeline({
            newsApiKey: process.env.NEWS_API_KEY,
            category,
            language,
            maxArticles,
            sortBy,
            period,
        });

        res.json({
            runId,
            message: 'Pipeline triggered via webhook',
            statusUrl: `/api/pipeline/status/${runId}`,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Scheduler ────────────────────────────────────────────
app.get('/api/scheduler/status', (req, res) => {
    res.json(getSchedulerStatus());
});

app.post('/api/scheduler/start', (req, res) => {
    try {
        const result = startScheduler(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/scheduler/stop', (req, res) => {
    const result = stopScheduler();
    res.json(result);
});

app.post('/api/scheduler/config', (req, res) => {
    try {
        const result = updateSchedulerConfig(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/scheduler/history', (req, res) => {
    res.json(getSchedulerHistory());
});

app.post('/api/scheduler/trigger', (req, res) => {
    const result = triggerManualScheduledRun();
    res.json(result);
});

// ─── Stats & Analytics ────────────────────────────────────
app.get('/api/stats', (req, res) => {
    const articles = getArticles();
    const runs = getAllPipelineRuns();
    const history = getSchedulerHistory();

    const totalTokens = articles.reduce((sum, a) => sum + (a.tokens?.total || 0), 0);
    const publishedArticles = articles.filter((a) => a.status === 'published');
    const errorArticles = articles.filter((a) => a.status === 'error');

    // Per-category breakdown
    const categoryMap = {};
    articles.forEach((a) => {
        const cat = a.category || 'sem-categoria';
        if (!categoryMap[cat]) categoryMap[cat] = { total: 0, published: 0, errors: 0, tokens: 0 };
        categoryMap[cat].total++;
        if (a.status === 'published') categoryMap[cat].published++;
        if (a.status === 'error') categoryMap[cat].errors++;
        categoryMap[cat].tokens += a.tokens?.total || 0;
    });

    // Daily timeline (last 7 days)
    const timeline = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayArticles = articles.filter((a) => {
            const created = a.timestamps?.created || a.timestamps?.fetched;
            return created && created.startsWith(dateStr);
        });
        timeline.push({
            date: dateStr,
            label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
            total: dayArticles.length,
            published: dayArticles.filter((a) => a.status === 'published').length,
            errors: dayArticles.filter((a) => a.status === 'error').length,
        });
    }

    // Top sources
    const sourceMap = {};
    articles.forEach((a) => {
        const src = a.rawSource || 'Desconhecido';
        sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const topSources = Object.entries(sourceMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    // Scheduler performance
    const schedulerRuns = history.length;
    const schedulerSuccess = history.filter((r) => r.status === 'complete').length;

    res.json({
        totalArticles: articles.length,
        draftArticles: articles.filter((a) => a.status === 'draft').length,
        publishedArticles: publishedArticles.length,
        errorArticles: errorArticles.length,
        totalPipelineRuns: runs.length,
        totalTokensUsed: totalTokens,
        estimatedCost: `$${((totalTokens / 1000000) * 0.875).toFixed(4)}`,
        avgTokensPerArticle: articles.length > 0 ? Math.round(totalTokens / articles.length) : 0,
        errorRate: articles.length > 0 ? ((errorArticles.length / articles.length) * 100).toFixed(1) : '0.0',
        categories: categoryMap,
        timeline,
        topSources,
        scheduler: {
            totalRuns: schedulerRuns,
            successRate: schedulerRuns > 0 ? ((schedulerSuccess / schedulerRuns) * 100).toFixed(1) : '100',
            lastRun: history[0] || null,
        },
    });
});

// ─── SPA Fallback (production) ────────────────────────────
if (process.env.NODE_ENV === 'production') {
    app.get('{*path}', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
    const isProd = process.env.NODE_ENV === 'production';
    console.log(`\n🔮 Dialética News Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: ${isProd ? `http://localhost:${PORT}` : 'http://localhost:5173'}`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth: ${process.env.DASHBOARD_PASSWORD ? 'ENABLED' : 'DISABLED (set DASHBOARD_PASSWORD)'}\n`);
});
