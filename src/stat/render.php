<?php
/**
 * AWT Statistic — server-rendered output.
 *
 * Large statistic number paired with a label + optional description.
 * Modelled on Carbon's c4d-cta-block-item statistic styling (used on
 * ibm.com case studies). The number is a <span> — typographic emphasis —
 * and the label below it defaults to a <p>: a stat's label captions the
 * number, it doesn't head a page section, and a heading default produced
 * H2→H4 level skips wherever the block was dropped (Carbon's own
 * aria-level="4" default assumes C4D's content-block hierarchy above it,
 * which arbitrary WordPress pages don't have). Authors whose stat does
 * start a section opt into a real heading via `level` (2–6).
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$value       = isset( $attributes['value'] ) ? (string) $attributes['value'] : '';
$heading     = isset( $attributes['heading'] ) ? (string) $attributes['heading'] : '';
$description = isset( $attributes['description'] ) ? (string) $attributes['description'] : '';
$level       = isset( $attributes['level'] ) ? (string) $attributes['level'] : 'none';
$align       = isset( $attributes['align'] ) ? (string) $attributes['align'] : 'start';

// Constrain level to none | 2..6.
if ( ! in_array( $level, array( 'none', '2', '3', '4', '5', '6' ), true ) ) {
	$level = 'none';
}

// Constrain align to start | center.
if ( ! in_array( $align, array( 'start', 'center' ), true ) ) {
	$align = 'start';
}

$heading_tag = 'none' === $level ? 'p' : 'h' . $level;

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => 'awt-stat awt-stat--align-' . $align,
	)
);

$value_html       = $value !== '' ? sprintf( '<span class="awt-stat__value">%s</span>', wp_kses_post( $value ) ) : '';
$heading_html     = $heading !== '' ? sprintf( '<%1$s class="awt-stat__heading">%2$s</%1$s>', $heading_tag, wp_kses_post( $heading ) ) : '';
$description_html = $description !== '' ? sprintf( '<p class="awt-stat__description">%s</p>', wp_kses_post( $description ) ) : '';

printf(
	'<div %1$s>%2$s%3$s%4$s</div>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$value_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$heading_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$description_html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
);
