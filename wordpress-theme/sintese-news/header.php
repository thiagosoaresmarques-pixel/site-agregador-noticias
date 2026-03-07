<!DOCTYPE html>
<html <?php language_attributes(); ?> data-theme="dark">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?php bloginfo('description'); ?>">
    <script>
        // Apply saved theme BEFORE paint to prevent flash
        (function() {
            var t = localStorage.getItem('sintese-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
        })();
    </script>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<!-- Nav Overlay (mobile) -->
<div class="nav-overlay" id="navOverlay"></div>

<header class="site-header">
    <div class="container">
        <div class="header-inner">
            <div class="site-branding">
                <div>
                    <div class="site-title">
                        <a href="<?php echo esc_url(home_url('/')); ?>">
                            <?php bloginfo('name'); ?>
                        </a>
                    </div>
                    <div class="site-tagline"><?php bloginfo('description'); ?></div>
                </div>
            </div>

            <nav class="main-nav" id="mainNav">
                <?php
                wp_nav_menu([
                    'theme_location' => 'primary',
                    'container'      => false,
                    'fallback_cb'    => function () {
                        echo '<ul>';
                        echo '<li><a href="' . esc_url(home_url('/')) . '">Início</a></li>';
                        $categories = get_categories(['orderby' => 'count', 'order' => 'DESC', 'number' => 6]);
                        foreach ($categories as $cat) {
                            echo '<li><a href="' . esc_url(get_category_link($cat->term_id)) . '">' . esc_html($cat->name) . '</a></li>';
                        }
                        echo '</ul>';
                    },
                ]);
                ?>
            </nav>

            <div class="header-controls">
                <button class="theme-toggle" id="themeToggle" aria-label="Alternar tema">
                    <span id="themeIcon">🌙</span>
                </button>
                <button class="menu-toggle" id="menuToggle" aria-label="Menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </div>
    </div>
</header>

<main class="site-main">
