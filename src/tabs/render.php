<?php
/**
 * AWT Tabs — server-rendered output.
 *
 * Inner blocks come in two kinds (awt/tab + awt/tab-panel) that pair by
 * ordinal. We walk $block->inner_blocks twice — once for tabs (into the
 * tablist), once for panels — so authors can write the children in either
 * interleaved or grouped order.
 *
 * Per-instance ARIA wiring (aria-controls + aria-labelledby) is finished in
 * view.js's init callback, which knows the live DOM order at boot.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\icon;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$orientation = isset( $attributes['orientation'] ) ? (string) $attributes['orientation'] : 'horizontal';
$aria_label  = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : __( 'Tabs', 'awt' );

$tabs_html   = '';
$panels_html = '';

if ( isset( $block ) && $block instanceof \WP_Block && ! empty( $block->inner_blocks ) ) {
	foreach ( $block->inner_blocks as $inner ) {
		if ( ! $inner instanceof \WP_Block ) {
			continue;
		}
		if ( $inner->name === 'awt/tab' ) {
			$tabs_html .= $inner->render();
		} elseif ( $inner->name === 'awt/tab-panel' ) {
			$panels_html .= $inner->render();
		}
	}
}

$tabs_root_class = $ds
	? $ds->classes_for( 'tabs', array( 'orientation' => $orientation ) )
	: ( 'cds--tabs cds--tabs--' . $orientation );

$tab_list_class      = $ds ? $ds->classes_for( 'tabs', array( 'element' => 'tab-list' ) ) : 'cds--tab--list';
$overflow_btn_class  = $ds ? $ds->classes_for( 'tabs', array( 'element' => 'overflow-btn' ) ) : 'cds--tab--overflow-nav-button';
$overflow_prev_class = $ds ? $ds->classes_for( 'tabs', array( 'element' => 'overflow-btn-prev' ) ) : 'cds--tab--overflow-nav-button cds--tab--overflow-nav-button--previous cds--tab--overflow-nav-button--hidden';
$overflow_next_class = $ds ? $ds->classes_for( 'tabs', array( 'element' => 'overflow-btn-next' ) ) : 'cds--tab--overflow-nav-button cds--tab--overflow-nav-button--next cds--tab--overflow-nav-button--hidden';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => $tabs_root_class,
		'data-wp-interactive' => 'awt/tabs',
		'data-wp-init'        => 'callbacks.init',
	)
);

// Carbon's modern tab-list container is `.cds--tab--list` (double-dash
// modifier on `cds--tab`). Single-dash `cds--tab-list` is a Stage 0 typo
// that doesn't match any rule in Carbon's compiled CSS — Carbon's
// horizontal layout, scroll-overflow, and item flex sizing all hang off
// the double-dash name, so the wrong class meant Carbon delivered zero
// styling for the tablist and our items shrunk to a 20px tall flat row.
//
// Mobile / overflow behavior (horizontal orientation only):
//
// Carbon's reference wraps the <ul> in a flex row alongside two
// "overflow nav" buttons (`.cds--tab--overflow-nav-button--previous`
// and `--next`). When the list of tabs is wider than the available
// inline space, view.js shows those buttons and scrolls the <ul>
// programmatically. The list itself uses `overflow-x: auto` so users
// can also flick/swipe-scroll. We mirror that structure: a
// `.awt-tabs__strip` flex wrapper around the <ul> with the two
// chevron buttons. Buttons start with `--hidden` (Carbon's `display:
// none` modifier); view.js toggles it based on scroll position.
//
// Vertical tabs don't need this — the tab list is a fixed-width
// sidebar that wraps via flex-direction:column, so overflow falls to
// vertical scrolling of the surrounding page. We skip the strip
// wrapper for vertical and keep the simpler structure that the
// `.cds--tabs--vertical > .cds--tab--list` grid CSS depends on.
$tab_list_html = sprintf(
	'<ul class="%4$s" role="tablist" aria-label="%1$s" aria-orientation="%2$s">%3$s</ul>',
	esc_attr( $aria_label ),
	esc_attr( $orientation ),
	$tabs_html,
	esc_attr( $tab_list_class )
);

if ( $orientation === 'horizontal' ) {
	$tab_strip_html = sprintf(
		'<div class="awt-tabs__strip">' .
		'<button type="button" class="%6$s" aria-label="%1$s" tabindex="-1" data-wp-on--click="actions.scrollPrev">%2$s</button>' .
		'%3$s' .
		'<button type="button" class="%7$s" aria-label="%4$s" tabindex="-1" data-wp-on--click="actions.scrollNext">%5$s</button>' .
		'</div>',
		esc_attr__( 'Scroll tabs left', 'awt' ),
		icon( 'chevron--left', 16 ),
		$tab_list_html,
		esc_attr__( 'Scroll tabs right', 'awt' ),
		icon( 'chevron--right', 16 ),
		esc_attr( $overflow_prev_class ),
		esc_attr( $overflow_next_class )
	);
} else {
	$tab_strip_html = $tab_list_html;
}

printf(
	'<div %1$s>%2$s%3$s</div>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$tab_strip_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$panels_html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup rendered via WP_Block::render(); each block escapes its own output.
);
