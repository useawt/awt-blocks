<?php
/**
 * AWT Section — server-rendered output.
 *
 * Establishes Carbon spacing rhythm. Foundation for Hero / Pricing / Feature
 * grid patterns. Per spec §2 awt/section.
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$padding_block  = isset( $attributes['paddingBlock'] ) ? (string) $attributes['paddingBlock'] : '07';
$padding_inline = isset( $attributes['paddingInline'] ) ? (string) $attributes['paddingInline'] : '06';
$max_width_key  = isset( $attributes['maxWidth'] ) ? (string) $attributes['maxWidth'] : 'content';
$custom_max     = isset( $attributes['customMaxWidth'] ) ? (string) $attributes['customMaxWidth'] : '';
$background     = isset( $attributes['backgroundColor'] ) ? (string) $attributes['backgroundColor'] : '';
$theme_scope    = isset( $attributes['themeScope'] ) ? (string) $attributes['themeScope'] : 'inherit';
$tag_name       = isset( $attributes['tagName'] ) ? (string) $attributes['tagName'] : 'section';
$aria_label     = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : '';
$anchor         = isset( $attributes['anchor'] ) ? (string) $attributes['anchor'] : '';

$allowed_tags = array( 'section', 'div', 'article', 'aside' );
if ( ! in_array( $tag_name, $allowed_tags, true ) ) {
	$tag_name = 'section';
}

$max_widths = array(
	'none'    => '100%',
	'narrow'  => '42rem',
	'reading' => '48rem',
	'content' => '66rem',
	'wide'    => '82.5rem',
);
$max_width  = $max_widths[ $max_width_key ] ?? '66rem';
if ( $max_width_key === 'custom' && $custom_max !== '' ) {
	$max_width = $custom_max;
}

$classes = array( 'awt-section' );

// We use the `padding` shorthand (top right bottom left) rather than the
// logical longhands `padding-block` / `padding-inline`, because WordPress's
// `safecss_filter_attr` (which sanitizes inline styles on block wrapper
// attributes) strips logical longhands silently — they survive in the
// editor (React inline-style bypasses the sanitizer) but not on the
// published page. The shorthand has been in the kses CSS allowlist forever.
//
// Full-width sections escape the theme's root padding (with
// useRootPaddingAwareAlignments, core pulls .alignfull out via negative
// margins so backgrounds bleed edge to edge) and core re-applies that
// padding only to children of its OWN layout containers — .awt-section__inner
// isn't one, so on viewports narrower than the inner column the content
// would sit at the author's raw padding from the screen edge (2px when the
// author picked spacing-01). Floor the inline padding at the root padding;
// a larger author choice still wins. max(var(), var()) passes
// safecss_filter_attr.
$pad_block = 'var(--cds-spacing-' . $padding_block . ')';
if ( ( isset( $attributes['align'] ) ? (string) $attributes['align'] : '' ) === 'full' ) {
	$pad_right = 'max(var(--cds-spacing-' . $padding_inline . '), var(--wp--style--root--padding-right, 0px))';
	$pad_left  = 'max(var(--cds-spacing-' . $padding_inline . '), var(--wp--style--root--padding-left, 0px))';
	$styles    = array(
		'padding: ' . $pad_block . ' ' . $pad_right . ' ' . $pad_block . ' ' . $pad_left,
	);
} else {
	$styles = array(
		'padding: ' . $pad_block . ' var(--cds-spacing-' . $padding_inline . ')',
	);
}

if ( $background !== '' ) {
	$styles[] = 'background-color: var(--cds-' . $background . ')';
}

// Theme scope override. "g10"/"g100" force that Carbon zone directly.
// "light"/"dark" resolve to the active style variation's paired scope
// (e.g. White + g90 → light = white, dark = g90) — a per-site choice, so
// it resolves server-side to the matching cds--{variant} zone class. The
// awt-section--scope-* class records the author's intent in the markup.
// Fallback (theme function unavailable) matches the theme.json default
// pair: white + g100.
if ( in_array( $theme_scope, array( 'g10', 'g100' ), true ) ) {
	$classes[] = 'cds--' . $theme_scope;
} elseif ( in_array( $theme_scope, array( 'light', 'dark' ), true ) ) {
	$variants  = function_exists( '\\AWT\\Theme\\theme_scopes' )
		? \AWT\Theme\theme_scopes()
		: array(
			'light' => 'white',
			'dark'  => 'g100',
		);
	$classes[] = 'awt-section--scope-' . $theme_scope;
	$classes[] = 'cds--' . $variants[ $theme_scope ];
}

$attrs = array(
	'class' => implode( ' ', $classes ),
	'style' => implode( '; ', $styles ),
);
if ( $aria_label !== '' && $tag_name === 'section' ) {
	$attrs['aria-label'] = $aria_label;
}
if ( $anchor !== '' ) {
	$attrs['id'] = $anchor;
}

$wrapper_attrs = get_block_wrapper_attributes( $attrs );

printf(
	'<%1$s %2$s><div class="awt-section__inner" style="max-width: %3$s; margin-inline: auto;">%4$s</div></%1$s>',
	tag_escape( $tag_name ),
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $max_width ),
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
