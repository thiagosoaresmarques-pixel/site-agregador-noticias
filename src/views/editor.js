/**
 * Editor View — Enhanced dialectical article editor
 * Features: editable content, source preview, word counts, editable SEO, save draft
 */

import { api } from '../api/client.js';
import { showToast } from '../components/toast.js';
import { marked } from '/node_modules/marked/lib/marked.esm.js';

let currentArticle = null;

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

    <!-- Toolbar -->
    <div class="editor-toolbar" id="editor-toolbar">
      <div class="editor-toolbar-left">
        <button class="btn btn-sm btn-secondary active-tab" data-tab="edit" id="tab-edit">✏️ Editar</button>
        <button class="btn btn-sm btn-secondary" data-tab="preview" id="tab-preview">👁️ Preview</button>
        <button class="btn btn-sm btn-secondary" data-tab="source" id="tab-source">📰 Fonte Original</button>
      </div>
      <div class="editor-toolbar-right" id="editor-actions"></div>
    </div>

    <!-- Stats Bar -->
    <div class="editor-stats" id="editor-stats"></div>

    <!-- Tab: Edit Mode -->
    <div class="editor-tab-content" id="tab-content-edit">
      <div class="editor-grid" id="editor-grid">
        <div class="editor-column">
          <div class="editor-column-header thesis">
            🔵 Tese — Relato Factual
            <span class="word-count" id="wc-thesis">0 palavras</span>
          </div>
          <div class="editor-column-content" id="col-thesis" contenteditable="true" data-section="thesis"></div>
        </div>
        <div class="editor-column">
          <div class="editor-column-header antithesis">
            🔴 Antítese — Contra-Argumentos
            <span class="word-count" id="wc-antithesis">0 palavras</span>
          </div>
          <div class="editor-column-content" id="col-antithesis" contenteditable="true" data-section="antithesis"></div>
        </div>
        <div class="editor-column">
          <div class="editor-column-header synthesis">
            🟢 Síntese — Visão Integrada
            <span class="word-count" id="wc-synthesis">0 palavras</span>
          </div>
          <div class="editor-column-content" id="col-synthesis" contenteditable="true" data-section="synthesis"></div>
        </div>
      </div>
    </div>

    <!-- Tab: Preview Mode -->
    <div class="editor-tab-content" id="tab-content-preview" style="display:none;">
      <div class="editor-preview-container" id="preview-container"></div>
    </div>

    <!-- Tab: Source Mode -->
    <div class="editor-tab-content" id="tab-content-source" style="display:none;">
      <div class="card" id="source-container"></div>
    </div>

    <!-- SEO Section (always visible, editable) -->
    <div class="card editor-seo-card" id="seo-section" style="margin-top: var(--space-6);"></div>
  `;

  // Tab switching
  container.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab, container));
  });

  // Word count updates
  ['col-thesis', 'col-antithesis', 'col-synthesis'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => updateWordCount(id));
    }
  });

  loadArticle(articleId);
}

function switchTab(tabName, container) {
  // Update tab buttons
  container.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.toggle('active-tab', btn.dataset.tab === tabName);
  });

  // Show/hide content
  document.getElementById('tab-content-edit').style.display = tabName === 'edit' ? '' : 'none';
  document.getElementById('tab-content-preview').style.display = tabName === 'preview' ? '' : 'none';
  document.getElementById('tab-content-source').style.display = tabName === 'source' ? '' : 'none';

  // Generate preview if needed
  if (tabName === 'preview') {
    generatePreview();
  }
}

function generatePreview() {
  const container = document.getElementById('preview-container');
  if (!currentArticle) return;

  const thesis = document.getElementById('col-thesis')?.innerText || '';
  const antithesis = document.getElementById('col-antithesis')?.innerText || '';
  const synthesis = document.getElementById('col-synthesis')?.innerText || '';

  container.innerHTML = `
    <div class="preview-article">
      <h1 class="preview-title">${currentArticle.seo?.title || currentArticle.rawTitle}</h1>
      <div class="preview-meta">
        <span>🏷️ ${currentArticle.category}</span>
        <span>📡 ${currentArticle.rawSource}</span>
      </div>
      <div class="dialectical-section section-thesis" style="margin-top: var(--space-5);">
        <span class="section-badge">🔵 Tese — O Relato Factual</span>
        <div class="section-content">${marked.parse(thesis)}</div>
      </div>
      <div class="dialectical-section section-antithesis">
        <span class="section-badge">🔴 Antítese — O Contra-Argumento</span>
        <div class="section-content">${marked.parse(antithesis)}</div>
      </div>
      <div class="dialectical-section section-synthesis">
        <span class="section-badge">🟢 Síntese — Visão Integrada</span>
        <div class="section-content">${marked.parse(synthesis)}</div>
      </div>
    </div>
  `;
}

function updateWordCount(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const text = el.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const section = el.dataset.section;
  const wcEl = document.getElementById(`wc-${section}`);
  if (wcEl) wcEl.textContent = `${words} palavras`;

  updateTotalStats();
}

function updateTotalStats() {
  const statsEl = document.getElementById('editor-stats');
  if (!statsEl) return;

  let totalWords = 0;
  ['col-thesis', 'col-antithesis', 'col-synthesis'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const text = el.innerText.trim();
      totalWords += text ? text.split(/\s+/).length : 0;
    }
  });

  const tokens = currentArticle?.tokens || {};
  statsEl.innerHTML = `
    <span>📝 ${totalWords} palavras total</span>
    <span>🪙 ${tokens.total || 0} tokens usados</span>
    <span>📤 ${tokens.input || 0} input</span>
    <span>📥 ${tokens.output || 0} output</span>
    <span>🏷️ ${currentArticle?.category || '—'}</span>
  `;
}

async function loadArticle(id) {
  try {
    const article = await api.getArticle(id);
    currentArticle = article;

    document.getElementById('editor-title').textContent = article.rawTitle;
    document.getElementById('editor-subtitle').innerHTML = `
      <span>📡 ${article.rawSource}</span> · 
      <span>🏷️ ${article.category}</span> · 
      <span class="badge badge-${article.status}">${article.status}</span>
      ${article.wpPostUrl ? ` · <a href="${article.wpPostUrl}" target="_blank" class="btn btn-sm btn-secondary">🔗 Ver no WP</a>` : ''}
    `;

    // Render editable columns
    const thesisEl = document.getElementById('col-thesis');
    const antiEl = document.getElementById('col-antithesis');
    const synthEl = document.getElementById('col-synthesis');

    thesisEl.innerText = article.thesis || '';
    antiEl.innerText = article.antithesis || '';
    synthEl.innerText = article.synthesis || '';

    // Update word counts
    ['col-thesis', 'col-antithesis', 'col-synthesis'].forEach(updateWordCount);

    // Actions
    const actionsEl = document.getElementById('editor-actions');
    let buttons = '';

    if (article.status === 'draft' || article.status === 'processed') {
      buttons += `
        <button class="btn btn-sm btn-secondary" id="btn-save-changes">💾 Salvar</button>
        <button class="btn btn-sm btn-success" id="btn-publish-draft">📤 Rascunho WP</button>
        <button class="btn btn-sm btn-primary" id="btn-publish-live">🚀 Publicar</button>
      `;
    } else if (article.status === 'published') {
      buttons += `<button class="btn btn-sm btn-secondary" id="btn-save-changes">💾 Salvar Alterações</button>`;
    }
    actionsEl.innerHTML = buttons;

    // Bind events
    const saveBtn = document.getElementById('btn-save-changes');
    if (saveBtn) saveBtn.addEventListener('click', () => saveChanges(article.id));
    const draftBtn = document.getElementById('btn-publish-draft');
    if (draftBtn) draftBtn.addEventListener('click', () => publishArticle(article.id, true));
    const liveBtn = document.getElementById('btn-publish-live');
    if (liveBtn) liveBtn.addEventListener('click', () => publishArticle(article.id, false));

    // Source tab
    const sourceEl = document.getElementById('source-container');
    sourceEl.innerHTML = `
      <h3 style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-4);">📰 Fonte Original</h3>
      <div style="display: grid; gap: var(--space-4);">
        <div>
          <div class="form-label">Título</div>
          <div style="font-weight: 600;">${article.rawTitle}</div>
        </div>
        <div>
          <div class="form-label">Fonte</div>
          <div>${article.rawSource} ${article.rawSourceUrl ? `— <a href="${article.rawSourceUrl}" target="_blank" rel="noopener">Abrir original ↗</a>` : ''}</div>
        </div>
        <div>
          <div class="form-label">Texto Original (${article.rawBody ? article.rawBody.split(/\s+/).length : 0} palavras)</div>
          <div class="source-body" style="background: var(--bg-glass); padding: var(--space-4); border-radius: var(--radius-md); max-height: 400px; overflow-y: auto; font-size: var(--font-size-sm); line-height: 1.7; white-space: pre-wrap;">${escapeHtml(article.rawBody || 'Texto original não disponível.')}</div>
        </div>
      </div>
    `;

    // SEO section (editable)
    renderSeoSection(article);

  } catch (error) {
    document.getElementById('editor-title').textContent = 'Erro ao carregar';
    showToast(error.message, 'error');
  }
}

function renderSeoSection(article) {
  const seoEl = document.getElementById('seo-section');
  const seo = article.seo || {};

  seoEl.innerHTML = `
    <h3 style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-4);">🔍 SEO & Metadados</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
      <div>
        <label class="form-label" for="seo-title">Title Tag</label>
        <input type="text" id="seo-title" class="form-input" value="${escapeAttr(seo.title || article.rawTitle || '')}">
      </div>
      <div>
        <label class="form-label" for="seo-slug">Slug</label>
        <input type="text" id="seo-slug" class="form-input" value="${escapeAttr(seo.slug || '')}">
      </div>
      <div style="grid-column: 1/-1;">
        <label class="form-label" for="seo-desc">Meta Description</label>
        <textarea id="seo-desc" class="form-input" rows="2" style="resize: vertical;">${escapeHtml(seo.metaDescription || seo.excerpt || '')}</textarea>
      </div>
      <div>
        <label class="form-label" for="seo-category">Categoria</label>
        <input type="text" id="seo-category" class="form-input" value="${escapeAttr(seo.category || article.category || '')}">
      </div>
      <div>
        <label class="form-label" for="seo-tags">Tags (separadas por vírgula)</label>
        <input type="text" id="seo-tags" class="form-input" value="${escapeAttr((seo.tags || []).join(', '))}">
      </div>
    </div>
  `;
}

async function saveChanges(id) {
  const thesis = document.getElementById('col-thesis')?.innerText || '';
  const antithesis = document.getElementById('col-antithesis')?.innerText || '';
  const synthesis = document.getElementById('col-synthesis')?.innerText || '';

  const seo = {
    title: document.getElementById('seo-title')?.value || '',
    slug: document.getElementById('seo-slug')?.value || '',
    metaDescription: document.getElementById('seo-desc')?.value || '',
    category: document.getElementById('seo-category')?.value || '',
    tags: (document.getElementById('seo-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
  };

  try {
    await api.updateArticle(id, { thesis, antithesis, synthesis, seo });
    showToast('💾 Alterações salvas!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function publishArticle(id, asDraft) {
  // Save changes first
  await saveChanges(id);

  try {
    const result = await api.publishArticle(id, asDraft);
    if (result.success) {
      showToast(`${asDraft ? '📤 Rascunho salvo' : '🚀 Publicado'} no WordPress!`, 'success');
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
      <p class="view-subtitle">Selecione um artigo para revisar e editar a análise Tese | Antítese | Síntese</p>
    </div>
    <div class="empty-state">
      <div class="empty-state-icon">✍️</div>
      <h3 class="empty-state-title">Nenhum artigo selecionado</h3>
      <p class="empty-state-text">Vá para a seção de Artigos e clique em um artigo para abrir o editor dialético.</p>
      <a href="#/articles" class="btn btn-primary">📰 Ver Artigos</a>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
