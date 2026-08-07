<?php
/**
 * AWT Footer link — server-rendered output.
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

$text     = isset( $attributes['text'] ) ? (string) $attributes['text'] : __( 'Link', 'awt' );
$href     = isset( $attributes['href'] ) ? (string) $attributes['href'] : '#';
$external = ! empty( $attributes['external'] );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$footer_link_class = $ds ? $ds->classes_for( 'footer', array( 'element' => 'link' ) ) : 'cds--footer__link';
$anchor_class      = $ds ? $ds->classes_for( 'footer', array( 'element' => 'anchor' ) ) : 'cds--link';

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $footer_link_class ) );

$attrs = '';
if ( $external ) {
	$attrs = ' target="_blank" rel="noopener noreferrer"';
}

$external_icon = $external ? icon( 'launch' ) : '';

printf(
	'<li %1$s><a class="%2$s" href="%3$s"%4$s>%5$s%6$s</a></li>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $anchor_class ),
	esc_url( $href ),
	$attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value.
	wp_kses_post( $text ),
	$external_icon // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above.
);
