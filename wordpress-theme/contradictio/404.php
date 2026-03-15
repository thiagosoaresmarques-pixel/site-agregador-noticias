<?php
/**
 * 404 Template — Page Not Found
 * Premium design with search bar and suggested articles
 */
get_header();
?>

<div class="error-404-page">
    <div class="container">

        <div class="error-hero">
            <div class="error-glitch" aria-hidden="true">404</div>
            <h1>Página não encontrada</h1>
            <p class="error-subtitle">
                A página que você procura pode ter sido movida, removida ou nunca existiu.
                Que tal explorar nossas últimas análises?
            </p>

            <form role="search" method="get" class="error-search" action="<?php echo esc_url(home_url('/')); ?>">
                <input type="search" name="s" placeholder="Buscar análises..." aria-label="Buscar" autocomplete="off">
                <button type="submit">🔍 Buscar</button>
            </form>

            <div class="error-links">
                <a href="<?php echo esc_url(home_url('/')); ?>">← Página Inicial</a>
                <a href="<?php echo esc_url(home_url('/sobre/')); ?>">Sobre</a>
                <a href="<?php echo esc_url(home_url('/metodologia/')); ?>">Metodologia</a>
            </div>
        </div>

        <!-- Suggested Articles -->
        <?php
        $suggested = new WP_Query([
            'posts_per_page' => 6,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ]);

        if ($suggested->have_posts()) :
        ?>
        <div class="error-suggestions">
            <h2 class="articles-section-title">Últimas Análises</h2>

            <div class="articles-grid">
                <?php
                while ($suggested->have_posts()) :
                    $suggested->the_post();
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
                        <div class="card-image-wrapper" style="display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--text-muted);">⚖️</div>
                    <?php endif; ?>

                    <div class="card-body">
                        <span class="card-category" style="background: <?php echo sintese_category_color($cat_slug); ?>">
                            <?php echo esc_html($cat_name); ?>
                        </span>
                        <h3 class="card-title">
                            <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                        </h3>
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
        </div>
        <?php endif; ?>

    </div>
</div>

<?php get_footer(); ?>
