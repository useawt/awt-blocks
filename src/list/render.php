<?php
/**
 * AWT List — server-rendered output. Inner blocks ($content) are the list items.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\classnames;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$list_type  = isset( $attributes['type'] ) ? (string) $attributes['type'] : 'unordered';
$expressive = ! empty( $attributes['isExpressive'] );
$nested     = ! empty( $attributes['nested'] );
$is_ordered = $list_type !== 'unordered';
$list_tag   = $is_ordered ? 'ol' : 'ul';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

// Derive the resolver variants for the list root.
$list_variants = array(
	'type'   => $list_type,
	'nested' => $nested,
);
if ( $expressive ) {
	$list_variants['isExpressive'] = true;
}

if ( $ds ) {
	$base_class = $ds->classes_for( 'list', $list_variants );
} else {
	// Hardcoded fallback — byte-for-byte identical to original logic.
	$base = $list_type === 'ordered-native'
		? 'cds--list--ordered--native'
		: ( $is_ordered ? 'cds--list--ordered' : 'cds--list--unordered' );

	// Carbon's nested modifier is the literal `cds--list--nested` class — not a
	// modifier of the base unordered/ordered class. The classnames helper would
	// produce `cds--list--unordered--nested`, which Carbon's CSS selectors don't
	// match, so the nested bullet/marker styling silently fails on the front-end
	// (the editor uses its own classes and looks correct, masking the bug).
	// Build the modifier list without `nested` and append the literal class.
	$modifiers  = array( $expressive ? 'expressive' : '' );
	$modifiers  = array_values( array_filter( $modifiers, static fn( $m ) => $m !== '' ) );
	$base_class = classnames( $base, $modifiers );
	if ( $nested ) {
		$base_class .= ' cds--list--nested';
	}
}

$class         = classnames( $base_class, array(), (string) ( $attributes['className'] ?? '' ) );
$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $class ) );

printf( '<%1$s %2$s>%3$s</%1$s>', esc_html( $list_tag ), $wrapper_attrs, $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; inner-block markup, escaped by each inner block on render.
