<?php
/**
 * AWT Side nav section — server-rendered output.
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\unique_id;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$section_title = isset( $attributes['title'] ) ? (string) $attributes['title'] : '';

// `defaultExpanded` is no longer read. It produced
// `cds--side-nav__section--expanded`, a class no stylesheet defines — not
// Carbon's and not ours — so both positions rendered the same thing, and the
// toggle offering it has been removed from the inspector. A section is a static
// group; there is nothing to expand. The attribute stays registered in
// block.json so content saved by an older version still round-trips.
$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$section_class = $ds
	? $ds->classes_for( 'side-nav', array( 'element' => 'section' ) )
	: 'cds--side-nav__section';

$heading_class = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'heading' ) ) : 'cds--side-nav__heading';
$menu_class    = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'menu' ) ) : 'cds--side-nav__menu';

$wrapper_attrs = get_block_wrapper_attributes(
	array( 'class' => $section_class )
);

// The section title is a static div, not Carbon's `__submenu` toggle button, so
// nothing associates it with the list it heads. Name the list after the title
// (aria-labelledby) so the grouping a sighted user sees is also conveyed to
// assistive technology (WCAG 1.3.1). Untitled sections get no id and no
// reference — there is nothing to name the list with.
$heading_id = $section_title !== '' ? unique_id( 'awt-side-nav-section' ) : '';

$heading = $section_title !== ''
	? sprintf(
		'<div class="%s" id="%s">%s</div>',
		esc_attr( $heading_class ),
		esc_attr( $heading_id ),
		wp_kses_post( $section_title )
	)
	: '';

$menu_attrs = html_attrs(
	array(
		'class'           => $menu_class,
		'aria-labelledby' => $heading_id,
	)
);

printf(
	'<li %1$s>%2$s<ul%3$s>%4$s</ul></li>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$heading, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$menu_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- html_attrs() esc_attr()s every name and value.
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
