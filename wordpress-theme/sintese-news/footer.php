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
                    <li><a href="#">Fontes & Transparência</a></li>
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

<?php wp_footer(); ?>
</body>
</html>
