<?php
/**
 * Single Article Template — Dialectical Layout
 * Shows Tese, Antítese, and Síntese in visually distinct sections
 */
get_header();

while (have_posts()) :
    the_post();
    $cat = get_the_category();
    $cat_name = $cat ? $cat[0]->name : 'Geral';
    $cat_slug = $cat ? $cat[0]->slug : 'geral';
    $content = get_the_content();
    $sections = sintese_parse_sections($content);
?>

<!-- Article Header -->
<div class="article-header">
    <span class="article-category" style="background: <?php echo sintese_category_color($cat_slug); ?>">
        <?php echo esc_html($cat_name); ?>
    </span>
    <h1><?php the_title(); ?></h1>
    <?php if (has_excerpt()) : ?>
        <p class="article-subtitle"><?php echo get_the_excerpt(); ?></p>
    <?php endif; ?>
    <div class="article-meta">
        <span>📰 <?php echo esc_html(get_the_author()); ?></span>
        <span>📅 <?php echo get_the_date('d/m/Y \à\s H:i'); ?></span>
        <span>⏱ <?php echo intval(ceil(str_word_count($content) / 200)); ?> min de leitura</span>
    </div>
</div>

<?php if (has_post_thumbnail()) : ?>
<div class="container" style="margin-bottom: var(--space-8);">
    <div style="border-radius: var(--radius-lg); overflow: hidden; max-height: 500px;">
        <?php the_post_thumbnail('hero-image', ['style' => 'width:100%; height:100%; object-fit:cover;']); ?>
    </div>
</div>
<?php endif; ?>

<!-- Article Layout with Sidebar -->
<div class="article-layout">
    <div class="article-content">

        <?php if (!empty($sections['preformatted'])) : ?>
            <!-- Pre-formatted Dialectical Sections (from API) -->
            <?php echo $sections['preformatted']; ?>

        <?php elseif (!empty($sections)) : ?>
            <!-- Dialectical Sections Detected (legacy markdown parsing) -->

            <?php if (!empty($sections['thesis'])) : ?>
            <div class="dialectical-section section-thesis">
                <span class="section-badge">🔵 Tese — O Relato Factual</span>
                <div class="section-content">
                    <?php echo wpautop($sections['thesis']); ?>
                </div>
            </div>
            <?php endif; ?>

            <?php if (!empty($sections['antithesis'])) : ?>
            <div class="dialectical-section section-antithesis">
                <span class="section-badge">🔴 Antítese — O Contra-Argumento</span>
                <div class="section-content">
                    <?php echo wpautop($sections['antithesis']); ?>
                </div>
            </div>
            <?php endif; ?>

            <?php if (!empty($sections['synthesis'])) : ?>
            <div class="dialectical-section section-synthesis">
                <span class="section-badge">🟢 Síntese — Visão Integrada</span>
                <div class="section-content">
                    <?php echo wpautop($sections['synthesis']); ?>
                </div>
            </div>
            <?php endif; ?>

        <?php else : ?>
            <!-- Standard Content (no dialectical sections detected) -->
            <div class="dialectical-section section-synthesis">
                <span class="section-badge">🟢 Análise</span>
                <div class="section-content">
                    <?php the_content(); ?>
                </div>
            </div>
        <?php endif; ?>

        <!-- Source Attribution -->
        <div style="margin-top: var(--space-8); padding: var(--space-6); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
            <p style="font-size: var(--font-size-sm); color: var(--text-muted); margin: 0;">
                ⚖️ Este artigo foi gerado pelo sistema <strong>Síntese News</strong> utilizando análise dialética automatizada
                (Tese → Antítese → Síntese). As fontes originais são citadas ao longo do texto. 
                O conteúdo foi revisado editorialmente antes da publicação.
            </p>
        </div>

        <!-- Related Articles -->
        <div style="margin-top: var(--space-10);">
            <h2 class="articles-section-title">Artigos Relacionados</h2>
            <div class="articles-grid" style="grid-template-columns: repeat(2, 1fr);">
                <?php
                $related = new WP_Query([
                    'posts_per_page' => 2,
                    'post__not_in'   => [get_the_ID()],
                    'category__in'   => wp_get_post_categories(get_the_ID()),
                ]);
                while ($related->have_posts()) :
                    $related->the_post();
                    $rcat = get_the_category();
                    $rcat_name = $rcat ? $rcat[0]->name : 'Geral';
                    $rcat_slug = $rcat ? $rcat[0]->slug : 'geral';
                ?>
                <article class="article-card">
                    <?php if (has_post_thumbnail()) : ?>
                        <a href="<?php the_permalink(); ?>">
                            <?php the_post_thumbnail('card-thumb', ['class' => 'card-image']); ?>
                        </a>
                    <?php else : ?>
                        <div class="card-image" style="display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--text-muted);">⚖️</div>
                    <?php endif; ?>
                    <div class="card-body">
                        <span class="card-category" style="background:<?php echo sintese_category_color($rcat_slug); ?>"><?php echo esc_html($rcat_name); ?></span>
                        <h3 class="card-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                        <div class="card-meta">
                            <span><?php echo get_the_date('d/m/Y'); ?></span>
                        </div>
                    </div>
                </article>
                <?php
                endwhile;
                wp_reset_postdata();
                ?>
            </div>
        </div>

    </div>

    <!-- Sidebar -->
    <aside class="article-sidebar">
        <!-- Tags -->
        <?php $tags = get_the_tags(); if ($tags) : ?>
        <div class="sidebar-widget">
            <h4>Tags</h4>
            <div class="sidebar-tags">
                <?php foreach ($tags as $tag) : ?>
                    <a href="<?php echo esc_url(get_tag_link($tag->term_id)); ?>">
                        <?php echo esc_html($tag->name); ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Share -->
        <div class="sidebar-widget">
            <h4>Compartilhar</h4>
            <div class="share-buttons">
                <a class="share-btn" href="https://twitter.com/intent/tweet?url=<?php echo urlencode(get_permalink()); ?>&text=<?php echo urlencode(get_the_title()); ?>" target="_blank" title="Twitter">𝕏</a>
                <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode(get_permalink()); ?>" target="_blank" title="Facebook">f</a>
                <a class="share-btn" href="https://api.whatsapp.com/send?text=<?php echo urlencode(get_the_title() . ' ' . get_permalink()); ?>" target="_blank" title="WhatsApp">W</a>
                <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=<?php echo urlencode(get_permalink()); ?>" target="_blank" title="LinkedIn">in</a>
            </div>
        </div>

        <!-- About -->
        <div class="sidebar-widget">
            <h4>Sobre a Análise</h4>
            <p style="font-size: var(--font-size-sm); color: var(--text-muted); line-height: 1.7;">
                Este artigo utiliza o método <strong>dialético</strong> de análise: a <span style="color:var(--thesis-color)">Tese</span> apresenta os fatos, 
                a <span style="color:var(--antithesis-color)">Antítese</span> questiona e contrapõe, e a 
                <span style="color:var(--synthesis-color)">Síntese</span> integra as perspectivas em uma visão superior.
            </p>
        </div>

        <?php if (is_active_sidebar('article-sidebar')) : ?>
            <?php dynamic_sidebar('article-sidebar'); ?>
        <?php endif; ?>
    </aside>
</div>

<?php
endwhile;
get_footer();
?>
