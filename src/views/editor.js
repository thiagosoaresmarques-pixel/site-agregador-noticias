/**
 * Editor View — Side-by-side Thesis | Antithesis | Synthesis viewer
 */

import { api } from '../api/client.js';
import { showToast } from '../components/toast.js';
import { marked } from '/node_modules/marked/lib/marked.esm.js';

export function renderEditor(container, articleId) {
    if (!articleId) {
        renderEditorIndex(container);
        return;
    }

    container.innerHTML = `
    <div class="view-header">
      <div style="display: flex; align-items: center; gap: var(--space-4);">
        <a href="#/articles" class="btn btn-secondary btn-sm">← Voltar</a>
        <div>
          <h1 class="view-title" id="editor-title">Carregando...</h1>
          <p class="view-subtitle" id="editor-subtitle"></p>
        </div>
      </div>
    </div>

    <div style="display: flex; gap: var(--space-3); margin-bottom: var(--space-5);" id="editor-actions"></div>

    <div class="editor-grid" id="editor-grid">
      <div class="editor-column">
        <div class="editor-column-header thesis">🔵 Tese — Relato Factual</div>
        <div class="editor-column-content" id="col-thesis"><div class="spinner" style="margin: var(--space-8) auto;"></div></div>
      </div>
      <div class="editor-column">
        <div class="editor-column-header antithesis">🔴 Antítese — Contra-Argumentos</div>
        <div class="editor-column-content" id="col-antithesis"><div class="spinner" style="margin: var(--space-8) auto;"></div></div>
      </div>
      <div class="editor-column">
        <div class="editor-column-header synthesis">🟣 Síntese — Versão Superior</div>
        <div class="editor-column-content" id="col-synthesis"><div class="spinner" style="margin: var(--space-8) auto;"></div></div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-6);" id="seo-section"></div>
  `;

    loadArticle(articleId);
}

async function loadArticle(id) {
    try {
        const article = await api.getArticle(id);

        document.getElementById('editor-title').textContent = article.rawTitle;
        document.getElementById('editor-subtitle').innerHTML = `
      <span>📡 ${article.rawSource}</span> · 
      <span>🏷️ ${article.category}</span> · 
      <span class="badge badge-${article.status}">${article.status}</span>
    `;

        // Render dialectical columns
        document.getElementById('col-thesis').innerHTML = article.thesis
            ? marked.parse(article.thesis)
            : '<p style="color: var(--text-muted);">Tese ainda não processada.</p>';

        document.getElementById('col-antithesis').innerHTML = article.antithesis
            ? marked.parse(article.antithesis)
            : '<p style="color: var(--text-muted);">Antítese ainda não processada.</p>';

        document.getElementById('col-synthesis').innerHTML = article.synthesis
            ? marked.parse(article.synthesis)
            : '<p style="color: var(--text-muted);">Síntese ainda não processada.</p>';

        // Actions
        const actionsEl = document.getElementById('editor-actions');
        if (article.status === 'draft') {
            actionsEl.innerHTML = `
        <button class="btn btn-success" id="btn-publish-draft">📤 Publicar como Rascunho no WP</button>
        <button class="btn btn-primary" id="btn-publish-live">🚀 Publicar Ao Vivo</button>
      `;
            document.getElementById('btn-publish-draft').addEventListener('click', () => publishArticle(article.id, true));
            document.getElementById('btn-publish-live').addEventListener('click', () => publishArticle(article.id, false));
        }

        // SEO section
        const seoEl = document.getElementById('seo-section');
        if (article.seo) {
            const seo = typeof article.seo === 'string' ? { raw: article.seo } : article.seo;
            seoEl.innerHTML = `
        <h3 style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-4);">🔍 Metadados SEO</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          ${seo.title ? `<div><div class="form-label">Title Tag</div><div>${seo.title}</div></div>` : ''}
          ${seo.slug ? `<div><div class="form-label">Slug</div><div>/${seo.slug}</div></div>` : ''}
          ${seo.metaDescription ? `<div style="grid-column: 1/-1;"><div class="form-label">Meta Description</div><div>${seo.metaDescription}</div></div>` : ''}
          ${seo.tags ? `<div style="grid-column: 1/-1;"><div class="form-label">Tags</div><div>${seo.tags.map(t => `<span class="badge badge-draft" style="margin-right: 4px;">${t}</span>`).join('')}</div></div>` : ''}
          ${seo.raw ? `<div style="grid-column: 1/-1;"><div class="form-label">SEO Data (Raw)</div><pre style="background: var(--bg-glass); padding: var(--space-3); border-radius: var(--radius-sm); font-size: var(--font-size-xs); overflow-x: auto; max-height: 200px;">${seo.raw}</pre></div>` : ''}
        </div>
      `;
        } else {
            seoEl.innerHTML = '<p style="color: var(--text-muted); padding: var(--space-4);">SEO metadata não disponível.</p>';
        }

    } catch (error) {
        document.getElementById('editor-title').textContent = 'Erro ao carregar';
        document.getElementById('col-thesis').innerHTML = `<p style="color: var(--accent-error);">${error.message}</p>`;
        document.getElementById('col-antithesis').innerHTML = '';
        document.getElementById('col-synthesis').innerHTML = '';
    }
}

async function publishArticle(id, asDraft) {
    try {
        const result = await api.publishArticle(id, asDraft);
        if (result.success) {
            showToast(`Artigo ${asDraft ? 'salvo como rascunho' : 'publicado'} no WordPress!`, 'success');
        } else {
            showToast(result.error || 'Erro ao publicar', 'error');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function renderEditorIndex(container) {
    container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Editor Dialético</h1>
      <p class="view-subtitle">Selecione um artigo na lista para visualizar a análise Tese | Antítese | Síntese</p>
    </div>
    <div class="empty-state">
      <div class="empty-state-icon">✍️</div>
      <h3 class="empty-state-title">Nenhum artigo selecionado</h3>
      <p class="empty-state-text">Vá para a seção de Artigos e clique em um artigo para abrir o editor dialético.</p>
      <a href="#/articles" class="btn btn-primary">📰 Ver Artigos</a>
    </div>
  `;
}
