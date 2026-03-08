/**
 * API Client — communicates with the Express backend
 * Includes auth token handling
 */

const BASE_URL = '/api';

/**
 * Get stored auth token
 */
export function getToken() {
    return localStorage.getItem('auth_token');
}

/**
 * Check if user has a stored token
 */
export function isAuthenticated() {
    return !!getToken();
}

/**
 * Remove auth token (logout)
 */
export function logout() {
    localStorage.removeItem('auth_token');
    window.location.hash = '#/login';
    window.location.reload();
}

/**
 * Check if auth is required and token is valid
 */
export async function checkAuth() {
    try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${BASE_URL}/auth/check`, { headers });
        return await res.json();
    } catch {
        return { authenticated: false, authRequired: false };
    }
}

async function request(path, options = {}) {
    try {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
        });

        // Handle 401 — redirect to login
        if (response.status === 401 && !path.startsWith('/auth')) {
            localStorage.removeItem('auth_token');
            window.location.hash = '#/login';
            window.location.reload();
            throw new Error('Sessão expirada. Faça login novamente.');
        }

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

    updateArticle: (id, data) =>
        request(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

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
