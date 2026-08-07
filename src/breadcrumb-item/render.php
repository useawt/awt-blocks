<?php
/**
 * AWT Breadcrumb item.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$text            = isset( $attributes['text'] ) ? (string) $attributes['text'] : __( 'Item', 'awt' );
$href            = isset( $attributes['href'] ) ? (string) $attributes['href'] : '';
$is_current_page = ! empty( $attributes['isCurrentPage'] );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$item_class = $ds ? $ds->classes_for( 'breadcrumb', array( 'element' => 'item' ) ) : 'cds--breadcrumb-item';
$link_class = $ds ? $ds->classes_for( 'breadcrumb', array( 'element' => 'link' ) ) : 'cds--link';

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $item_class ) );

if ( $is_current_page || $href === '' ) {
	$inner_attrs = html_attrs( array( 'aria-current' => $is_current_page ? 'page' : null ) );
	printf(
		'<li %1$s><span%2$s>%3$s</span></li>',
		$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
		$inner_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value.
		wp_kses_post( $text )
	);
	return;
}

$inner_attrs = html_attrs( array( 'href' => $href ) );
printf(
	'<li %1$s><a class="%2$s"%3$s>%4$s</a></li>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $link_class ),
	$inner_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value.
	wp_kses_post( $text )
);
