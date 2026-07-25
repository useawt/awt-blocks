<?php
/**
 * AWT Hero — server-rendered output.
 *
 * V2 (version attribute = 2): the hero body is real inner blocks — eyebrow
 * paragraph, heading, description paragraph, extra content, and an inline-set
 * CTA row — so $content already carries everything; this file only supplies
 * the wrapper grid and the optional image.
 *
 * v1 (no version attribute stored): eyebrow/heading/description live in block
 * attributes and $content is the bare CTA row. Content saved before the v2
 * migration keeps rendering through this branch unchanged until it is next
 * edited (the editor migrates it to v2 on open via the block deprecation).
 *
 * @var array  $attributes
 * @var string $content    Inner blocks markup.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

$version   = isset( $attributes['version'] ) ? (int) $attributes['version'] : 1;
$layout    = isset( $attributes['layout'] ) ? (string) $attributes['layout'] : 'text-only';
$image_url = isset( $attributes['imageUrl'] ) ? (string) $attributes['imageUrl'] : '';
$image_alt = isset( $attributes['imageAlt'] ) ? (string) $attributes['imageAlt'] : '';

// Image sizing (two-column layout only). Constrain to known tokens so a stray
// attribute value can't inject an arbitrary class. Both map to theme.css
// modifier classes; see the editor's RATIO_OPTIONS / WIDTH_OPTIONS.
$image_ratio = isset( $attributes['imageRatio'] ) ? (string) $attributes['imageRatio'] : '';
$image_width = isset( $attributes['imageWidth'] ) ? (string) $attributes['imageWidth'] : 'equal';
if ( ! in_array( $image_ratio, array( '1x1', '4x3', '3x2', '16x9', '3x4', '4x5' ), true ) ) {
	$image_ratio = '';
}
if ( ! in_array( $image_width, array( 'equal', 'narrow', 'wide' ), true ) ) {
	$image_width = 'equal';
}

$has_image     = $layout === 'text-with-image-right' && $image_url !== '';
$wrapper_class = 'awt-hero awt-hero--' . $layout;
if ( $has_image && $image_width !== 'equal' ) {
	$wrapper_class .= ' awt-hero--img-' . $image_width;
}
$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $wrapper_class ) );

$image_class = 'awt-hero__image';
if ( $image_ratio !== '' ) {
	$image_class .= ' awt-hero__image--ratio-' . $image_ratio;
}

// The hero sits at the top of the page, so its image is almost always the
// largest paint (LCP). Eager + high priority keeps the browser from
// deferring it.
$image_html = $has_image ? sprintf(
	'<img class="%1$s" src="%2$s" alt="%3$s" loading="eager" fetchpriority="high" />',
	esc_attr( $image_class ),
	esc_url( $image_url ),
	esc_attr( $image_alt )
) : '';

// WordPress's content filter only inspects images that carry width/height,
// so it never sees this one — without the flag it hands its one
// fetchpriority="high" hint to some other (usually below-the-fold) image.
if ( $has_image && function_exists( 'wp_high_priority_element_flag' ) ) {
	wp_high_priority_element_flag( false );
}

if ( $version >= 2 ) {
	printf(
		'<div %1$s><div class="awt-hero__text">%2$s</div>%3$s</div>',
		$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- from get_block_wrapper_attributes().
		$content,       // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner blocks, rendered by core.
		$image_html     // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
	);
	return;
}

// ---- v1 legacy rendering (attribute-based text fields + bare CTA row) ----

$eyebrow       = isset( $attributes['eyebrow'] ) ? (string) $attributes['eyebrow'] : '';
$heading       = isset( $attributes['heading'] ) ? (string) $attributes['heading'] : '';
$description   = isset( $attributes['description'] ) ? (string) $attributes['description'] : '';
$heading_level = isset( $attributes['headingLevel'] ) && 2 === (int) $attributes['headingLevel'] ? 2 : 1;

$eyebrow_html     = $eyebrow !== '' ? sprintf( '<p class="awt-hero__eyebrow">%s</p>', wp_kses_post( $eyebrow ) ) : '';
$heading_html     = $heading !== '' ? sprintf( '<h%1$d class="awt-hero__heading">%2$s</h%1$d>', $heading_level, wp_kses_post( $heading ) ) : '';
$description_html = $description !== '' ? sprintf( '<p class="awt-hero__description">%s</p>', wp_kses_post( $description ) ) : '';
$cta_html         = trim( $content ) !== '' ? sprintf( '<div class="awt-hero__cta">%s</div>', $content ) : '';

printf(
	'<div %1$s>'
	. '<div class="awt-hero__text">%2$s%3$s%4$s%5$s</div>'
	. '%6$s'
	. '</div>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- from get_block_wrapper_attributes().
	$eyebrow_html,     // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
	$heading_html,     // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
	$description_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
	$cta_html,         // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner blocks, rendered by core.
	$image_html        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
);
