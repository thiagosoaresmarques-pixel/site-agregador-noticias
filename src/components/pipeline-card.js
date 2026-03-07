/**
 * Pipeline Card Component — animated step-by-step visualization
 */

const STEPS = [
    { id: 'fetching', icon: '📡', label: 'Captura' },
    { id: 'thesis', icon: '🔵', label: 'Tese' },
    { id: 'antithesis', icon: '🔴', label: 'Antítese' },
    { id: 'synthesis', icon: '🟣', label: 'Síntese' },
    { id: 'seo', icon: '🔍', label: 'SEO' },
];

const STAGE_ORDER = ['fetching', 'thesis', 'antithesis', 'synthesis', 'seo'];

export function renderPipelineCard(container, pipelineStatus) {
    if (!container) return;

    const currentStage = pipelineStatus?.stage || null;
    const currentStageIndex = currentStage ? STAGE_ORDER.indexOf(currentStage) : -1;
    const isRunning = pipelineStatus?.status === 'running';
    const isComplete = pipelineStatus?.status === 'complete';

    container.innerHTML = `
    <div class="pipeline-steps">
      ${STEPS.map((step, i) => {
        let stateClass = 'pending';
        if (isComplete) {
            stateClass = 'complete';
        } else if (isRunning) {
            if (i < currentStageIndex) stateClass = 'complete';
            else if (i === currentStageIndex) stateClass = 'active';
            else stateClass = 'pending';
        }

        return `
          <div class="pipeline-step ${stateClass}">
            <div class="step-icon">${stateClass === 'complete' ? '✓' : step.icon}</div>
            <div class="step-label">${step.label}</div>
          </div>
          ${i < STEPS.length - 1 ? '<div class="pipeline-arrow">→</div>' : ''}
        `;
    }).join('')}
    </div>
    ${pipelineStatus?.currentArticle ? `
      <div style="margin-top: var(--space-3); padding: var(--space-3) var(--space-5); font-size: var(--font-size-sm); color: var(--text-secondary);">
        📄 Processando: <strong style="color: var(--text-primary);">${pipelineStatus.currentArticle}</strong>
        <span style="margin-left: var(--space-4);">📊 ${pipelineStatus.articlesProcessed}/${pipelineStatus.totalArticles}</span>
      </div>
    ` : ''}
    ${pipelineStatus?.errors?.length ? `
      <div style="margin-top: var(--space-3); padding: var(--space-3) var(--space-5); font-size: var(--font-size-xs); color: var(--accent-error);">
        ⚠️ ${pipelineStatus.errors[pipelineStatus.errors.length - 1]}
      </div>
    ` : ''}
  `;
}
