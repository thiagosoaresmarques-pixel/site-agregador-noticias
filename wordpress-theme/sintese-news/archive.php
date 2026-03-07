<?php
/**
 * Archive/Category Template (v2.0)
 */
get_header();
?>

<div class="container">
    <div class="article-header" style="text-align: left; margin-bottom: var(--space-8);">
        <h1>
            <?php
            if (is_category()) {
                single_cat_title('📂 ');
            } elseif (is_tag()) {
                single_tag_title('🏷️ ');
            } elseif (is_search()) {
                echo '🔍 Resultados para: "' . esc_html(get_search_query()) . '"';
            } else {
                echo 'Arquivo';
            }
            ?>
        </h1>
        <?php if (category_description()) : ?>
            <p class="article-subtitle"><?php echo category_description(); ?></p>
        <?php endif; ?>
    </div>

    <div class="articles-grid">
        <?php
        if (have_posts()) :
            while (have_posts()) :
                the_post();
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
                <span class="card-category" style="background:<?php echo sintese_category_color($cat_slug); ?>">
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
        else :
        ?>
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-16);">
            <p style="font-size: var(--font-size-xl); color: var(--text-muted);">Nenhum artigo encontrado nesta categoria.</p>
        </div>
        <?php endif; ?>
    </div>

    <div class="pagination">
        <?php
        echo paginate_links([
            'prev_text' => '← Anterior',
            'next_text' => 'Próxima →',
        ]);
        ?>
    </div>
</div>

<?php get_footer(); ?>
