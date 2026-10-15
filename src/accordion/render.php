<?php
/**
 * AWT Accordion — server-rendered output.
 *
 * Wraps inner accordion-items in <ul>. Interactivity API context carries the
 * singleOpen flag down to items so they can coordinate closing siblings.
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

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$align       = isset( $attributes['align'] ) ? (string) $attributes['align'] : 'end';
$size        = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$single_open = ! empty( $attributes['singleOpen'] );

$accordion_class = $ds
	? $ds->classes_for(
		'accordion',
		array(
			'align' => $align,
			'size'  => $size,
		)
	)
	: ( 'cds--accordion cds--accordion--' . $align . ' cds--accordion--' . $size );

$context = wp_json_encode( array( 'singleOpen' => $single_open ) );

$accordion_attrs = array(
	'class'               => $accordion_class,
	'data-wp-interactive' => 'awt/accordion',
	'data-wp-context'     => $context,
);
// Carbon builds the accordion as a list and takes the markers off, and Safari
// stops treating a list with no markers as a list; `role="list"` gives it
// back, as for the header menus. A Role set in the Accessibility panel wins.
if ( trim( (string) ( $attributes['awtRole'] ?? '' ) ) === '' ) {
	$accordion_attrs['role'] = 'list';
}
$wrapper_attrs = get_block_wrapper_attributes( $accordion_attrs );

printf( '<ul %1$s>%2$s</ul>', $wrapper_attrs, $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; inner-block markup, escaped by each inner block on render.
