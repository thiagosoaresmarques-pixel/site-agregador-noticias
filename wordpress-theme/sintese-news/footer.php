</main>

<footer class="site-footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-brand">
                <div class="footer-title"><?php bloginfo('name'); ?></div>
                <p><?php bloginfo('description'); ?></p>
                <p style="margin-top: var(--space-4); font-size: var(--font-size-xs);">
                    Notícias analisadas por IA dialética através da tríade Tese → Antítese → Síntese.
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

})();
</script>

<?php wp_footer(); ?>
</body>
</html>
