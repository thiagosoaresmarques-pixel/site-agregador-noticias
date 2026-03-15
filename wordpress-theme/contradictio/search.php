<?php
/**
 * Search Results Template
 * Displays search results with styled header and article grid
 */
get_header();
$query = get_search_query();
$found = $wp_query->found_posts;
?>

<div class="search-results-page">
    <div class="container">

        <div class="search-hero">
            <span class="search-label">🔍 Resultados da busca</span>
            <h1>
                <?php if ($found > 0) : ?>
                    <?php echo esc_html($found); ?> resultado<?php echo $found !== 1 ? 's' : ''; ?> para
                <?php else : ?>
                    Nenhum resultado para
                <?php endif; ?>
                <span class="search-query">"<?php echo esc_html($query); ?>"</span>
            </h1>

            <form role="search" method="get" class="search-form-inline" action="<?php echo esc_url(home_url('/')); ?>">
                <input type="search" name="s" value="<?php echo esc_attr($query); ?>" placeholder="Refinar busca..." aria-label="Buscar">
                <button type="submit">Buscar</button>
            </form>
        </div>

        <?php if (have_posts()) : ?>
        <div class="search-results-list">
            <?php while (have_posts()) : the_post();
                $cat = get_the_category();
                $cat_name = $cat ? $cat[0]->name : 'Geral';
                $cat_slug = $cat ? $cat[0]->slug : 'geral';
                $excerpt = has_excerpt() ? get_the_excerpt() : wp_trim_words(strip_tags(get_the_content()), 30);
            ?>
            <article class="search-result-item">
                <?php if (has_post_thumbnail()) : ?>
                <a href="<?php the_permalink(); ?>" class="search-result-thumb">
                    <?php the_post_thumbnail('card-thumb'); ?>
                </a>
                <?php endif; ?>

                <div class="search-result-body">
                    <div class="search-result-meta">
                        <span class="card-category" style="background: <?php echo sintese_category_color($cat_slug); ?>">
                            <?php echo esc_html($cat_name); ?>
                        </span>
                        <time datetime="<?php echo get_the_date('c'); ?>">
                            📅 <?php echo get_the_date('d/m/Y'); ?>
                        </time>
                    </div>

                    <h2 class="search-result-title">
                        <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                    </h2>

                    <p class="search-result-excerpt"><?php echo esc_html($excerpt); ?></p>

                    <a href="<?php the_permalink(); ?>" class="search-result-link">
                        Ler análise completa →
                    </a>
                </div>
            </article>
            <?php endwhile; ?>
        </div>

        <!-- Pagination -->
        <div class="search-pagination">
            <?php
            the_posts_pagination([
                'mid_size'  => 2,
                'prev_text' => '← Anterior',
                'next_text' => 'Próxima →',
            ]);
            ?>
        </div>

        <?php else : ?>
        <div class="search-empty">
            <div class="search-empty-icon" aria-hidden="true">📭</div>
            <h2>Nenhuma análise encontrada</h2>
            <p>Tente buscar com termos diferentes ou explore nossas categorias.</p>

            <div class="search-categories">
                <?php
                $cats = get_categories(['hide_empty' => true, 'number' => 8]);
                foreach ($cats as $cat) :
                ?>
                <a href="<?php echo esc_url(get_category_link($cat->term_id)); ?>" class="search-cat-pill">
                    <?php echo esc_html($cat->name); ?>
                    <span class="cat-count"><?php echo $cat->count; ?></span>
                </a>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

    </div>
</div>

<?php get_footer(); ?>
