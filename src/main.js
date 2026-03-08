/**
 * Main Application — SPA Router & Initialization
 */

import { renderDashboard, cleanupDashboard } from './views/dashboard.js';
import { renderArticles } from './views/articles.js';
import { renderEditor } from './views/editor.js';
import { renderSettings } from './views/settings.js';
import { renderLogin } from './views/login.js';
import { api, checkAuth, logout, isAuthenticated } from './api/client.js';

const viewContainer = document.getElementById('view-container');
const sidebar = document.getElementById('sidebar');

// ─── Router ───────────────────────────────────────────
function getRoute() {
    const hash = window.location.hash || '#/';
    const parts = hash.replace('#/', '').split('/');
    return {
        view: parts[0] || 'dashboard',
        param: parts[1] || null,
    };
}

async function navigate() {
    const { view, param } = getRoute();

    // Cleanup previous view
    cleanupDashboard();

    // Check auth before rendering protected views
    if (view !== 'login') {
        const authStatus = await checkAuth();
        if (authStatus.authRequired && !authStatus.authenticated) {
            sidebar.style.display = 'none';
            renderLogin(viewContainer, () => {
                sidebar.style.display = '';
                window.location.hash = '#/';
                navigate();
            });
            return;
        }
    }

    // Show sidebar for authenticated views
    sidebar.style.display = '';

    // Handle login route explicitly
    if (view === 'login') {
        sidebar.style.display = 'none';
        renderLogin(viewContainer, () => {
            sidebar.style.display = '';
            window.location.hash = '#/';
            navigate();
        });
        return;
    }

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.toggle('active', link.dataset.view === (view || 'dashboard'));
    });

    // Animate transition
    viewContainer.style.animation = 'none';
    viewContainer.offsetHeight; // force reflow
    viewContainer.style.animation = 'fadeIn 0.3s ease';

    // Render view
    switch (view) {
        case 'articles':
            renderArticles(viewContainer);
            break;
        case 'editor':
            renderEditor(viewContainer, param);
            break;
        case 'settings':
            renderSettings(viewContainer);
            break;
        case 'dashboard':
        default:
            renderDashboard(viewContainer);
            break;
    }
}

// ─── Server Status ────────────────────────────────────
async function checkServerStatus() {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');

    try {
        const health = await api.health();
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Servidor online';
    } catch {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Servidor offline';
    }
}

// ─── Logout Button ────────────────────────────────────
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// ─── WordPress OAuth Handler ──────────────────────────
async function handleWordPressOAuth() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    // Remove the code from URL
    window.history.replaceState({}, '', '/');

    try {
        const res = await fetch('http://localhost:3001/api/wordpress/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ WordPress.com conectado com sucesso!');
        } else {
            alert('❌ Erro ao conectar: ' + (data.error || 'Desconhecido'));
        }
    } catch (err) {
        alert('❌ Erro de rede: ' + err.message);
    }
}

// ─── Init ─────────────────────────────────────────────
window.addEventListener('hashchange', navigate);
window.addEventListener('load', () => {
    handleWordPressOAuth();
    setupLogout();
    navigate();
    checkServerStatus();
    // Check server status every 30s
    setInterval(checkServerStatus, 30000);
});
