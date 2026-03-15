<?php
/**
 * Generic Page Template
 * Fallback for WordPress pages without a slug-specific template.
 */
get_header();

while (have_posts()) :
    the_post();
?>

<div class="static-page-header">
    <div class="container">
        <h1><?php the_title(); ?></h1>
    </div>
</div>

<div class="container">
    <div class="static-page-content">
        <?php the_content(); ?>
    </div>
</div>

<?php
endwhile;
get_footer();
?>
