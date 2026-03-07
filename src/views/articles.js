/**
 * Articles View — List of processed articles with status filtering
 */

import { api } from '../api/client.js';

export function renderArticles(container) {
    container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Artigos</h1>
      <p class="view-subtitle">Todos os artigos processados pelo pipeline dialético</p>
    </div>

    <div style="display: flex; gap: var(--space-3); margin-bottom: var(--space-6);">
      <button class="btn btn-secondary active-filter" data-filter="all" id="filter-all">Todos</button>
      <button class="btn btn-secondary" data-filter="draft" id="filter-draft">📝 Rascunhos</button>
      <button class="btn btn-secondary" data-filter="published" id="filter-published">✅ Publicados</button>
      <button class="btn btn-secondary" data-filter="error" id="filter-error">❌ Erros</button>
    </div>

    <div class="articles-list" id="articles-list"></div>
  `;

    loadArticles('all');

    container.querySelectorAll('[data-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('active-filter'));
            btn.classList.add('active-filter');
            loadArticles(btn.dataset.filter);
        });
    });
}

async function loadArticles(filter) {
    const listEl = document.getElementById('articles-list');

    try {
        let articles = await api.getArticles();

        if (filter !== 'all') {
            articles = articles.filter((a) => a.status === filter);
        }

        if (articles.length === 0) {
            listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3 class="empty-state-title">Nenhum artigo ${filter !== 'all' ? `com status "${filter}"` : 'encontrado'}</h3>
          <p class="empty-state-text">Execute o pipeline no Dashboard para processar notícias.</p>
        </div>
      `;
            return;
        }

        listEl.innerHTML = articles.map((article) => `
      <div class="article-item" data-id="${article.id}" onclick="window.location.hash='#/editor/${article.id}'">
        <div class="article-status-indicator ${article.status}"></div>
        <div class="article-info">
          <div class="article-title">${article.rawTitle}</div>
          <div class="article-meta">
            <span>📡 ${article.rawSource}</span>
            <span>🏷️ ${article.category}</span>
            <span>🪙 ${article.tokens?.total || 0} tokens</span>
            <span>⏱️ ${formatTime(article.timestamps?.created)}</span>
          </div>
        </div>
        <span class="badge badge-${article.status}">${statusLabel(article.status)}</span>
        ${article.hasSynthesis ? '<button class="btn btn-sm btn-secondary">Ver Análise →</button>' : ''}
      </div>
    `).join('');
    } catch {
        listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Erro ao carregar artigos</h3>
        <p class="empty-state-text">Verifique se o servidor está rodando.</p>
      </div>
    `;
    }
}

function statusLabel(status) {
    const labels = {
        draft: 'Rascunho',
        published: 'Publicado',
        processing: 'Processando',
        error: 'Erro',
    };
    return labels[status] || status;
}

function formatTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
