/**
 * Settings View — API keys and configuration
 */

export function renderSettings(container) {
    container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Configurações</h1>
      <p class="view-subtitle">Gerencie as credenciais e preferências do sistema</p>
    </div>

    <div class="card" style="margin-bottom: var(--space-6);">
      <div class="settings-section">
        <h3 class="settings-section-title">🤖 Google Gemini API</h3>
        <div class="form-group">
          <label class="form-label" for="input-gemini-key">API Key</label>
          <input type="password" id="input-gemini-key" class="form-input" placeholder="AIzaSy..." />
          <p class="form-hint">Obtenha em <a href="https://aistudio.google.com/apikey" target="_blank" style="color: var(--accent-primary);">Google AI Studio</a></p>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-gemini-model">Modelo</label>
          <select id="input-gemini-model" class="form-input">
            <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite (mais barato)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (balanceado)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (melhor qualidade)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: var(--space-6);">
      <div class="settings-section">
        <h3 class="settings-section-title">📰 NewsAPI.ai</h3>
        <div class="form-group">
          <label class="form-label" for="input-news-key">API Key</label>
          <input type="password" id="input-news-key" class="form-input" placeholder="Sua chave NewsAPI.ai" />
          <p class="form-hint">Plano gratuito: 100 requests/dia. <a href="https://newsapi.ai" target="_blank" style="color: var(--accent-primary);">newsapi.ai</a></p>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: var(--space-6);">
      <div class="settings-section">
        <h3 class="settings-section-title">📝 WordPress</h3>
        <div class="form-group">
          <label class="form-label" for="input-wp-url">URL do Site</label>
          <input type="url" id="input-wp-url" class="form-input" placeholder="https://meusite.com" />
        </div>
        <div class="form-group">
          <label class="form-label" for="input-wp-user">Usuário</label>
          <input type="text" id="input-wp-user" class="form-input" placeholder="admin" />
        </div>
        <div class="form-group">
          <label class="form-label" for="input-wp-pass">Application Password</label>
          <input type="password" id="input-wp-pass" class="form-input" placeholder="xxxx xxxx xxxx xxxx" />
          <p class="form-hint">Gere em WordPress → Usuários → Seu perfil → Application Passwords</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h3 class="settings-section-title">🔗 Integração n8n</h3>
        <div class="form-group">
          <label class="form-label">Webhook URL</label>
          <div class="form-input" style="background: var(--bg-glass); font-family: monospace; user-select: all; cursor: text;">
            POST http://localhost:3001/api/webhook/trigger
          </div>
          <p class="form-hint">Configure este webhook no n8n para automatizar o pipeline via Cloud Scheduler.</p>
        </div>
        <div class="form-group">
          <label class="form-label">Exemplo de Payload</label>
          <pre style="background: var(--bg-glass); padding: var(--space-4); border-radius: var(--radius-sm); font-size: var(--font-size-xs); color: var(--text-secondary); overflow-x: auto;">{
  "category": "tecnologia",
  "maxArticles": 5,
  "language": "por",
  "publishAsDraft": true
}</pre>
        </div>
      </div>
    </div>

    <div style="margin-top: var(--space-6); padding: var(--space-5); background: rgba(139, 92, 246, 0.08); border: 1px solid var(--border-active); border-radius: var(--radius-md);">
      <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
        💡 <strong>Nota:</strong> As credenciais são configuradas no arquivo <code>.env</code> no servidor. 
        Esta página serve como referência. Para alterar, edite o arquivo <code>.env</code> e reinicie o servidor.
      </p>
    </div>
  `;
}
