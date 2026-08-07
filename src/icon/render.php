<?php
/**
 * AWT Icon — server-rendered output.
 *
 * Renders an inline SVG with appropriate ARIA per `decorative`. Sizes follow
 * Carbon's icon scale (16 / 20 / 24 / 32). Empty iconName produces no output.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\icon;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$icon_name = isset( $attributes['iconName'] ) ? (string) $attributes['iconName'] : '';
if ( $icon_name === '' ) {
	return;
}

$size       = isset( $attributes['size'] ) ? (int) $attributes['size'] : 16;
$label      = isset( $attributes['label'] ) ? (string) $attributes['label'] : '';
$decorative = ! isset( $attributes['decorative'] ) || ! empty( $attributes['decorative'] );
$color      = isset( $attributes['color'] ) ? (string) $attributes['color'] : 'inherit';
$inline     = ! empty( $attributes['inline'] );

$style = sprintf( 'width: %dpx; height: %dpx;', $size, $size );
if ( $color !== 'inherit' ) {
	$style .= sprintf( ' color: var(--cds-%s);', preg_replace( '/[^a-z0-9\-]/', '', $color ) );
}
if ( $inline ) {
	$style .= ' display: inline-flex; vertical-align: middle;';
}

$classes = array( 'awt-icon' );
if ( $inline ) {
	$classes[] = 'awt-icon--inline';
}

$svg = icon( $icon_name, $size );
if ( $svg === '' ) {
	// Carbon icon not in the inline registry. Fall back to a visible label so
	// authors can spot misnamed icons during development.
	$svg = sprintf(
		'<span aria-hidden="true" style="font-family: monospace; font-size: 0.625rem;">[%s]</span>',
		esc_html( $icon_name )
	);
}

if ( ! $decorative && $label !== '' ) {
	// Replace the aria-hidden marker with role=img + accessible name.
	$svg = preg_replace(
		'/aria-hidden="true"/',
		sprintf( 'role="img" aria-label="%s"', esc_attr( $label ) ),
		$svg,
		1
	);
}

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => implode( ' ', $classes ),
		'style' => $style,
	)
);

printf( '<span %1$s>%2$s</span>', $wrapper_attrs, $svg ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; static plugin-authored SVG; dynamic classes escaped with esc_attr() above.
