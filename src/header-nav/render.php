<?php
/**
 * AWT Header navigation — server-rendered output.
 *
 * Renders Carbon's responsive header-nav grammar:
 *
 *   - A hamburger trigger (`cds--header__menu-trigger cds--header__menu-toggle`)
 *     that Carbon's bundled CSS shows below the `lg` breakpoint (66rem) and
 *     hides above it (via `cds--header__menu-toggle__hidden`). It carries BOTH
 *     a menu (hamburger) and a close (X) icon; the open one is toggled by
 *     `state.navOpen`, and the accessible name flips "Open menu" / "Close menu"
 *     (mirroring Carbon's HeaderMenuButton).
 *   - The `<nav class="cds--header__nav">` itself, which Carbon hides below
 *     66rem. On small screens the trigger flips the shared `navOpen` state,
 *     adding `.awt-nav-open` so theme.css turns the nav into a left drawer.
 *     On open, focus stays on the trigger (Carbon behavior); pressing Tab then
 *     routes into the menu (`actions.onTriggerKey`), and Tab loops between the
 *     menu's first/last item and the trigger (`actions.onMenuKey`). On close,
 *     focus returns to the trigger if it was inside (`callbacks.focusManage`).
 *
 * Focus order (WCAG 2.4.3): Carbon places the hamburger BEFORE the brand in
 * the DOM so it is reached first by keyboard on mobile. The block, however,
 * renders after the brand, so the trigger is emitted as its own Interactivity
 * island and relocated to sit right after the skip-link (before the brand) on
 * init (`callbacks.relocateTrigger`). Because it's its own region and the
 * open state lives in the shared store `state` (not element context), moving
 * the node is safe and the binding keeps working. On desktop the trigger is
 * `display:none`, so the focus order there stays brand → nav → actions.
 *
 * Children are awt/header-nav-item (plain links) and awt/header-menu
 * (multi-level submenus); both render <li>s inside the menu-bar <ul>.
 *
 * @var array  $attributes
 * @var string $content    Inner blocks markup.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\icon;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$aria_label = isset( $attributes['ariaLabel'] ) && $attributes['ariaLabel'] !== ''
	? (string) $attributes['ariaLabel']
	: __( 'Primary', 'awt-blocks' );

// §A: CSS classes from the active design system (guarded for non-AWT themes).
$ds            = function_exists( '\\AWT\\Theme\\DesignSystem\\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;
$nav_class     = $ds ? $ds->classes_for( 'header-nav' ) : 'cds--header__nav';
$menubar_class = $ds ? $ds->classes_for( 'header-nav', array( 'element' => 'menu-bar' ) ) : 'cds--header__menu-bar';
$trigger_class = $ds ? $ds->classes_for( 'header-nav', array( 'element' => 'trigger' ) ) : 'cds--header__action cds--header__menu-trigger cds--header__menu-toggle cds--header__menu-toggle__hidden';

$nav_id = wp_unique_id( 'awt-header-nav-' );

$label_open  = __( 'Open menu', 'awt-blocks' );
$label_close = __( 'Close menu', 'awt-blocks' );

$menu_icon = icon( 'menu', 20 );
if ( $menu_icon === '' ) {
	$menu_icon = '<span aria-hidden="true">&#9776;</span>'; // ☰ fallback.
}
$close_icon = icon( 'close', 20 );
if ( $close_icon === '' ) {
	$close_icon = '<span aria-hidden="true">&times;</span>'; // × fallback.
}

// Seed the store state server-side so the accessible-name swap is translated
// in PHP (the JS getter just picks open/close based on navOpen).
if ( function_exists( 'wp_interactivity_state' ) ) {
	wp_interactivity_state(
		'awt/header-nav',
		array(
			'navOpen'    => false,
			'labelOpen'  => $label_open,
			'labelClose' => $label_close,
		)
	);
}

// The hamburger trigger is its own Interactivity island (so it can be safely
// relocated before the brand on init). Open state is the shared store `state`.
// Two icons ride inside it; `hidden` is toggled so the open one shows.
$trigger_html = sprintf(
	'<button type="button" class="%1$s awt-header-nav__trigger" aria-label="%2$s" aria-controls="%3$s" aria-expanded="false"'
		. ' data-wp-interactive="awt/header-nav" data-wp-init="callbacks.relocateTrigger"'
		. ' data-wp-bind--aria-expanded="state.navOpen" data-wp-bind--aria-label="state.triggerLabel"'
		. ' data-wp-on--click="actions.toggleNav" data-wp-on--keydown="actions.onTriggerKey">'
		. '<span class="awt-header-nav__icon awt-header-nav__icon--open" data-wp-bind--hidden="state.navOpen">%4$s</span>'
		. '<span class="awt-header-nav__icon awt-header-nav__icon--close" hidden data-wp-bind--hidden="state.navClosed">%5$s</span>'
	. '</button>',
	esc_attr( $trigger_class ),
	esc_attr( $label_open ),
	esc_attr( $nav_id ),
	$menu_icon,
	$close_icon
);

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'                      => 'awt-header-nav',
		'style'                      => 'display:contents',
		'data-wp-interactive'        => 'awt/header-nav',
		'data-wp-on-window--keydown' => 'actions.onWindowKey',
	)
);

printf(
	'%1$s<div %2$s>'
		// Dimmed backdrop behind the mobile slide-in panel; tap to close.
		// Mobile-only (CSS), decorative (keyboard users close via Escape).
		. '<div class="awt-header-nav__overlay" aria-hidden="true"'
		. ' data-wp-class--awt-nav-open="state.navOpen" data-wp-on--click="actions.closeNav"></div>'
		. '<nav id="%3$s" class="%4$s" aria-label="%5$s"'
		. ' data-wp-class--awt-nav-open="state.navOpen" data-wp-watch="callbacks.focusManage"'
		. ' data-wp-on--keydown="actions.onMenuKey">'
			. '<ul class="%6$s">%7$s</ul>'
		. '</nav>'
	. '</div>',
	$trigger_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $nav_id ),
	esc_attr( $nav_class ),
	esc_attr( $aria_label ),
	esc_attr( $menubar_class ),
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
