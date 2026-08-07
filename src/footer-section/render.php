<?php
/**
 * AWT Footer section — server-rendered output.
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$section_title = isset( $attributes['title'] ) ? (string) $attributes['title'] : '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$section_class = $ds ? $ds->classes_for( 'footer', array( 'element' => 'section' ) ) : 'cds--footer__section';
$heading_class = $ds ? $ds->classes_for( 'footer', array( 'element' => 'heading' ) ) : 'cds--footer__heading';
$links_class   = $ds ? $ds->classes_for( 'footer', array( 'element' => 'links' ) ) : 'cds--footer__links';

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $section_class ) );

$heading = $section_title !== ''
	? sprintf( '<h2 class="%s">%s</h2>', esc_attr( $heading_class ), wp_kses_post( $section_title ) )
	: '';

printf(
	'<div %1$s>%2$s<ul class="%3$s">%4$s</ul></div>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$heading, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	esc_attr( $links_class ),
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
