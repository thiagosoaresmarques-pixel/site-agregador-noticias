</main>

<footer class="site-footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-brand">
                <div class="footer-title"><?php bloginfo('name'); ?></div>
                <p><?php bloginfo('description'); ?></p>
                <p style="margin-top: var(--space-4); font-size: var(--font-size-xs);">
                    Análise editorial à luz da tradição clássica e da Doutrina Social da Igreja.
                </p>
            </div>
            <div class="footer-col">
                <h5>Categorias</h5>
                <ul>
                    <?php
                    $categories = get_categories(['orderby' => 'count', 'order' => 'DESC', 'number' => 5]);
                    foreach ($categories as $cat) :
                    ?>
                        <li><a href="<?php echo esc_url(get_category_link($cat->term_id)); ?>"><?php echo esc_html($cat->name); ?></a></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <div class="footer-col">
                <h5>Sobre</h5>
                <ul>
                    <li><a href="#">Metodologia Dialética</a></li>
                    <li><a href="#">Fontes &amp; Transparência</a></li>
                    <li><a href="#">Política de Privacidade</a></li>
                    <li><a href="#">Contato</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h5>Tecnologia</h5>
                <ul>
                    <li><a href="#">Gemini AI</a></li>
                    <li><a href="#">Framework RISEN</a></li>
                    <li><a href="#">API Pública</a></li>
                </ul>
            </div>
        </div>

        <?php // ── Footer Ad (Multiplex) ── ?>
        <?php sintese_render_ad('footer', 'auto'); ?>

        <!-- Newsletter CTA -->
        <div class="newsletter-cta" id="newsletterSection">
            <div class="newsletter-inner">
                <div class="newsletter-text">
                    <h4>📬 Receba a Síntese</h4>
                    <p>As melhores análises dialéticas direto no seu email.</p>
                </div>
                <form class="newsletter-form" id="newsletterForm">
                    <input type="email" id="newsletterEmail" placeholder="seu@email.com" required autocomplete="email">
                    <button type="submit" id="newsletterBtn">Inscrever</button>
                </form>
                <p class="newsletter-msg" id="newsletterMsg"></p>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. Todas as perspectivas, uma verdade.</p>
        </div>
    </div>
</footer>

<!-- ─── Theme JS (inline, no external deps) ──────── -->
<script>
(function() {
    'use strict';

    // ── Dark/Light Mode Toggle ─────────────────────
    var toggle = document.getElementById('themeToggle');
    var icon = document.getElementById('themeIcon');
    var html = document.documentElement;

    function updateIcon() {
        var theme = html.getAttribute('data-theme');
        if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
    }

    if (toggle) {
        toggle.addEventListener('click', function() {
            var current = html.getAttribute('data-theme') || 'dark';
            var next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('sintese-theme', next);
            updateIcon();
        });
    }
    updateIcon();

    // ── Hamburger Menu ─────────────────────────────
    var menuBtn = document.getElementById('menuToggle');
    var nav = document.getElementById('mainNav');
    var overlay = document.getElementById('navOverlay');

    function closeMenu() {
        if (menuBtn) menuBtn.classList.remove('active');
        if (nav) nav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            var isOpen = nav && nav.classList.contains('active');
            if (isOpen) {
                closeMenu();
            } else {
                menuBtn.classList.add('active');
                if (nav) nav.classList.add('active');
                if (overlay) overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    // Close menu on nav link click (mobile)
    if (nav) {
        var links = nav.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', closeMenu);
        }
    }

    // ── Reading Progress Bar ───────────────────────
    var progressBar = document.querySelector('.reading-progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', function() {
            var scrollTop = window.scrollY || document.documentElement.scrollTop;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = Math.min(progress, 100) + '%';
        }, { passive: true });
    }

    // ── Scroll Animations (IntersectionObserver) ───
    var animElements = document.querySelectorAll('.animate-on-scroll');
    if (animElements.length > 0 && 'IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        animElements.forEach(function(el) {
            observer.observe(el);
        });
    } else {
        // Fallback: show all immediately
        animElements.forEach(function(el) {
            el.classList.add('is-visible');
        });
    }

    // ── Image Load Animation ───────────────────────
    var images = document.querySelectorAll('.card-image-wrapper img');
    images.forEach(function(img) {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function() {
                img.classList.add('loaded');
            });
        }
    });

    // ── Newsletter Submission ─────────────────────
    var nlForm = document.getElementById('newsletterForm');
    var nlEmail = document.getElementById('newsletterEmail');
    var nlBtn = document.getElementById('newsletterBtn');
    var nlMsg = document.getElementById('newsletterMsg');

    if (nlForm) {
        nlForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = nlEmail.value.trim();
            if (!email) return;

            nlBtn.disabled = true;
            nlBtn.textContent = '...';

            fetch('/?rest_route=/sintese/v1/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email }),
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                nlMsg.textContent = data.message || '✅ Inscrito com sucesso!';
                nlMsg.className = 'newsletter-msg ' + (data.success ? 'success' : 'error');
                if (data.success) {
                    nlEmail.value = '';
                    nlBtn.textContent = '✓';
                    // Google Ads conversion tracking
                    if (typeof gtag === 'function') {
                        gtag('event', 'conversion', {
                            'send_to': 'AW-16651599167/0wN6CIqI4vwbEL_6jIQ-',
                            'value': 1.0,
                            'currency': 'BRL'
                        });
                    }
                } else {
                    nlBtn.textContent = 'Inscrever';
                    nlBtn.disabled = false;
                }
            })
            .catch(function() {
                nlMsg.textContent = '❌ Erro ao inscrever. Tente novamente.';
                nlMsg.className = 'newsletter-msg error';
                nlBtn.textContent = 'Inscrever';
                nlBtn.disabled = false;
            });
        });
    }

    // ── Push Notification Bell ─────────────────────
    var bellBtn = document.getElementById('notifBell');
    if (bellBtn && 'Notification' in window) {
        bellBtn.style.display = '';
        bellBtn.addEventListener('click', function() {
            if (Notification.permission === 'granted') {
                bellBtn.classList.add('active');
                new Notification('Síntese News', {
                    body: '🔔 Notificações ativadas! Você receberá alertas de novas análises.',
                    icon: bellBtn.dataset.icon || ''
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(function(p) {
                    if (p === 'granted') {
                        bellBtn.classList.add('active');
                        new Notification('Síntese News', {
                            body: '🔔 Notificações ativadas!',
                            icon: bellBtn.dataset.icon || ''
                        });
                    }
                });
            }
        });
        // Indicate if already granted
        if (Notification.permission === 'granted') {
            bellBtn.classList.add('active');
        }
    }

})();
</script>

<?php wp_footer(); ?>
</body>
</html>
