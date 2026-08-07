<?php
/**
 * AWT Feature grid — server-rendered output.
 *
 * Responsive grid using Carbon spacing tokens for the gap. Single-column on
 * small viewports; multi-column from md (672px) up.
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

$columns = isset( $attributes['columns'] ) ? (int) $attributes['columns'] : 3;
$gap     = isset( $attributes['gap'] ) ? (string) $attributes['gap'] : '06';

$columns = max( 1, min( 6, $columns ) );

$style = sprintf(
	'--awt-feature-grid-cols: %1$d; gap: var(--cds-spacing-%2$s, 1.5rem);',
	$columns,
	$gap
);

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => 'awt-feature-grid awt-feature-grid--cols-' . $columns,
		'style' => $style,
	)
);

printf( '<div %1$s>%2$s</div>', $wrapper_attrs, $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; inner-block markup, escaped by each inner block on render.
