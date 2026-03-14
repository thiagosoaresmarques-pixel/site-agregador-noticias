<?php
/**
 * Homepage Template — Dialectical Grid Layout
 */
get_header();
?>

<div class="container">

    <?php
    // ─── Hero: Latest Post ─────────────────────────
    $hero = new WP_Query(['posts_per_page' => 1]);
    if ($hero->have_posts()) :
        $hero->the_post();
        $cat = get_the_category();
        $cat_name = $cat ? $cat[0]->name : 'Geral';
        $cat_slug = $cat ? $cat[0]->slug : 'geral';
    ?>
    <article class="hero-article">
        <?php if (has_post_thumbnail()) : ?>
            <?php the_post_thumbnail('hero-image', ['class' => 'hero-image']); ?>
        <?php endif; ?>
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <span class="hero-category" style="background: <?php echo sintese_category_color($cat_slug); ?>">
                <?php echo esc_html($cat_name); ?>
            </span>
            <h2 class="hero-title">
                <a href="<?php the_permalink(); ?>" style="color: var(--text-primary); -webkit-text-fill-color: var(--text-primary);">
                    <?php the_title(); ?>
                </a>
            </h2>
            <p class="hero-excerpt"><?php echo wp_trim_words(get_the_excerpt(), 30); ?></p>
            <div class="hero-meta">
                <span>📰 <?php echo esc_html(get_the_author()); ?></span>
                <span>📅 <?php echo get_the_date('d/m/Y'); ?></span>
                <span>⏱ <?php echo intval(ceil(str_word_count(get_the_content()) / 200)); ?> min de leitura</span>
            </div>
        </div>
    </article>
    <?php
        wp_reset_postdata();
    endif;
    ?>

    <?php
    // ─── Dialectical Preview (Latest Article) ──────
    $latest = new WP_Query(['posts_per_page' => 1, 'offset' => 0]);
    if ($latest->have_posts()) :
        $latest->the_post();
        $content = get_the_content();
    ?>

    <div class="dialectical-grid">
        <div class="dialectical-card thesis animate-on-scroll">
            <span class="dialectical-badge thesis">🔵 Tese</span>
            <h3>O Relato Factual</h3>
            <p>Análise imparcial dos fatos, dados e declarações oficiais sobre o tema. O ponto de partida do processo dialético.</p>
        </div>
        <div class="dialectical-card antithesis animate-on-scroll">
            <span class="dialectical-badge antithesis">🔴 Antítese</span>
            <h3>O Contra-Argumento</h3>
            <p>Perspectivas negligenciadas, contradições ocultas e vozes dissidentes. O elemento de tensão necessário.</p>
        </div>
    </div>

    <div class="synthesis-card animate-on-scroll">
        <span class="dialectical-badge synthesis">🟢 Síntese</span>
        <h3><?php the_title(); ?></h3>
        <div class="synthesis-text">
            <?php echo wp_trim_words(get_the_excerpt(), 50); ?>
        </div>
        <a href="<?php the_permalink(); ?>" class="read-more">
            Ler Análise Completa →
        </a>
    </div>

    <?php
        wp_reset_postdata();
    endif;
    ?>

    <?php // ── In-Feed Ad ── ?>
    <?php sintese_render_ad('in_article', 'auto'); ?>

    <!-- ─── Articles Grid ──────────────────────────── -->
    <h2 class="articles-section-title">Últimas Análises</h2>

    <div class="articles-grid">
        <?php
        $paged = max(1, get_query_var('paged', 1));
        $per_page = 12;
        $offset = 1 + (($paged - 1) * $per_page);

        $articles = new WP_Query([
            'posts_per_page' => $per_page,
            'offset'         => $offset,
        ]);

        // Recalculate max_num_pages (WP miscalculates when offset is used)
        $total_posts = max(0, $articles->found_posts - 1); // -1 for hero post
        $articles->max_num_pages = ceil($total_posts / $per_page);

        while ($articles->have_posts()) :
            $articles->the_post();
            $cat = get_the_category();
            $cat_name = $cat ? $cat[0]->name : 'Geral';
            $cat_slug = $cat ? $cat[0]->slug : 'geral';
        ?>
        <article class="article-card animate-on-scroll">
            <?php if (has_post_thumbnail()) : ?>
                <a href="<?php the_permalink(); ?>">
                    <div class="card-image-wrapper">
                        <?php the_post_thumbnail('card-thumb'); ?>
                    </div>
                </a>
            <?php else : ?>
                <div class="card-image-wrapper" style="display:flex; align-items:center; justify-content:center; font-size:2rem; color:var(--text-muted);">⚖️</div>
            <?php endif; ?>

            <div class="card-body">
                <span class="card-category" style="background: <?php echo sintese_category_color($cat_slug); ?>">
                    <?php echo esc_html($cat_name); ?>
                </span>
                <h3 class="card-title">
                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                </h3>
                <p class="card-excerpt"><?php echo get_the_excerpt(); ?></p>
                <div class="card-meta">
                    <span><?php echo get_the_date('d/m/Y'); ?></span>
                    <span><?php echo esc_html(get_the_author()); ?></span>
                </div>
            </div>
        </article>
        <?php
        endwhile;
        wp_reset_postdata();
        ?>
    </div>

    <!-- Pagination -->
    <div class="pagination">
        <?php
        echo paginate_links([
            'total'     => $articles->max_num_pages,
            'current'   => $paged,
            'prev_text' => '← Anterior',
            'next_text' => 'Próxima →',
        ]);
        ?>
    </div>

</div>

<?php get_footer(); ?>
