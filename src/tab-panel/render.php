<?php
/**
 * AWT Tab panel — content panel paired by ordinal with an awt/tab.
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\unique_id;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$panel_id = unique_id( 'awt-tabpanel' );

$tab_content_class = $ds
	? $ds->classes_for( 'tabs', array( 'element' => 'tab-content' ) )
	: 'cds--tab-content';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'    => $tab_content_class,
		'id'       => $panel_id,
		'role'     => 'tabpanel',
		'tabindex' => '0',
		'hidden'   => true,
	)
);

printf( '<div %1$s>%2$s</div>', $wrapper_attrs, $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; inner-block markup, escaped by each inner block on render.
