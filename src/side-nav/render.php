<?php
/**
 * AWT Side nav — server-rendered output.
 *
 * Mode 'none' self-removes per spec. Otherwise emits Carbon's side-nav landmark.
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

$nav_mode         = isset( $attributes['mode'] ) ? (string) $attributes['mode'] : 'persistent';
$aria_label       = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : __( 'Side navigation', 'awt' );
$default_expanded = ! isset( $attributes['defaultExpanded'] ) || ! empty( $attributes['defaultExpanded'] );
$dom_id           = isset( $attributes['id'] ) ? (string) $attributes['id'] : 'side-nav';

if ( $nav_mode === 'none' ) {
	return;
}

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$root_class = $ds
	? $ds->classes_for(
		'side-nav',
		array(
			'mode'     => $nav_mode,
			'expanded' => $default_expanded,
		)
	)
	// Theme-absent fallback; mirrors Carbon::classes_for( 'side-nav' ), including
	// the `--ux` class that docks a persistent nav below the 3rem header.
	: (
		'cds--side-nav cds--side-nav--' . $nav_mode
		. ( $nav_mode === 'persistent' ? ' cds--side-nav--ux' : '' )
		. ( $default_expanded ? ' cds--side-nav--expanded' : '' )
	);

$nav_class   = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'navigation' ) ) : 'cds--side-nav__navigation';
$items_class = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'items' ) ) : 'cds--side-nav__items';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'      => $root_class,
		'aria-label' => $aria_label,
		'id'         => $dom_id,
	)
);

printf(
	'<aside %1$s><nav class="%2$s" aria-label="%3$s"><ul class="%4$s">%5$s</ul></nav></aside>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $nav_class ),
	esc_attr( $aria_label ),
	esc_attr( $items_class ),
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
