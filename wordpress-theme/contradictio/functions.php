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

// Inject GA4 script in <head> (frontend only)
function sintese_ga_tracking() {
    $ga_id = get_theme_mod('sintese_ga_id', 'G-DW7TJEZBHQ');
    if (empty($ga_id) || is_admin()) {
        return;
    }
    ?>
    <!-- Google Analytics (GA4) — Contradictio -->
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

// ─── Google AdSense ───────────────────────────────
function sintese_customizer_adsense($wp_customize) {
    // Section
    $wp_customize->add_section('sintese_adsense', [
        'title'    => __('💰 AdSense', 'sintese-news'),
        'priority' => 161,
    ]);

    // Publisher ID (ca-pub-XXXXXXXXXX)
    $wp_customize->add_setting('sintese_adsense_pub_id', [
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    $wp_customize->add_control('sintese_adsense_pub_id', [
        'label'       => __('Publisher ID', 'sintese-news'),
        'description' => __('Ex: ca-pub-5001150160313896. Deixe vazio para desativar todos os anúncios.', 'sintese-news'),
        'section'     => 'sintese_adsense',
        'type'        => 'text',
    ]);

    // In-Article ad slot
    $wp_customize->add_setting('sintese_adsense_in_article', [
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    $wp_customize->add_control('sintese_adsense_in_article', [
        'label'       => __('In-Article Ad Slot', 'sintese-news'),
        'description' => __('data-ad-slot para anúncio entre seções dialéticas.', 'sintese-news'),
        'section'     => 'sintese_adsense',
        'type'        => 'text',
    ]);

    // Sidebar ad slot
    $wp_customize->add_setting('sintese_adsense_sidebar', [
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    $wp_customize->add_control('sintese_adsense_sidebar', [
        'label'       => __('Sidebar Ad Slot', 'sintese-news'),
        'description' => __('data-ad-slot para anúncio na sidebar do artigo.', 'sintese-news'),
        'section'     => 'sintese_adsense',
        'type'        => 'text',
    ]);

    // Footer/Multiplex ad slot
    $wp_customize->add_setting('sintese_adsense_footer', [
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    $wp_customize->add_control('sintese_adsense_footer', [
        'label'       => __('Footer Ad Slot (Multiplex)', 'sintese-news'),
        'description' => __('data-ad-slot para anúncio antes do footer.', 'sintese-news'),
        'section'     => 'sintese_adsense',
        'type'        => 'text',
    ]);

    // Google Ads Conversion Tag ID (AW-XXXXXXXXXX)
    $wp_customize->add_setting('sintese_gads_tag_id', [
        'default'           => '',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    $wp_customize->add_control('sintese_gads_tag_id', [
        'label'       => __('Google Ads Tag ID', 'sintese-news'),
        'description' => __('Ex: AW-16651599167. Para rastreamento de conversões do Google Ads.', 'sintese-news'),
        'section'     => 'sintese_adsense',
        'type'        => 'text',
    ]);
}
add_action('customize_register', 'sintese_customizer_adsense');

// Inject AdSense script in <head> (enables Auto Ads + manual ad units)
function sintese_adsense_head() {
    $pub_id = get_theme_mod('sintese_adsense_pub_id', '');
    if (empty($pub_id) || is_admin()) {
        return;
    }
    ?>
    <!-- Google AdSense — Contradictio -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=<?php echo esc_attr($pub_id); ?>"
         crossorigin="anonymous"></script>
    <?php
}
add_action('wp_head', 'sintese_adsense_head', 2);

// Inject Google Ads conversion tag in <head>
function sintese_gads_head() {
    $tag_id = get_theme_mod('sintese_gads_tag_id', '');
    if (empty($tag_id) || is_admin()) {
        return;
    }
    ?>
    <!-- Google Ads Conversion Tracking — Contradictio -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo esc_attr($tag_id); ?>"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '<?php echo esc_js($tag_id); ?>');
    </script>
    <?php
}
add_action('wp_head', 'sintese_gads_head', 3);

/**
 * Render an AdSense ad container.
 * @param string $slot_type One of: 'in_article', 'sidebar', 'footer'
 * @param string $format    Ad format: 'auto', 'fluid', 'rectangle' (default: 'auto')
 */
function sintese_render_ad($slot_type, $format = 'auto') {
    $pub_id = get_theme_mod('sintese_adsense_pub_id', '');
    if (empty($pub_id) || is_admin()) {
        return;
    }

    $slot_map = [
        'in_article' => get_theme_mod('sintese_adsense_in_article', ''),
        'sidebar'    => get_theme_mod('sintese_adsense_sidebar', ''),
        'footer'     => get_theme_mod('sintese_adsense_footer', ''),
    ];

    $slot = $slot_map[$slot_type] ?? '';

    // If no specific slot is configured, still render for Auto Ads
    $slot_attr = $slot ? ' data-ad-slot="' . esc_attr($slot) . '"' : '';
    $format_attr = $format === 'fluid' ? ' data-ad-layout="in-article" data-ad-format="fluid"' : ' data-ad-format="' . esc_attr($format) . '" data-full-width-responsive="true"';
    ?>
    <div class="ad-container ad-<?php echo esc_attr($slot_type); ?>">
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="<?php echo esc_attr($pub_id); ?>"
             <?php echo $slot_attr; ?>
             <?php echo $format_attr; ?>></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>
    <?php
}

// ─── SEO: Enhanced Robots.txt ─────────────────────
function sintese_robots_txt($output, $public) {
    if (!$public) return $output;

    $site_url = get_site_url();
    $output  = "User-agent: *\n";
    $output .= "Allow: /\n";
    $output .= "Disallow: /wp-admin/\n";
    $output .= "Allow: /wp-admin/admin-ajax.php\n";
    $output .= "Disallow: /wp-login.php\n";
    $output .= "Disallow: /xmlrpc.php\n";
    $output .= "Disallow: /wp-trackback.php\n";
    $output .= "Disallow: /wp-includes/\n";
    $output .= "Disallow: /*?s=\n";
    $output .= "Disallow: /*?p=\n";
    $output .= "Disallow: /tag/*/feed/\n";
    $output .= "Disallow: /category/*/feed/\n\n";

    // Googlebot-specific (faster crawl)
    $output .= "User-agent: Googlebot\n";
    $output .= "Allow: /\n\n";

    // Bingbot
    $output .= "User-agent: Bingbot\n";
    $output .= "Allow: /\n\n";

    // Block AI scrapers (optional but recommended)
    $output .= "User-agent: GPTBot\n";
    $output .= "Disallow: /\n\n";
    $output .= "User-agent: ChatGPT-User\n";
    $output .= "Disallow: /\n\n";
    $output .= "User-agent: CCBot\n";
    $output .= "Disallow: /\n\n";

    $output .= "Sitemap: {$site_url}/wp-sitemap.xml\n";
    $output .= "Sitemap: {$site_url}/news-sitemap.xml\n";

    return $output;
}
add_filter('robots_txt', 'sintese_robots_txt', 10, 2);

// Remove user sitemap (security: don't expose author usernames)
add_filter('wp_sitemaps_add_provider', function($provider, $name) {
    if ($name === 'users') return false;
    return $provider;
}, 10, 2);

// ─── SEO: Google News Sitemap ─────────────────────
function sintese_news_sitemap() {
    $uri = strtok($_SERVER['REQUEST_URI'], '?');
    if ($uri !== '/news-sitemap.xml') return;

    header('Content-Type: application/xml; charset=UTF-8');
    header('X-Robots-Tag: noindex');

    $posts = get_posts([
        'numberposts'  => 50,
        'post_status'  => 'publish',
        'orderby'      => 'date',
        'order'        => 'DESC',
        'date_query'   => [['after' => '2 days ago']],
    ]);

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
    echo '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";

    foreach ($posts as $post) {
        $url   = get_permalink($post);
        $title = htmlspecialchars($post->post_title, ENT_XML1, 'UTF-8');
        $date  = get_the_date('c', $post);
        $lang  = 'pt';

        echo "<url>\n";
        echo "  <loc>{$url}</loc>\n";
        echo "  <news:news>\n";
        echo "    <news:publication>\n";
        echo "      <news:name>Contradictio</news:name>\n";
        echo "      <news:language>{$lang}</news:language>\n";
        echo "    </news:publication>\n";
        echo "    <news:publication_date>{$date}</news:publication_date>\n";
        echo "    <news:title>{$title}</news:title>\n";
        echo "  </news:news>\n";
        echo "</url>\n";
    }

    echo "</urlset>\n";
    exit;
}
add_action('init', 'sintese_news_sitemap');

// ─── SEO: IndexNow — Instant Indexing ─────────────
// Notifies Bing, Yandex, Seznam, Naver instantly when a post is published
define('INDEXNOW_API_KEY', '56978b9206b04cf4b817f88558ffad81');

/**
 * Serve the IndexNow API key verification file at /{key}.txt
 */
function sintese_indexnow_key_file() {
    $uri = strtok($_SERVER['REQUEST_URI'], '?');
    if ($uri !== '/' . INDEXNOW_API_KEY . '.txt') return;

    header('Content-Type: text/plain; charset=UTF-8');
    echo INDEXNOW_API_KEY;
    exit;
}
add_action('init', 'sintese_indexnow_key_file', 0);

/**
 * Submit URL to IndexNow API on publish
 */
function sintese_indexnow_on_publish($new_status, $old_status, $post) {
    if ($new_status !== 'publish' || $old_status === 'publish') return;
    if ($post->post_type !== 'post') return;

    $url = get_permalink($post);
    $host = wp_parse_url(get_site_url(), PHP_URL_HOST);
    $sitemap = get_site_url() . '/wp-sitemap.xml';

    // IndexNow: submit to Bing (which shares with Yandex, Seznam, Naver)
    $indexnow_url = 'https://api.indexnow.org/indexnow';
    $body = wp_json_encode([
        'host'    => $host,
        'key'     => INDEXNOW_API_KEY,
        'keyLocation' => get_site_url() . '/' . INDEXNOW_API_KEY . '.txt',
        'urlList' => [$url],
    ]);

    wp_remote_post($indexnow_url, [
        'blocking' => false,
        'timeout'  => 10,
        'headers'  => ['Content-Type' => 'application/json; charset=utf-8'],
        'body'     => $body,
    ]);

    // Also ping Google (doesn't support IndexNow, uses sitemap ping)
    $sitemap_encoded = urlencode($sitemap);
    wp_remote_get("https://www.google.com/ping?sitemap={$sitemap_encoded}", ['blocking' => false, 'timeout' => 5]);

    // Log for debugging
    error_log("[IndexNow] Submitted: {$url}");
}
add_action('transition_post_status', 'sintese_indexnow_on_publish', 10, 3);

// ─── AdSense: Serve ads.txt ──────────────────────
function contradictio_ads_txt() {
    $uri = strtok($_SERVER['REQUEST_URI'], '?');
    if ($uri !== '/ads.txt') return;

    $pub_id = get_theme_mod('sintese_adsense_pub_id', '');
    if (empty($pub_id)) {
        // Fallback to hardcoded pub ID
        $pub_id = 'ca-pub-5001150160313896';
    }

    // Extract numeric pub ID (remove "ca-" prefix if present)
    $pub_num = str_replace('ca-', '', $pub_id);

    header('Content-Type: text/plain; charset=UTF-8');
    header('X-Robots-Tag: noindex');
    echo "google.com, {$pub_num}, DIRECT, f08c47fec0942fa0\n";
    exit;
}
add_action('init', 'contradictio_ads_txt', 1);

// ─── CI/CD Theme Deploy Endpoint ──────────────────
// Allows authenticated admins to update theme files via REST API
// Used by: scripts/deploy-theme.mjs & GitHub Actions
function contradictio_register_deploy_route() {
    register_rest_route('contradictio/v1', '/deploy-file', [
        'methods'             => 'POST',
        'callback'            => 'contradictio_handle_deploy_file',
        'permission_callback' => function () {
            return current_user_can('edit_themes');
        },
    ]);
}
add_action('rest_api_init', 'contradictio_register_deploy_route');

function contradictio_handle_deploy_file($request) {
    $file = $request->get_param('file');
    $content = $request->get_param('content');

    if (empty($file) || !is_string($content)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Missing file or content parameter.',
        ], 400);
    }

    // Security: block path traversal and non-text files
    $file = str_replace('\\', '/', $file);
    if (strpos($file, '..') !== false || $file[0] === '/') {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Invalid file path.',
        ], 400);
    }

    $allowed_ext = ['php', 'css', 'js', 'json', 'txt', 'md'];
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed_ext, true)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => "Extension .{$ext} not allowed.",
        ], 400);
    }

    $theme_dir = get_template_directory();
    $target = $theme_dir . '/' . $file;

    // Create subdirectory if needed
    $dir = dirname($target);
    if (!is_dir($dir)) {
        wp_mkdir_p($dir);
    }

    $result = file_put_contents($target, $content);
    if ($result === false) {
        return new WP_REST_Response([
            'success' => false,
            'message' => "Failed to write {$file}.",
        ], 500);
    }

    return new WP_REST_Response([
        'success' => true,
        'message' => "Updated {$file} ({$result} bytes).",
    ], 200);
}

