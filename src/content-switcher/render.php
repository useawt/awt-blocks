<?php
/**
 * AWT Content switcher — server-rendered output.
 *
 * Holds two kinds of inner block that pair by ordinal: awt/content-switcher-item
 * (the segment buttons) and awt/content-switcher-panel (the content). We walk
 * $block->inner_blocks twice — segments into the `.cds--content-switcher`
 * tablist, panels after it — so authors can write children interleaved or
 * grouped. The view store wires aria-controls / aria-labelledby + activates the
 * first segment at boot (matching the tabs pattern).
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$size       = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$aria_label = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : __( 'View switcher', 'awt' );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

// `cds--layout--size-{size}` supplies the `--cds-layout-size-height` CSS
// variable Carbon uses for `.cds--content-switcher` height. The
// `--content-switcher--{size}` modifier alone doesn't set it.
$layout_size = in_array( $size, array( 'sm', 'md', 'lg' ), true ) ? ' cds--layout--size-' . $size : '';

$cs_root_class = $ds
	? $ds->classes_for( 'content-switcher', array( 'size' => $size ) ) . $layout_size
	: 'cds--content-switcher cds--content-switcher--' . $size . $layout_size;

$segments_html = '';
$panels_html   = '';

if ( isset( $block ) && $block instanceof \WP_Block && ! empty( $block->inner_blocks ) ) {
	foreach ( $block->inner_blocks as $inner ) {
		if ( ! $inner instanceof \WP_Block ) {
			continue;
		}
		if ( $inner->name === 'awt/content-switcher-item' ) {
			$segments_html .= $inner->render();
		} elseif ( $inner->name === 'awt/content-switcher-panel' ) {
			$panels_html .= $inner->render();
		}
	}
}

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => 'awt-content-switcher',
		'data-wp-interactive' => 'awt/content-switcher',
		'data-wp-init'        => 'callbacks.init',
	)
);

// The `.cds--content-switcher` element is the segmented control itself (it
// carries Carbon's group outline). The panels are siblings of it, inside the
// AWT-native wrapper.
printf(
	'<div %1$s><div class="%2$s" role="tablist" aria-label="%3$s">%4$s</div>%5$s</div>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $cs_root_class ),
	esc_attr( $aria_label ),
	$segments_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup rendered via WP_Block::render(); each block escapes its own output.
	$panels_html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup rendered via WP_Block::render(); each block escapes its own output.
);
