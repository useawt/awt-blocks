<?php
/**
 * AWT Breadcrumb. Inner blocks are breadcrumb items; we wrap them in <nav><ol>.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\classnames;
use function AWT\Blocks\Render\html_attrs;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$aria_label        = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : __( 'Breadcrumbs', 'awt' );
$no_trailing_slash = ! empty( $attributes['noTrailingSlash'] );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$nav_class = $ds
	? $ds->classes_for( 'breadcrumb', array( 'noTrailingSlash' => $no_trailing_slash ) )
	: ( 'cds--breadcrumb' . ( $no_trailing_slash ? ' cds--breadcrumb--no-trailing-slash' : '' ) );

$list_class = $ds ? $ds->classes_for( 'breadcrumb', array( 'element' => 'list' ) ) : 'cds--breadcrumb__list';

$class         = classnames( $nav_class, array(), (string) ( $attributes['className'] ?? '' ) );
$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'      => $class,
		'aria-label' => $aria_label !== '' ? $aria_label : __( 'Breadcrumbs', 'awt' ),
	)
);

printf(
	'<nav %1$s><ol class="%2$s">%3$s</ol></nav>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $list_class ),
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
