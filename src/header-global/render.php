<?php
/**
 * AWT Header global — server-rendered output.
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

$aria_label = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : '';

// §A: CSS classes from the active design system (guarded for non-AWT themes).
$ds         = function_exists( '\\AWT\\Theme\\DesignSystem\\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;
$root_class = $ds ? $ds->classes_for( 'header-global' ) : 'cds--header__global';

$attrs = array( 'class' => $root_class );
if ( $aria_label !== '' ) {
	$attrs['aria-label'] = $aria_label;
	$attrs['role']       = 'region';
}
$wrapper_attrs = get_block_wrapper_attributes( $attrs );

printf( '<div %1$s>%2$s</div>', $wrapper_attrs, $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; inner-block markup, escaped by each inner block on render.
