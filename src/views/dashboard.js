/**
 * Dashboard View — Main stats, pipeline status, and quick actions
 */

import { api } from '../api/client.js';
import { renderPipelineCard } from '../components/pipeline-card.js';
import { showToast } from '../components/toast.js';

let pollingInterval = null;
let currentRunId = null;

export function renderDashboard(container) {
  container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Dashboard</h1>
      <p class="view-subtitle">Painel de controle do processamento dialético de notícias</p>
    </div>

    <!-- Stats -->
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📰</div>
        <div class="stat-value" id="stat-total">—</div>
        <div class="stat-label">Total de Artigos</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-value" id="stat-drafts">—</div>
        <div class="stat-label">Rascunhos</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value" id="stat-published">—</div>
        <div class="stat-label">Publicados</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🪙</div>
        <div class="stat-value" id="stat-tokens">—</div>
        <div class="stat-label">Tokens Utilizados</div>
      </div>
    </div>

    <!-- Pipeline Control -->
    <div class="pipeline-container">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
        <h2 style="font-size: var(--font-size-xl); font-weight: 700;">Pipeline Dialético</h2>
        <button class="btn btn-primary btn-lg" id="btn-run-pipeline">
          ⚡ Executar Pipeline
        </button>
      </div>

      <!-- Advanced Filters -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-4); padding: var(--space-4); background: var(--surface-2); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
        <div>
          <label style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); display: block;">Categoria</label>
          <select id="pipeline-category" class="form-input" style="width: 100%; padding: var(--space-2) var(--space-3);">
            <option value="politica" selected>Política</option>
            <option value="internacional">Política Internacional</option>
            <option value="economia">Economia</option>
            <option value="tecnologia">Tecnologia</option>
            <option value="meio-ambiente">Meio Ambiente</option>
            <option value="educacao">Educação</option>
            <option value="saude">Saúde</option>
            <option value="ciencia">Ciência</option>
            <option value="esportes">Esportes</option>
            <option value="geral">Geral</option>
          </select>
        </div>
        <div>
          <label style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); display: block;">Período</label>
          <select id="pipeline-period" class="form-input" style="width: 100%; padding: var(--space-2) var(--space-3);">
            <option value="today">Hoje</option>
            <option value="3days" selected>Últimos 3 dias</option>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
          </select>
        </div>
        <div>
          <label style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); display: block;">Ordenar por</label>
          <select id="pipeline-sort" class="form-input" style="width: 100%; padding: var(--space-2) var(--space-3);">
            <option value="date" selected>Mais recentes</option>
            <option value="rel">Relevância</option>
            <option value="socialScore">Engajamento social</option>
          </select>
        </div>
        <div>
          <label style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); display: block;">Artigos</label>
          <select id="pipeline-count" class="form-input" style="width: 100%; padding: var(--space-2) var(--space-3);">
            <option value="3">3 artigos</option>
            <option value="5" selected>5 artigos</option>
            <option value="10">10 artigos</option>
            <option value="15">15 artigos</option>
          </select>
        </div>
      </div>

      <div id="pipeline-card"></div>
    </div>

    <!-- Scheduler Section -->
    <div class="scheduler-container" style="margin-top: var(--space-6);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4);">
        <h2 style="font-size: var(--font-size-xl); font-weight: 700; display: flex; align-items: center; gap: var(--space-2);">
          ⏰ Agendamento Automático
          <span id="scheduler-status-badge" class="badge" style="font-size: var(--font-size-xs);">—</span>
        </h2>
        <div style="display: flex; gap: var(--space-2);">
          <button class="btn btn-sm" id="btn-trigger-scheduler" title="Executar agora" style="font-size: var(--font-size-sm);">
            ▶️ Executar Agora
          </button>
          <button class="btn btn-primary btn-sm" id="btn-toggle-scheduler">
            —
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
        <!-- Config Panel -->
        <div style="padding: var(--space-4); background: var(--surface-2); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
          <div style="display: grid; gap: var(--space-3);">
            <div>
              <label style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); display: block;">Frequência</label>
              <select id="scheduler-frequency" class="form-input" style="width: 100%; padding: var(--space-2) var(--space-3);">
                <option value="0 */6 * * *">A cada 6 horas</option>
                <option value="0 */12 * * *">A cada 12 horas</option>
                <option value="0 8 * * *">1x/dia (08:00)</option>
                <option value="0 8,20 * * *">2x/dia (08:00 e 20:00)</option>
                <option value="0 7,13,19 * * *">3x/dia (07:00, 13:00, 19:00)</option>
              </select>
            </div>
            <div>
              <label style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); display: block;">Categorias</label>
              <div id="scheduler-categories" style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="politica" checked> Política</label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="internacional" checked> Internacional</label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="economia" checked> Economia</label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="tecnologia"> Tecnologia</label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="meio-ambiente"> Meio Ambiente</label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="educacao"> Educação</label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="saude"> Saúde</label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="ciencia"> Ciência</label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="esportes"> Esportes</label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); cursor: pointer;"><input type="checkbox" value="geral"> Geral</label>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
              <div>
                <label style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); display: block;">Artigos/execução</label>
                <select id="scheduler-max-articles" class="form-input" style="width: 100%; padding: var(--space-2) var(--space-3);">
                  <option value="2">2 artigos</option>
                  <option value="3" selected>3 artigos</option>
                  <option value="5">5 artigos</option>
                </select>
              </div>
              <div>
                <label style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-1); display: block;">Auto-publicar</label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: var(--font-size-sm); cursor: pointer; margin-top: var(--space-1);">
                  <input type="checkbox" id="scheduler-auto-publish" checked>
                  Como rascunho no WordPress
                </label>
              </div>
            </div>
            <button class="btn btn-sm" id="btn-save-scheduler-config" style="margin-top: var(--space-2);">
              💾 Salvar Configuração
            </button>
          </div>
        </div>

        <!-- Info + History Panel -->
        <div style="padding: var(--space-4); background: var(--surface-2); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
          <div id="scheduler-info" style="margin-bottom: var(--space-3);">
            <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Carregando...</div>
          </div>
          <h3 style="font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-2); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Histórico</h3>
          <div id="scheduler-history" style="max-height: 200px; overflow-y: auto;">
            <div style="font-size: var(--font-size-sm); color: var(--text-tertiary);">Nenhuma execução ainda</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Runs -->
    <div>
      <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: var(--space-4); margin-top: var(--space-6);">Execuções Recentes</h2>
      <div id="recent-runs" class="articles-list"></div>
    </div>
  `;

  loadStats();
  loadRecentRuns();
  loadSchedulerStatus();
  renderPipelineCard(document.getElementById('pipeline-card'), null);

  document.getElementById('btn-run-pipeline').addEventListener('click', handleRunPipeline);
  document.getElementById('btn-toggle-scheduler').addEventListener('click', handleToggleScheduler);
  document.getElementById('btn-trigger-scheduler').addEventListener('click', handleTriggerScheduler);
  document.getElementById('btn-save-scheduler-config').addEventListener('click', handleSaveSchedulerConfig);
}

async function loadStats() {
  try {
    const stats = await api.getStats();
    document.getElementById('stat-total').textContent = stats.totalArticles;
    document.getElementById('stat-drafts').textContent = stats.draftArticles;
    document.getElementById('stat-published').textContent = stats.publishedArticles;
    document.getElementById('stat-tokens').textContent = formatTokens(stats.totalTokensUsed);
  } catch {
    // Stats will show as "—" if server is down
  }
}

async function loadRecentRuns() {
  const container = document.getElementById('recent-runs');
  try {
    const runs = await api.getPipelineRuns();
    if (runs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔮</div>
          <h3 class="empty-state-title">Nenhuma execução ainda</h3>
          <p class="empty-state-text">Clique em "Executar Pipeline" para processar suas primeiras notícias com análise dialética.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = runs.slice(0, 5).map((run) => `
      <div class="article-item">
        <div class="article-status-indicator ${run.status}"></div>
        <div class="article-info">
          <div class="article-title">${run.id}</div>
          <div class="article-meta">
            <span>📊 ${run.articlesProcessed}/${run.totalArticles} artigos</span>
            <span>🪙 ${formatTokens(run.tokens?.total || 0)} tokens</span>
            <span>⏱️ ${formatDate(run.startedAt)}</span>
          </div>
        </div>
        <span class="badge badge-${run.status}">${run.status}</span>
      </div>
    `).join('');
  } catch {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Servidor não disponível</h3>
        <p class="empty-state-text">Inicie o servidor com <code>npm run dev</code></p>
      </div>
    `;
  }
}

async function handleRunPipeline() {
  const btn = document.getElementById('btn-run-pipeline');
  const category = document.getElementById('pipeline-category').value;
  const period = document.getElementById('pipeline-period').value;
  const sortBy = document.getElementById('pipeline-sort').value;
  const maxArticles = parseInt(document.getElementById('pipeline-count').value, 10);

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Iniciando...';

  try {
    const result = await api.runPipeline({ category, maxArticles, sortBy, period });
    currentRunId = result.runId;
    showToast('Pipeline iniciado!', 'success');
    startPolling(result.runId);
  } catch (error) {
    showToast(error.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '⚡ Executar Pipeline';
  }
}

function startPolling(runId) {
  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {
    try {
      const status = await api.getPipelineStatus(runId);
      renderPipelineCard(document.getElementById('pipeline-card'), status);

      if (status.status === 'complete' || status.status === 'error') {
        clearInterval(pollingInterval);
        pollingInterval = null;

        const btn = document.getElementById('btn-run-pipeline');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '⚡ Executar Pipeline';
        }

        if (status.status === 'complete') {
          showToast(`Pipeline concluído! ${status.articlesProcessed} artigos processados.`, 'success');
        } else {
          showToast('Pipeline finalizado com erros.', 'error');
        }

        loadStats();
        loadRecentRuns();
      }
    } catch (err) {
      // Stop polling if the run no longer exists (server restart, etc.)
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        const btn = document.getElementById('btn-run-pipeline');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '⚡ Executar Pipeline';
        }
      }
    }
  }, 2000);
}

function formatTokens(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Scheduler Functions ──────────────────────────────────
let schedulerPollingInterval = null;

async function loadSchedulerStatus() {
  try {
    const status = await api.getSchedulerStatus();
    updateSchedulerUI(status);

    // Start polling scheduler status every 10s
    if (!schedulerPollingInterval) {
      schedulerPollingInterval = setInterval(async () => {
        try {
          const s = await api.getSchedulerStatus();
          updateSchedulerUI(s);
        } catch { /* ignore */ }
      }, 10000);
    }
  } catch {
    const badge = document.getElementById('scheduler-status-badge');
    if (badge) {
      badge.textContent = 'Offline';
      badge.className = 'badge badge-error';
    }
  }
}

function updateSchedulerUI(status) {
  // Badge
  const badge = document.getElementById('scheduler-status-badge');
  if (badge) {
    if (status.isRunning) {
      badge.textContent = '🔄 Executando...';
      badge.className = 'badge badge-running';
    } else if (status.enabled) {
      badge.textContent = '✅ Ativo';
      badge.className = 'badge badge-complete';
    } else {
      badge.textContent = '⏸️ Inativo';
      badge.className = 'badge badge-draft';
    }
  }

  // Toggle button
  const toggleBtn = document.getElementById('btn-toggle-scheduler');
  if (toggleBtn) {
    toggleBtn.textContent = status.enabled ? '⏹️ Desativar' : '▶️ Ativar';
    toggleBtn.className = status.enabled ? 'btn btn-sm' : 'btn btn-primary btn-sm';
  }

  // Sync form values
  const freqSelect = document.getElementById('scheduler-frequency');
  if (freqSelect) freqSelect.value = status.cronExpression;

  const maxSelect = document.getElementById('scheduler-max-articles');
  if (maxSelect) maxSelect.value = String(status.maxArticlesPerRun);

  const autoPublish = document.getElementById('scheduler-auto-publish');
  if (autoPublish) autoPublish.checked = status.autoPublish;

  // Sync category checkboxes
  const checkboxes = document.querySelectorAll('#scheduler-categories input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = status.categories.includes(cb.value);
  });

  // Info panel
  const info = document.getElementById('scheduler-info');
  if (info) {
    const nextRun = status.nextRun
      ? new Date(status.nextRun).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '—';
    const lastRunInfo = status.lastRun
      ? `${formatDate(status.lastRun.startedAt)} — ${status.lastRun.articlesProcessed} proc. / ${status.lastRun.articlesPublished} pub.`
      : 'Nenhuma';

    info.innerHTML = `
      <div style="display: grid; gap: var(--space-2);">
        <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm);">
          <span style="color: var(--text-secondary);">Frequência:</span>
          <span style="font-weight: 600;">${status.cronLabel}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm);">
          <span style="color: var(--text-secondary);">Próxima execução:</span>
          <span style="font-weight: 600; color: var(--accent-primary);">${status.enabled ? nextRun : '—'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm);">
          <span style="color: var(--text-secondary);">Última execução:</span>
          <span style="font-weight: 600;">${lastRunInfo}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm);">
          <span style="color: var(--text-secondary);">Auto-publicar:</span>
          <span style="font-weight: 600;">${status.autoPublish ? '✅ Sim (rascunho)' : '❌ Não'}</span>
        </div>
      </div>
    `;
  }

  // History
  const historyEl = document.getElementById('scheduler-history');
  if (historyEl && status.lastRun) {
    // Load history asynchronously
    api.getSchedulerHistory().then(history => {
      if (history.length === 0) {
        historyEl.innerHTML = '<div style="font-size: var(--font-size-sm); color: var(--text-tertiary);">Nenhuma execução ainda</div>';
        return;
      }
      historyEl.innerHTML = history.slice(0, 10).map(run => {
        const statusIcon = run.status === 'complete' ? '✅' : run.status === 'partial' ? '⚠️' : run.status === 'running' ? '🔄' : '❌';
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-subtle); font-size: var(--font-size-xs);">
            <span>${statusIcon} ${run.category || '—'}</span>
            <span style="color: var(--text-secondary);">${run.articlesProcessed}/${run.articlesPublished} pub.</span>
            <span style="color: var(--text-tertiary);">${formatDate(run.startedAt)}</span>
          </div>
        `;
      }).join('');
    }).catch(() => { });
  }
}

async function handleToggleScheduler() {
  const btn = document.getElementById('btn-toggle-scheduler');
  btn.disabled = true;

  try {
    const status = await api.getSchedulerStatus();
    if (status.enabled) {
      await api.stopScheduler();
      showToast('Agendamento desativado', 'info');
    } else {
      // Gather config from form
      const config = getSchedulerFormConfig();
      await api.startScheduler(config);
      showToast('Agendamento ativado!', 'success');
    }
    await loadSchedulerStatus();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleTriggerScheduler() {
  const btn = document.getElementById('btn-trigger-scheduler');
  btn.disabled = true;
  btn.innerHTML = '🔄 Executando...';

  try {
    const result = await api.triggerSchedulerRun();
    if (result.triggered) {
      showToast('Execução manual iniciada!', 'success');
    } else {
      showToast(result.reason, 'warning');
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '▶️ Executar Agora';
      loadSchedulerStatus();
    }, 3000);
  }
}

async function handleSaveSchedulerConfig() {
  const btn = document.getElementById('btn-save-scheduler-config');
  btn.disabled = true;

  try {
    const config = getSchedulerFormConfig();
    await api.updateSchedulerConfig(config);
    showToast('Configuração salva!', 'success');
    await loadSchedulerStatus();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

function getSchedulerFormConfig() {
  const categories = [];
  document.querySelectorAll('#scheduler-categories input[type="checkbox"]:checked').forEach(cb => {
    categories.push(cb.value);
  });

  return {
    cronExpression: document.getElementById('scheduler-frequency').value,
    categories: categories.length > 0 ? categories : ['politica'],
    maxArticlesPerRun: parseInt(document.getElementById('scheduler-max-articles').value, 10),
    autoPublish: document.getElementById('scheduler-auto-publish').checked,
    publishAsDraft: true,
  };
}

export function cleanupDashboard() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  if (schedulerPollingInterval) {
    clearInterval(schedulerPollingInterval);
    schedulerPollingInterval = null;
  }
}
