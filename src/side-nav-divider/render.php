<?php
/**
 * AWT Side nav divider — server-rendered output.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$divider_class = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'divider' ) ) : 'cds--side-nav__divider';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => $divider_class,
		'role'  => 'separator',
	)
);

printf( '<li %1$s></li>', $wrapper_attrs ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
