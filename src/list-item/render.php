<?php
/**
 * AWT List item.
 *
 * Renders the item's `content` (text) followed by inner blocks ($content). A
 * nested awt/list is the only block type allowed as an inner block; it
 * renders directly inside the <li>, matching the native HTML pattern for
 * nested lists.
 *
 * @var array  $attributes
 * @var string $content    Inner-block render output (nested awt/list, if any).
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$item_content = isset( $attributes['content'] ) ? (string) $attributes['content'] : '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$item_class    = $ds ? $ds->classes_for( 'list', array( 'element' => 'item' ) ) : 'cds--list__item';
$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $item_class ) );

printf(
	'<li %1$s>%2$s%3$s</li>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	wp_kses_post( $item_content ),
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
