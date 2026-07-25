<?php
/**
 * AWT Toggletip — server-rendered output.
 *
 * Renders the Carbon "click-not-hover tooltip" pattern mirroring Carbon's
 * reference DOM: an optional inline label, then a popover container
 * (`cds--popover-container … cds--toggletip`) holding the info button and the
 * popover (`cds--popover > cds--popover-content > cds--toggletip-content`,
 * caret as a sibling). Carbon's popover CSS positions the popover from the
 * `cds--popover--<align>` class — no JS positioning. View-side Interactivity
 * store toggles the open classes and wires dismissal via
 * installOutsideDismiss (click-outside, Escape, Tab-out).
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\unique_id;

$label       = isset( $attributes['label'] ) ? (string) $attributes['label'] : '';
$description = isset( $attributes['description'] ) ? (string) $attributes['description'] : '';
$aria_label  = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : __( 'More information', 'awt' );
$align       = isset( $attributes['align'] ) ? (string) $attributes['align'] : 'bottom';

$allowed_aligns = array( 'top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'right' );
if ( ! in_array( $align, $allowed_aligns, true ) ) {
	$align = 'bottom';
}

$popover_id = unique_id( 'awt-toggletip' );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$container_class = $ds ? $ds->classes_for( 'toggletip', array( 'align' => $align ) ) : 'cds--popover-container cds--popover--caret cds--popover--high-contrast cds--popover--' . $align . ' cds--toggletip';
$label_class     = $ds ? $ds->classes_for( 'toggletip', array( 'element' => 'label' ) ) : 'cds--toggletip-label';
$button_class    = $ds ? $ds->classes_for( 'toggletip', array( 'element' => 'button' ) ) : 'cds--toggletip-button';
$popover_class   = $ds ? $ds->classes_for( 'toggletip', array( 'element' => 'popover' ) ) : 'cds--popover';
$content_class   = $ds ? $ds->classes_for( 'toggletip', array( 'element' => 'popover-content' ) ) : 'cds--popover-content';
$body_class      = $ds ? $ds->classes_for( 'toggletip', array( 'element' => 'content' ) ) : 'cds--toggletip-content';
$caret_class     = $ds ? $ds->classes_for( 'toggletip', array( 'element' => 'caret' ) ) : 'cds--popover-caret';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'data-wp-interactive' => 'awt/toggletip',
	)
);

$label_html = $label !== ''
	? sprintf( '<span class="%s">%s</span>', esc_attr( $label_class ), wp_kses_post( $label ) )
	: '';

// Information icon SVG, inline — matches Carbon's `information` 16px icon.
$info_icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">'
	. '<path d="M8.5 11V6.5h-2v1h1V11H6v1h4v-1zM8 3.5A.75.75 0 108.75 4.25.75.75 0 008 3.5z"/>'
	. '<path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0-13a6 6 0 100 12A6 6 0 008 2z"/>'
	. '</svg>';

printf(
	'<span %1$s>'
	. '%2$s'
	. '<span class="%7$s">'
	. '<button type="button" class="%8$s" aria-label="%3$s" aria-controls="%4$s" aria-expanded="false" data-wp-on--click="actions.toggle">%5$s</button>'
	. '<span id="%4$s" class="%9$s">'
	. '<span class="%10$s"><div class="%11$s"><p>%6$s</p></div></span>'
	. '<span class="%12$s"></span>'
	. '</span>'
	. '</span>'
	. '</span>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$label_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	esc_attr( $aria_label ),
	esc_attr( $popover_id ),
	$info_icon, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above.
	wp_kses_post( $description ),
	esc_attr( $container_class ),
	esc_attr( $button_class ),
	esc_attr( $popover_class ),
	esc_attr( $content_class ),
	esc_attr( $body_class ),
	esc_attr( $caret_class )
);
