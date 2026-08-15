<?php
/**
 * AWT Accordion item — server-rendered output.
 *
 * Renders a Carbon accordion item with an aria-expanded heading button + a
 * content panel. The view-side Interactivity store handles toggle + sibling
 * coordination (singleOpen context from the parent accordion).
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\unique_id;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$accordion_title  = isset( $attributes['title'] ) ? (string) $attributes['title'] : __( 'Section', 'awt-blocks' );
$default_expanded = ! empty( $attributes['defaultExpanded'] );
$disabled         = ! empty( $attributes['disabled'] );

$panel_id  = unique_id( 'awt-accordion-panel' );
$button_id = unique_id( 'awt-accordion-button' );

$item_class = $ds
	? $ds->classes_for(
		'accordion',
		array(
			'element'         => 'item',
			'defaultExpanded' => $default_expanded,
			'disabled'        => $disabled,
		)
	)
	: ( 'cds--accordion__item'
		. ( $default_expanded ? ' cds--accordion__item--active' : '' )
		. ( $disabled ? ' cds--accordion__item--disabled' : '' ) );

$heading_class = $ds ? $ds->classes_for( 'accordion', array( 'element' => 'heading' ) ) : 'cds--accordion__heading';
$title_class   = $ds ? $ds->classes_for( 'accordion', array( 'element' => 'title' ) ) : 'cds--accordion__title';
$content_class = $ds ? $ds->classes_for( 'accordion', array( 'element' => 'content' ) ) : 'cds--accordion__content';
$arrow_class   = $ds ? $ds->classes_for( 'accordion', array( 'element' => 'arrow' ) ) : 'cds--accordion__arrow';

$wrapper_attrs = get_block_wrapper_attributes(
	array( 'class' => $item_class )
);

$disabled_attr = $disabled ? ' disabled' : '';

// Carbon's `.cds--accordion__arrow` is meant to be an SVG directly so its CSS
// (fill + transform: rotate(-270deg) idle / rotate(-90deg) active) lands on
// the right element. Emit the chevron path inline rather than wrapping it in
// a span — Carbon's transform-origin is centered on the SVG box, so rotation
// pivots cleanly with no visual drift.
$arrow_svg = '<svg class="' . esc_attr( $arrow_class ) . '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" focusable="false" aria-hidden="true">'
	. '<path d="M11 8L6 13l-.7-.7L9.6 8 5.3 3.7 6 3z"/>'
	. '</svg>';

printf(
	'<li %1$s>'
	. '<button id="%2$s" type="button" class="%10$s" aria-expanded="%3$s" aria-controls="%4$s"%5$s'
	. ' data-wp-interactive="awt/accordion-item" data-wp-on--click="actions.toggle">'
	. '%6$s'
	. '<span class="%11$s">%7$s</span>'
	. '</button>'
	. '<div id="%4$s" class="%12$s" role="region" aria-labelledby="%2$s"%8$s>%9$s</div>'
	. '</li>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $button_id ),
	$default_expanded ? 'true' : 'false',
	esc_attr( $panel_id ),
	$disabled_attr, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static literal attribute string.
	$arrow_svg, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above.
	wp_kses_post( $accordion_title ),
	$default_expanded ? '' : ' hidden',
	$content, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
	esc_attr( $heading_class ),
	esc_attr( $title_class ),
	esc_attr( $content_class )
);
