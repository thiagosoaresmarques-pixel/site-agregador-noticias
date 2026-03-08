<?php
/**
 * Contradictio — Theme Functions (v2.0)
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

// ─── PWA: Manifest & Service Worker ───────────────
function sintese_pwa_head() {
    $manifest_url = get_template_directory_uri() . '/manifest.json';
    $icon_url = get_template_directory_uri() . '/assets/icon-512.png';
    ?>
    <link rel="manifest" href="<?php echo esc_url($manifest_url); ?>">
    <meta name="theme-color" content="#6366f1">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="<?php echo esc_url($icon_url); ?>">
    <?php
}
add_action('wp_head', 'sintese_pwa_head', 2);

function sintese_register_sw() {
    if (is_admin()) return;
    $sw_url = get_template_directory_uri() . '/sw.js';
    ?>
    <script>
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('<?php echo esc_js($sw_url); ?>', { scope: '/' })
            .catch(function() {});
    }
    </script>
    <?php
}
add_action('wp_footer', 'sintese_register_sw', 99);

// ─── Open Graph & Twitter Meta ────────────────────
function sintese_og_meta() {
    $site_name = get_bloginfo('name');
    $og_image = get_template_directory_uri() . '/assets/og-default.png';

    if (is_single()) {
        global $post;
        $title = get_the_title($post);
        $desc = has_excerpt($post) ? get_the_excerpt($post) : wp_trim_words(strip_tags($post->post_content), 30);
        $url = get_permalink($post);
        $image = get_the_post_thumbnail_url($post, 'hero-image') ?: $og_image;
        $type = 'article';
    } else {
        $title = $site_name;
        $desc = get_bloginfo('description');
        $url = home_url('/');
        $image = $og_image;
        $type = 'website';
    }
    ?>
    <!-- Open Graph -->
    <meta property="og:type" content="<?php echo esc_attr($type); ?>">
    <meta property="og:title" content="<?php echo esc_attr($title); ?>">
    <meta property="og:description" content="<?php echo esc_attr($desc); ?>">
    <meta property="og:url" content="<?php echo esc_url($url); ?>">
    <meta property="og:image" content="<?php echo esc_url($image); ?>">
    <meta property="og:site_name" content="<?php echo esc_attr($site_name); ?>">
    <meta property="og:locale" content="pt_BR">
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo esc_attr($title); ?>">
    <meta name="twitter:description" content="<?php echo esc_attr($desc); ?>">
    <meta name="twitter:image" content="<?php echo esc_url($image); ?>">
    <?php
}
add_action('wp_head', 'sintese_og_meta', 3);

// ─── Schema.org JSON-LD ───────────────────────────
function sintese_schema_jsonld() {
    $site_name = get_bloginfo('name');
    $site_url = home_url('/');
    $og_image = get_template_directory_uri() . '/assets/og-default.png';
    $icon_url = get_template_directory_uri() . '/assets/icon-512.png';

    if (is_single()) {
        global $post;
        $image = get_the_post_thumbnail_url($post, 'hero-image') ?: $og_image;
        $cats = get_the_category($post->ID);
        $cat_name = !empty($cats) ? $cats[0]->name : 'Notícias';

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'NewsArticle',
            'headline' => get_the_title($post),
            'description' => has_excerpt($post) ? get_the_excerpt($post) : wp_trim_words(strip_tags($post->post_content), 30),
            'image' => $image,
            'datePublished' => get_the_date('c', $post),
            'dateModified' => get_the_modified_date('c', $post),
            'author' => [
                '@type' => 'Organization',
                'name' => $site_name,
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => $site_name,
                'logo' => ['@type' => 'ImageObject', 'url' => $icon_url],
            ],
            'mainEntityOfPage' => get_permalink($post),
            'articleSection' => $cat_name,
        ];
    } else {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $site_name,
            'url' => $site_url,
            'description' => get_bloginfo('description'),
            'publisher' => [
                '@type' => 'Organization',
                'name' => $site_name,
                'logo' => ['@type' => 'ImageObject', 'url' => $icon_url],
            ],
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => $site_url . '?s={search_term_string}',
                'query-input' => 'required name=search_term_string',
            ],
        ];
    }

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . '</script>' . "\n";
}
add_action('wp_head', 'sintese_schema_jsonld', 4);

// ─── Newsletter REST API ──────────────────────────
function sintese_register_subscribe_route() {
    register_rest_route('sintese/v1', '/subscribe', [
        'methods'             => 'POST',
        'callback'            => 'sintese_handle_subscribe',
        'permission_callback' => '__return_true',
    ]);
}
add_action('rest_api_init', 'sintese_register_subscribe_route');

function sintese_handle_subscribe($request) {
    $email = sanitize_email($request->get_param('email'));

    if (!is_email($email)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => '❌ Email inválido.',
        ], 400);
    }

    $subscribers = get_option('sintese_subscribers', []);

    // Check duplicate
    if (in_array($email, $subscribers, true)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => '📧 Este email já está inscrito!',
        ], 200);
    }

    // Rate limit: max 100 subscribers (free tier)
    if (count($subscribers) >= 1000) {
        return new WP_REST_Response([
            'success' => false,
            'message' => '⚠️ Lista cheia. Tente novamente mais tarde.',
        ], 429);
    }

    $subscribers[] = $email;
    update_option('sintese_subscribers', $subscribers);

    return new WP_REST_Response([
        'success' => true,
        'message' => '✅ Inscrito com sucesso! Obrigado.',
    ], 200);
}
