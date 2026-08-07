<?php
/**
 * AWT Header menu (multi-level) — server-rendered output.
 *
 * Carbon's HeaderMenu pattern: a top-level nav item whose label is a
 * disclosure that opens a submenu of links. Mirrors Carbon's structure
 * exactly so the bundled Carbon CSS handles the dropdown reveal for free:
 *
 *   <li class="cds--header__submenu">
 *     <a class="cds--header__menu-item cds--header__menu-title"
 *        aria-haspopup="menu" aria-expanded="false"> Label <svg arrow/> </a>
 *     <ul class="cds--header__menu"> … inner items … </ul>
 *   </li>
 *
 * Carbon reveals the submenu via the adjacency rule
 * `.cds--header__menu-title[aria-expanded="true"] + .cds--header__menu`,
 * so all we do at runtime is flip `aria-expanded` (Interactivity API,
 * store `awt/header-nav` provided by the parent awt/header-nav block).
 * On mobile the parent's drawer CSS turns this into an inline accordion.
 *
 * @var array  $attributes
 * @var string $content    Inner blocks markup (awt/header-nav-item list).
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$text = isset( $attributes['text'] ) && $attributes['text'] !== ''
	? (string) $attributes['text']
	: __( 'Menu', 'awt' );
$aria = isset( $attributes['ariaLabel'] ) && $attributes['ariaLabel'] !== ''
	? (string) $attributes['ariaLabel']
	: $text;

// §A: CSS classes from the active design system (guarded for non-AWT themes).
// Shares the 'header-nav' component slug with the rest of the nav blocks.
$ds            = function_exists( '\\AWT\\Theme\\DesignSystem\\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;
$submenu_class = $ds ? $ds->classes_for( 'header-nav', array( 'element' => 'submenu' ) ) : 'cds--header__submenu';
$title_class   = $ds ? $ds->classes_for( 'header-nav', array( 'element' => 'menu-title' ) ) : 'cds--header__menu-item cds--header__menu-title';
$menu_class    = $ds ? $ds->classes_for( 'header-nav', array( 'element' => 'menu' ) ) : 'cds--header__menu';
$arrow_class   = $ds ? $ds->classes_for( 'header-nav', array( 'element' => 'menu-arrow' ) ) : 'cds--header__menu-arrow';

// Carbon's chevron glyph (16×16), matching its compiled HeaderMenu output.
$arrow_svg = sprintf(
	'<svg class="%s" focusable="false" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M8 11 3 6 3.7 5.3 8 9.6 12.3 5.3 13 6z"></path></svg>',
	esc_attr( $arrow_class )
);

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'                      => $submenu_class,
		// Per-submenu Interactivity context: its own open/closed state, so
		// multiple menus in one nav open independently.
		'data-wp-context'            => '{"submenuOpen":false}',
		// Close this submenu when focus/clicks land outside it, and on Escape.
		'data-wp-on-window--click'   => 'actions.onSubmenuOutside',
		'data-wp-on-window--keydown' => 'actions.onSubmenuWindowKey',
		// Close the desktop dropdown when keyboard focus leaves the submenu
		// (e.g. Tab off the last item, Shift+Tab off the title) — Carbon parity.
		'data-wp-on--focusout'       => 'actions.onSubmenuFocusOut',
	)
);

printf(
	'<li %1$s>'
		. '<a class="%2$s" role="button" tabindex="0" aria-haspopup="menu" aria-expanded="false"'
		. ' data-wp-bind--aria-expanded="context.submenuOpen"'
		. ' data-wp-on--click="actions.toggleSubmenu"'
		. ' data-wp-on--keydown="actions.onSubmenuKey">%3$s%4$s</a>'
		. '<ul class="%5$s" aria-label="%6$s">%7$s</ul>'
	. '</li>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $title_class ),
	wp_kses_post( $text ),
	$arrow_svg, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above.
	esc_attr( $menu_class ),
	esc_attr( $aria ),
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
