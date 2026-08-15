<?php
/**
 * AWT Header nav item — server-rendered output.
 *
 * Computes aria-current="page" via the shared current-URL matcher
 * (spec §1 "Current-URL matching"). Explicit isCurrent attribute overrides.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\CurrentUrl\matches_current;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$text       = isset( $attributes['text'] ) ? (string) $attributes['text'] : __( 'Item', 'awt-blocks' );
$href       = isset( $attributes['href'] ) ? (string) $attributes['href'] : '#';
$is_current = ! empty( $attributes['isCurrent'] );
$match_mode = isset( $attributes['matchMode'] ) ? (string) $attributes['matchMode'] : 'exact';

$aria_current = ( $is_current || matches_current( $href, $match_mode ) ) ? 'page' : null;

// Carbon's CSS expects the `header__menu-item` class on the anchor, NOT on
// the list item. That class carries the 3rem block-size, the flex layout,
// the padding that spaces items apart, the text color, and the hover and
// focus states — every visual the nav item has. Putting it on the list item
// left the link with zero padding and no flex display, so items rendered
// like "HomeDocsAbout" with no spacing between them. The invented
// `cds--header__menu-item-link` class doesn't exist in Carbon's
// stylesheet at all.
//
// The list item keeps just the "none" role (which most browsers already
// imply for a list item here) — Carbon puts its submenu class on the list
// item only when there is a submenu, not for plain items.
$wrapper_attrs = get_block_wrapper_attributes();

$current_attr = $aria_current ? sprintf( ' aria-current="%s"', esc_attr( $aria_current ) ) : '';

// §A: the <a> link class comes from the active design system (shares the
// 'header-nav' component slug with awt/header-nav). Guarded for non-AWT themes.
$ds         = function_exists( '\\AWT\\Theme\\DesignSystem\\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;
$link_class = $ds ? $ds->classes_for( 'header-nav', array( 'element' => 'menu-item' ) ) : 'cds--header__menu-item';

printf(
	'<li %1$s><a class="%2$s" href="%3$s"%4$s>%5$s</a></li>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $link_class ),
	esc_url( $href ),
	$current_attr, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built with esc_attr() above.
	wp_kses_post( $text )
);
