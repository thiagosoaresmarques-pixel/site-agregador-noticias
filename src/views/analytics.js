/**
 * Analytics View — Detailed metrics, charts, and insights
 * Pure CSS charts (no external charting library)
 */

import { api } from '../api/client.js';

const CATEGORY_LABELS = {
    'politica': 'Política', 'economia': 'Economia', 'tecnologia': 'Tecnologia',
    'ciencia': 'Ciência', 'saude': 'Saúde', 'esportes': 'Esportes',
    'geral': 'Geral', 'educacao': 'Educação', 'meio-ambiente': 'Meio Ambiente',
    'internacional': 'Internacional', 'sem-categoria': 'Sem categoria',
};

const CATEGORY_COLORS = [
    '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
];

export async function renderAnalytics(container) {
    container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">📈 Analytics</h1>
      <p class="view-subtitle">Métricas detalhadas de publicação, custos e desempenho</p>
    </div>
    <div id="analytics-content">
      <div class="analytics-loading">
        <div class="spinner"></div>
        <p>Carregando métricas...</p>
      </div>
    </div>`;

    try {
        const stats = await api.getStats();
        renderAnalyticsContent(stats);
    } catch (err) {
        document.getElementById('analytics-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3 class="empty-state-title">Servidor não disponível</h3>
          <p class="empty-state-text">${err.message}</p>
        </div>`;
    }
}

function renderAnalyticsContent(stats) {
    const content = document.getElementById('analytics-content');

    content.innerHTML = `
    <!-- KPI Cards -->
    <div class="analytics-kpi-grid">
      ${kpiCard('📰', stats.totalArticles, 'Total de Artigos', '')}
      ${kpiCard('✅', stats.publishedArticles, 'Publicados', `${stats.totalArticles > 0 ? ((stats.publishedArticles / stats.totalArticles) * 100).toFixed(0) : 0}%`)}
      ${kpiCard('❌', stats.errorArticles, 'Erros', `${stats.errorRate}%`)}
      ${kpiCard('💰', stats.estimatedCost, 'Custo Estimado', `${formatTokens(stats.avgTokensPerArticle)} tok/art`)}
      ${kpiCard('🪙', formatTokens(stats.totalTokensUsed), 'Tokens Usados', `${stats.totalPipelineRuns} execuções`)}
      ${kpiCard('⏰', stats.scheduler.totalRuns, 'Runs Agendados', `${stats.scheduler.successRate}% sucesso`)}
    </div>

    <!-- Charts Row -->
    <div class="analytics-charts-row">
      <!-- Timeline Chart -->
      <div class="analytics-card analytics-card-wide">
        <h3 class="analytics-card-title">📊 Publicações (últimos 7 dias)</h3>
        <div class="analytics-chart-bar" id="timeline-chart"></div>
      </div>

      <!-- Category Donut -->
      <div class="analytics-card">
        <h3 class="analytics-card-title">🏷️ Por Categoria</h3>
        <div id="category-chart"></div>
      </div>
    </div>

    <!-- Details Row -->
    <div class="analytics-charts-row">
      <!-- Top Sources -->
      <div class="analytics-card">
        <h3 class="analytics-card-title">📡 Fontes Mais Usadas</h3>
        <div id="sources-list"></div>
      </div>

      <!-- Category Table -->
      <div class="analytics-card analytics-card-wide">
        <h3 class="analytics-card-title">📋 Detalhamento por Categoria</h3>
        <div id="category-table"></div>
      </div>
    </div>
  `;

    renderTimelineChart(stats.timeline);
    renderCategoryChart(stats.categories);
    renderSourcesList(stats.topSources);
    renderCategoryTable(stats.categories);
}

function kpiCard(icon, value, label, sub) {
    return `
    <div class="stat-card card-glow">
      <div class="stat-icon">${icon}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
      ${sub ? `<div class="analytics-kpi-sub">${sub}</div>` : ''}
    </div>`;
}

function renderTimelineChart(timeline) {
    const chart = document.getElementById('timeline-chart');
    const maxVal = Math.max(...timeline.map((d) => d.total), 1);

    chart.innerHTML = timeline.map((d) => {
        const h = Math.max((d.total / maxVal) * 140, 4);
        const pubH = d.total > 0 ? Math.max((d.published / maxVal) * 140, 2) : 0;
        const errH = d.total > 0 ? Math.max((d.errors / maxVal) * 140, 0) : 0;
        return `
        <div class="bar-group">
          <div class="bar-tooltip">${d.total} total · ${d.published} pub · ${d.errors} err</div>
          <div class="bar-stack" style="height: ${h}px">
            <div class="bar-segment bar-published" style="height: ${pubH}px" title="Publicados"></div>
            <div class="bar-segment bar-errors" style="height: ${errH}px" title="Erros"></div>
          </div>
          <div class="bar-label">${d.label}</div>
        </div>`;
    }).join('');
}

function renderCategoryChart(categories) {
    const chart = document.getElementById('category-chart');
    const entries = Object.entries(categories).sort(([, a], [, b]) => b.total - a.total);
    const total = entries.reduce((s, [, v]) => s + v.total, 0) || 1;

    chart.innerHTML = `
    <div class="donut-legend">
      ${entries.map(([cat, data], i) => {
        const pct = ((data.total / total) * 100).toFixed(0);
        return `
        <div class="legend-item">
          <span class="legend-dot" style="background: ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}"></span>
          <span class="legend-label">${CATEGORY_LABELS[cat] || cat}</span>
          <span class="legend-value">${data.total} (${pct}%)</span>
        </div>`;
    }).join('')}
    </div>
    <div class="donut-bar">
      ${entries.map(([, data], i) => {
        const width = ((data.total / total) * 100).toFixed(1);
        return `<div class="donut-bar-seg" style="width: ${width}%; background: ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}" title="${data.total}"></div>`;
    }).join('')}
    </div>`;
}

function renderSourcesList(sources) {
    const list = document.getElementById('sources-list');
    if (!sources || sources.length === 0) {
        list.innerHTML = '<div class="analytics-empty">Sem dados de fontes</div>';
        return;
    }
    const maxCount = sources[0]?.count || 1;

    list.innerHTML = sources.map((s, i) => {
        const width = ((s.count / maxCount) * 100).toFixed(0);
        return `
        <div class="source-item">
          <div class="source-rank">#${i + 1}</div>
          <div class="source-info">
            <div class="source-name">${s.name}</div>
            <div class="source-bar-bg">
              <div class="source-bar-fill" style="width: ${width}%"></div>
            </div>
          </div>
          <div class="source-count">${s.count}</div>
        </div>`;
    }).join('');
}

function renderCategoryTable(categories) {
    const table = document.getElementById('category-table');
    const entries = Object.entries(categories).sort(([, a], [, b]) => b.total - a.total);

    if (entries.length === 0) {
        table.innerHTML = '<div class="analytics-empty">Sem dados de categorias</div>';
        return;
    }

    table.innerHTML = `
    <table class="analytics-table">
      <thead>
        <tr>
          <th>Categoria</th>
          <th>Total</th>
          <th>Publicados</th>
          <th>Erros</th>
          <th>Tokens</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(([cat, data]) => `
        <tr>
          <td><strong>${CATEGORY_LABELS[cat] || cat}</strong></td>
          <td>${data.total}</td>
          <td style="color: var(--accent-success)">${data.published}</td>
          <td style="color: ${data.errors > 0 ? 'var(--accent-error)' : 'var(--text-muted)'}">${data.errors}</td>
          <td>${formatTokens(data.tokens)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function formatTokens(count) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
}
