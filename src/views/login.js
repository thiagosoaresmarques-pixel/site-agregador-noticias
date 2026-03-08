/**
 * Login View — Premium glassmorphism login page
 */

export function renderLogin(container, onSuccess) {
    container.innerHTML = `
    <div class="login-overlay">
        <div class="login-card">
            <div class="login-brand">
                <div class="login-icon">⚡</div>
                <h1>Dialética<span class="brand-accent">News</span></h1>
                <p class="login-subtitle">Painel Administrativo</p>
            </div>
            <form id="login-form" class="login-form">
                <div class="input-group">
                    <label for="login-password">Senha</label>
                    <input 
                        type="password" 
                        id="login-password" 
                        placeholder="Digite a senha do dashboard"
                        autocomplete="current-password"
                        required
                    />
                </div>
                <button type="submit" id="login-btn" class="login-btn">
                    <span class="btn-text">Entrar</span>
                    <span class="btn-spinner" style="display:none">⏳</span>
                </button>
                <div id="login-error" class="login-error" style="display:none"></div>
            </form>
            <div class="login-footer">
                <span>🔐 Acesso restrito</span>
            </div>
        </div>
    </div>`;

    const form = document.getElementById('login-form');
    const passwordInput = document.getElementById('login-password');
    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');

    passwordInput.focus();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = passwordInput.value.trim();
        if (!password) return;

        btn.querySelector('.btn-text').style.display = 'none';
        btn.querySelector('.btn-spinner').style.display = 'inline';
        btn.disabled = true;
        errorEl.style.display = 'none';

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (data.success && data.token) {
                localStorage.setItem('auth_token', data.token);
                onSuccess();
            } else {
                errorEl.textContent = data.error || 'Senha incorreta';
                errorEl.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (err) {
            errorEl.textContent = 'Erro de conexão com o servidor';
            errorEl.style.display = 'block';
        } finally {
            btn.querySelector('.btn-text').style.display = 'inline';
            btn.querySelector('.btn-spinner').style.display = 'none';
            btn.disabled = false;
        }
    });
}
