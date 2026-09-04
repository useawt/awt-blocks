<?php
/**
 * AWT Tabs — server-rendered output.
 *
 * Inner blocks come in two kinds (awt/tab + awt/tab-panel) that pair by
 * ordinal. We walk $block->inner_blocks twice — once for tabs (into the
 * tablist), once for panels — so authors can write the children in either
 * interleaved or grouped order.
 *
 * Selection and ARIA wiring are done here, on the server: the first tab that
 * is not disabled renders selected, its panel renders visible, and each
 * tab/panel pair is linked with aria-controls + aria-labelledby. view.js
 * repeats the same wiring on boot and takes over from there.
 *
 * This used to be left entirely to view.js, which meant every tab rendered
 * `aria-selected="false"` and every panel rendered `hidden` — so with no
 * JavaScript the block showed a row of buttons and none of its content.
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
$aria_label  = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : __( 'Tabs', 'awt-blocks' );

// The tab buttons are rendered by awt/tab, but which one is selected is only
// knowable here, so the selected class is swapped in below.
$nav_link_class          = $ds ? $ds->classes_for( 'tabs', array( 'element' => 'nav-link' ) ) : 'cds--tabs__nav-link';
$nav_link_selected_class = $ds
	? $ds->classes_for(
		'tabs',
		array(
			'element'  => 'nav-link',
			'selected' => true,
		)
	)
	: 'cds--tabs__nav-link cds--tabs__nav-item--selected';

$tab_blocks   = array();
$panel_blocks = array();

if ( isset( $block ) && $block instanceof \WP_Block && ! empty( $block->inner_blocks ) ) {
	foreach ( $block->inner_blocks as $inner ) {
		if ( ! $inner instanceof \WP_Block ) {
			continue;
		}
		if ( $inner->name === 'awt/tab' ) {
			$tab_blocks[] = array(
				'html'     => $inner->render(),
				'disabled' => ! empty( $inner->attributes['disabled'] ),
			);
		} elseif ( $inner->name === 'awt/tab-panel' ) {
			$panel_blocks[] = array( 'html' => $inner->render() );
		}
	}
}

// The first tab that can actually be used. A disabled tab must not be the
// one that opens, and view.js picks the same one.
$selected = 0;
foreach ( $tab_blocks as $index => $tab_block ) {
	if ( ! $tab_block['disabled'] ) {
		$selected = $index;
		break;
	}
}

/**
 * First `id` attribute in a rendered fragment — the tab's or the panel's own.
 */
$first_id = static function ( string $html ): string {
	return preg_match( '/\bid="([^"]+)"/', $html, $m ) ? $m[1] : '';
};

/**
 * Add an attribute to a fragment's first tag.
 */
$add_attr = static function ( string $html, string $name, string $value ): string {
	if ( '' === $value ) {
		return $html;
	}
	return (string) preg_replace(
		'/^(<[a-z0-9-]+)/i',
		'$1 ' . $name . '="' . esc_attr( $value ) . '"',
		$html,
		1
	);
};

$tabs_html   = '';
$panels_html = '';

foreach ( $tab_blocks as $index => $tab_block ) {
	$html     = $tab_block['html'];
	$panel_id = isset( $panel_blocks[ $index ] ) ? $first_id( $panel_blocks[ $index ]['html'] ) : '';

	// The button carries the ARIA, not the presentational <li> around it.
	if ( '' !== $panel_id ) {
		$html = (string) preg_replace(
			'/(<button\b)/',
			'$1 aria-controls="' . esc_attr( $panel_id ) . '"',
			$html,
			1
		);
	}

	if ( $index === $selected ) {
		$html = (string) preg_replace( '/aria-selected="false"/', 'aria-selected="true"', $html, 1 );
		$html = (string) preg_replace( '/tabindex="-1"/', 'tabindex="0"', $html, 1 );
		$html = str_replace(
			'class="' . esc_attr( $nav_link_class ) . '"',
			'class="' . esc_attr( $nav_link_selected_class ) . '"',
			$html
		);
	}

	$tabs_html .= $html;
}

foreach ( $panel_blocks as $index => $panel_block ) {
	$html   = $panel_block['html'];
	$tab_id = isset( $tab_blocks[ $index ] ) ? $first_id( $tab_blocks[ $index ]['html'] ) : '';

	$html = $add_attr( $html, 'aria-labelledby', $tab_id );

	if ( $index === $selected ) {
		// Only the open panel loses `hidden`.
		$html = (string) preg_replace( '/\s+hidden="hidden"/', '', $html, 1 );
	}

	$panels_html .= $html;
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
		esc_attr__( 'Scroll tabs left', 'awt-blocks' ),
		icon( 'chevron--left', 16 ),
		$tab_list_html,
		esc_attr__( 'Scroll tabs right', 'awt-blocks' ),
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
