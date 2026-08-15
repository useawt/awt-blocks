<?php
/**
 * AWT Skip link — server-rendered output.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$target_id = isset( $attributes['targetId'] ) && $attributes['targetId'] !== ''
	? (string) $attributes['targetId']
	: 'main-content';

// Text precedence (per §5):
// 1. Per-block `text` attribute (set in the Site Editor on a specific instance)
// 2. Theme-wide override at AWT Settings → Navigation → Skip link text
// 3. The translated default 'Skip to main content'
//
// `AWT\Theme\Settings\get` lives in the theme (not the plugin) — guarded
// with `function_exists` so the block continues to work if the plugin is
// activated outside an AWT theme (Premium customers who pair the plugin
// with another theme).
$theme_default = '';
if ( function_exists( '\\AWT\\Theme\\Settings\\get' ) ) {
	$theme_default = (string) \AWT\Theme\Settings\get( 'navigation.skipLinkText' );
}
if ( isset( $attributes['text'] ) && $attributes['text'] !== '' ) {
	$text = (string) $attributes['text'];
} elseif ( $theme_default !== '' ) {
	$text = $theme_default;
} else {
	$text = __( 'Skip to main content', 'awt-blocks' );
}

// §A: resolve CSS classes from the design system layer (Carbon).
// Guarded so the block still works when paired with a non-AWT theme.
$ds         = function_exists( '\\AWT\\Theme\\DesignSystem\\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;
$root_class = $ds ? $ds->classes_for( 'skip-link' ) : 'cds--skip-to-content';

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $root_class ) );

printf(
	'<a %1$s href="#%2$s">%3$s</a>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $target_id ),
	esc_html( $text )
);
