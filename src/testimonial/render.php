<?php
/**
 * AWT Testimonial — server-rendered output.
 *
 * Quote body renders in IBM Plex Serif (weight 300) per Carbon's c4d-quote
 * convention (e.g. ibm.com case studies). Source attribution uses Plex Sans
 * for the two-typeface contrast. Renders as figure/blockquote/figcaption
 * for WCAG-correct quote semantics. Marks are inline SVGs.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$quote             = isset( $attributes['quote'] ) ? (string) $attributes['quote'] : '';
$author_name       = isset( $attributes['authorName'] ) ? (string) $attributes['authorName'] : '';
$author_role       = isset( $attributes['authorRole'] ) ? (string) $attributes['authorRole'] : '';
$author_org        = isset( $attributes['authorOrg'] ) ? (string) $attributes['authorOrg'] : '';
$avatar_url        = isset( $attributes['authorAvatarUrl'] ) ? (string) $attributes['authorAvatarUrl'] : '';
$avatar_alt        = isset( $attributes['authorAvatarAlt'] ) ? (string) $attributes['authorAvatarAlt'] : '';
$mark_style        = isset( $attributes['markStyle'] ) ? (string) $attributes['markStyle'] : 'double-curved';
$quote_size        = isset( $attributes['quoteSize'] ) ? (string) $attributes['quoteSize'] : 'lg';
$attribution_style = isset( $attributes['attributionStyle'] ) ? (string) $attributes['attributionStyle'] : 'stacked';
$kind              = isset( $attributes['kind'] ) ? (string) $attributes['kind'] : 'plain';
$align             = isset( $attributes['align'] ) ? (string) $attributes['align'] : 'start';

// Validate enums.
$valid_marks  = array( 'double-curved', 'double-straight', 'single-curved', 'none' );
$valid_sizes  = array( 'md', 'lg', 'xl' );
$valid_attr   = array( 'stacked', 'inline' );
$valid_kinds  = array( 'plain', 'card' );
$valid_aligns = array( 'start', 'center' );

if ( ! in_array( $mark_style, $valid_marks, true ) ) {
	$mark_style = 'double-curved';
}
if ( ! in_array( $quote_size, $valid_sizes, true ) ) {
	$quote_size = 'lg';
}
if ( ! in_array( $attribution_style, $valid_attr, true ) ) {
	$attribution_style = 'stacked';
}
if ( ! in_array( $kind, $valid_kinds, true ) ) {
	$kind = 'plain';
}
if ( ! in_array( $align, $valid_aligns, true ) ) {
	$align = 'start';
}

$classes = array(
	'awt-testimonial',
	'awt-testimonial--' . $kind,
	'awt-testimonial--' . $quote_size,
	'awt-testimonial--align-' . $align,
	'awt-testimonial--mark-' . $mark_style,
	'awt-testimonial--attr-' . $attribution_style,
);

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => implode( ' ', $classes ),
	)
);

// Build the SVG mark.
$mark_svgs = array(
	'double-curved'   => '<svg class="awt-testimonial__mark awt-testimonial__mark--open" viewBox="0 0 40 32" aria-hidden="true" focusable="false"><path d="M14.4 0c-7.95 0-14.4 6.45-14.4 14.4v17.6h17.6v-17.6h-8.8c0-4.85 3.95-8.8 8.8-8.8v-5.6zm22.4 0c-7.95 0-14.4 6.45-14.4 14.4v17.6h17.6v-17.6h-8.8c0-4.85 3.95-8.8 8.8-8.8v-5.6z" fill="currentColor"/></svg>',
	'double-straight' => '<svg class="awt-testimonial__mark awt-testimonial__mark--open" viewBox="0 0 40 32" aria-hidden="true" focusable="false"><rect x="2" y="2" width="14" height="20" fill="currentColor"/><rect x="24" y="2" width="14" height="20" fill="currentColor"/></svg>',
	'single-curved'   => '<svg class="awt-testimonial__mark awt-testimonial__mark--open" viewBox="0 0 20 32" aria-hidden="true" focusable="false"><path d="M14.4 0c-7.95 0-14.4 6.45-14.4 14.4v17.6h17.6v-17.6h-8.8c0-4.85 3.95-8.8 8.8-8.8v-5.6z" fill="currentColor"/></svg>',
	'none'            => '',
);
$mark_html = $mark_svgs[ $mark_style ] ?? '';

// Build the quote body.
$quote_html = $quote !== ''
	? sprintf( '<blockquote class="awt-testimonial__quote">%s</blockquote>', wp_kses_post( $quote ) )
	: '';

// Build the avatar (if URL set; alt may be empty — linter flags that as Error).
$avatar_html = '';
if ( $avatar_url !== '' ) {
	$avatar_html = sprintf(
		'<img class="awt-testimonial__avatar" src="%1$s" alt="%2$s" loading="lazy" width="48" height="48" />',
		esc_url( $avatar_url ),
		esc_attr( $avatar_alt )
	);
}

// Build the source details (name / role / org).
$source_parts = array();
if ( $author_name !== '' ) {
	$source_parts[] = sprintf( '<div class="awt-testimonial__source-name">%s</div>', esc_html( $author_name ) );
}
if ( $author_role !== '' ) {
	$source_parts[] = sprintf( '<div class="awt-testimonial__source-role">%s</div>', esc_html( $author_role ) );
}
if ( $author_org !== '' ) {
	$source_parts[] = sprintf( '<div class="awt-testimonial__source-org">%s</div>', esc_html( $author_org ) );
}
$source_details_html = ! empty( $source_parts )
	? sprintf( '<div class="awt-testimonial__source-details">%s</div>', implode( '', $source_parts ) )
	: '';

// Figcaption only renders if there's any source content (avatar or name/role/org).
$caption_html = '';
if ( $avatar_html !== '' || $source_details_html !== '' ) {
	$caption_html = sprintf(
		'<figcaption class="awt-testimonial__source">%s%s</figcaption>',
		$avatar_html,
		$source_details_html
	);
}

printf(
	'<figure %1$s>%2$s%3$s%4$s</figure>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$mark_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above.
	$quote_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$caption_html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
);
