/**
 * API Client — communicates with the Express backend
 */

const BASE_URL = '/api';

async function request(path, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`[API] ${options.method || 'GET'} ${path} failed:`, error.message);
        throw error;
    }
}

export const api = {
    // Health
    health: () => request('/health'),

    // Stats
    getStats: () => request('/stats'),

    // Pipeline
    runPipeline: (params = {}) =>
        request('/pipeline/run', { method: 'POST', body: JSON.stringify(params) }),

    getPipelineStatus: (runId) => request(`/pipeline/status/${runId}`),

    getPipelineRuns: () => request('/pipeline/runs'),

    // Articles
    getArticles: () => request('/articles'),

    getArticle: (id) => request(`/articles/${id}`),

    publishArticle: (id, asDraft = true) =>
        request(`/articles/${id}/publish`, {
            method: 'POST',
            body: JSON.stringify({ asDraft }),
        }),

    // Scheduler
    getSchedulerStatus: () => request('/scheduler/status'),

    startScheduler: (config = {}) =>
        request('/scheduler/start', { method: 'POST', body: JSON.stringify(config) }),

    stopScheduler: () =>
        request('/scheduler/stop', { method: 'POST' }),

    updateSchedulerConfig: (config) =>
        request('/scheduler/config', { method: 'POST', body: JSON.stringify(config) }),

    getSchedulerHistory: () => request('/scheduler/history'),

    triggerSchedulerRun: () =>
        request('/scheduler/trigger', { method: 'POST' }),
};
