<?php
/**
 * Síntese News — Theme Functions (v2.0)
 */

// ─── Theme Setup ──────────────────────────────────
function sintese_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    add_theme_support('custom-logo', [
        'height'      => 60,
        'width'       => 200,
        'flex-height' => true,
        'flex-width'  => true,
    ]);

    // Register Navigation Menu
    register_nav_menus([
        'primary' => __('Menu Principal', 'sintese-news'),
    ]);

    // Image sizes for article cards
    add_image_size('card-thumb', 600, 400, true);
    add_image_size('hero-image', 1200, 600, true);
}
add_action('after_setup_theme', 'sintese_setup');

// ─── Enqueue Styles & Fonts ───────────────────────
function sintese_enqueue() {
    // Google Fonts (Inter, Merriweather, JetBrains Mono)
    wp_enqueue_style(
        'google-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap',
        [],
        null
    );

    // Theme stylesheet
    wp_enqueue_style('sintese-style', get_stylesheet_uri(), ['google-fonts'], wp_get_theme()->get('Version'));
}
add_action('wp_enqueue_scripts', 'sintese_enqueue');

// ─── Excerpt Length ───────────────────────────────
function sintese_excerpt_length($length) {
    return 25;
}
add_filter('excerpt_length', 'sintese_excerpt_length');

function sintese_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'sintese_excerpt_more');

// ─── Category Color Helper ────────────────────────
function sintese_category_color($cat_slug) {
    $colors = [
        'politica'       => 'var(--cat-politica)',
        'economia'       => 'var(--cat-economia)',
        'tecnologia'     => 'var(--cat-tecnologia)',
        'ciencia'        => 'var(--cat-ciencia)',
        'saude'          => 'var(--cat-saude)',
        'esportes'       => 'var(--cat-esportes)',
        'educacao'       => 'var(--cat-educacao)',
        'meio-ambiente'  => 'var(--cat-meio-ambiente)',
        'internacional'  => 'var(--cat-internacional)',
    ];
    return $colors[$cat_slug] ?? 'var(--accent)';
}

// ─── Register Sidebar/Widgets ─────────────────────
function sintese_widgets() {
    register_sidebar([
        'name'          => __('Sidebar do Artigo', 'sintese-news'),
        'id'            => 'article-sidebar',
        'before_widget' => '<div class="sidebar-widget">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4>',
        'after_title'   => '</h4>',
    ]);
}
add_action('widgets_init', 'sintese_widgets');

// ─── Parse Dialectical Sections ───────────────────
function sintese_parse_sections($content) {
    // Method 1: Detect pre-formatted HTML sections (from buildDialecticalContent)
    if (strpos($content, 'DIALECTICAL-SECTION:') !== false) {
        return ['preformatted' => $content];
    }

    // Method 2: Detect class-based HTML sections (WordPress may strip comments)
    if (strpos($content, 'section-thesis') !== false || strpos($content, 'section-antithesis') !== false) {
        return ['preformatted' => $content];
    }

    // Method 3 (legacy): Detect ## headers for dialectical sections
    $sections = [];

    if (preg_match('/##\s*(Evento Principal|Tese|TESE)[\s\S]*?(?=##\s*(Contradições|Antítese|ANTÍTESE)|$)/i', $content, $match)) {
        $sections['thesis'] = wp_kses_post(trim($match[0]));
    }

    if (preg_match('/##\s*(Contradições|Antítese|ANTÍTESE|Contra-Argumentos)[\s\S]*?(?=##\s*(Título|Síntese|SÍNTESE|Corpo)|$)/i', $content, $match)) {
        $sections['antithesis'] = wp_kses_post(trim($match[0]));
    }

    if (preg_match('/##\s*(Título|Síntese|SÍNTESE|Corpo do Artigo|Visão Integrada)[\s\S]*/i', $content, $match)) {
        $sections['synthesis'] = wp_kses_post(trim($match[0]));
    }

    return $sections;
}

// ─── Google Analytics (GA4) ───────────────────────
function sintese_customizer_analytics($wp_customize) {
    // Section
    $wp_customize->add_section('sintese_analytics', [
        'title'    => __('📊 Analytics', 'sintese-news'),
        'priority' => 160,
    ]);

    // GA Measurement ID setting
    $wp_customize->add_setting('sintese_ga_id', [
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ]);

    $wp_customize->add_control('sintese_ga_id', [
        'label'       => __('Google Analytics Measurement ID', 'sintese-news'),
        'description' => __('Ex: G-XXXXXXXXXX (GA4). Deixe vazio para desativar.', 'sintese-news'),
        'section'     => 'sintese_analytics',
        'type'        => 'text',
    ]);
}
add_action('customize_register', 'sintese_customizer_analytics');

// Inject GA4 script in <head> (frontend only, not for admins)
function sintese_ga_tracking() {
    $ga_id = get_theme_mod('sintese_ga_id', '');
    if (empty($ga_id) || is_admin() || current_user_can('manage_options')) {
        return;
    }
    ?>
    <!-- Google Analytics (GA4) — Síntese News -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo esc_attr($ga_id); ?>"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '<?php echo esc_js($ga_id); ?>', {
            'anonymize_ip': true,
            'cookie_flags': 'SameSite=None;Secure'
        });
    </script>
    <?php
}
add_action('wp_head', 'sintese_ga_tracking', 1);
