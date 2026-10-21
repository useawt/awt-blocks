<?php
/**
 * AWT Content switcher — server-rendered output.
 *
 * Holds two kinds of inner block that pair by ordinal: awt/content-switcher-item
 * (the segment buttons) and awt/content-switcher-panel (the content). We walk
 * $block->inner_blocks twice — segments into the `.cds--content-switcher`
 * tablist, panels after it — so authors can write children interleaved or
 * grouped.
 *
 * Selection and ARIA wiring are done here, on the server, as the Tabs block
 * does: the first segment that is not disabled renders selected and in the
 * Tab order, its panel renders visible, and each segment/panel pair is linked
 * with aria-controls + aria-labelledby. view.js repeats the same wiring on
 * boot and takes over from there. Carbon's ContentSwitcher also renders its
 * first segment selected from the start. This used to be left to view.js, so
 * with no JavaScript every segment was unselected and out of the Tab order
 * and every panel hidden (outside accessibility review, 2026-10-21).
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
$aria_label = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : __( 'View switcher', 'awt-blocks' );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

// `cds--layout--size-{size}` supplies the `--cds-layout-size-height` CSS
// variable Carbon uses for `.cds--content-switcher` height. The
// `--content-switcher--{size}` modifier alone doesn't set it.
$layout_size = in_array( $size, array( 'sm', 'md', 'lg' ), true ) ? ' cds--layout--size-' . $size : '';

$cs_root_class = $ds
	? $ds->classes_for( 'content-switcher', array( 'size' => $size ) ) . $layout_size
	: 'cds--content-switcher cds--content-switcher--' . $size . $layout_size;

$btn_class          = $ds ? $ds->classes_for( 'content-switcher', array( 'element' => 'btn' ) ) : 'cds--content-switcher-btn';
$btn_selected_class = $ds ? $ds->classes_for( 'content-switcher', array( 'element' => 'btn-selected' ) ) : 'cds--content-switcher-btn cds--content-switcher--selected';

$segment_blocks = array();
$panel_blocks   = array();

if ( isset( $block ) && $block instanceof \WP_Block && ! empty( $block->inner_blocks ) ) {
	foreach ( $block->inner_blocks as $inner ) {
		if ( ! $inner instanceof \WP_Block ) {
			continue;
		}
		if ( $inner->name === 'awt/content-switcher-item' ) {
			$segment_blocks[] = array(
				'html'     => $inner->render(),
				'disabled' => ! empty( $inner->attributes['disabled'] ),
			);
		} elseif ( $inner->name === 'awt/content-switcher-panel' ) {
			$panel_blocks[] = $inner->render();
		}
	}
}

// The first segment that can be used, the same one view.js picks.
$selected = 0;
foreach ( $segment_blocks as $index => $segment_block ) {
	if ( ! $segment_block['disabled'] ) {
		$selected = $index;
		break;
	}
}

/**
 * First `id` attribute in a rendered fragment — the segment's or the panel's own.
 */
$first_id = static function ( string $html ): string {
	return preg_match( '/\sid="([^"]+)"/', $html, $m ) ? $m[1] : '';
};

$segments_html = '';
$panels_html   = '';

foreach ( $segment_blocks as $index => $segment_block ) {
	$html     = $segment_block['html'];
	$panel_id = isset( $panel_blocks[ $index ] ) ? $first_id( $panel_blocks[ $index ] ) : '';

	if ( '' !== $panel_id ) {
		$html = (string) preg_replace( '/^(<button\b)/', '$1 aria-controls="' . esc_attr( $panel_id ) . '"', $html, 1 );
	}

	if ( $index === $selected ) {
		$html = (string) preg_replace( '/aria-selected="false"/', 'aria-selected="true"', $html, 1 );
		$html = (string) preg_replace( '/tabindex="-1"/', 'tabindex="0"', $html, 1 );
		$html = (string) preg_replace(
			'/class="' . preg_quote( esc_attr( $btn_class ), '/' ) . '"/',
			'class="' . esc_attr( $btn_selected_class ) . '"',
			$html,
			1
		);
	}

	$segments_html .= $html;
}

foreach ( $panel_blocks as $index => $html ) {
	$segment_id = isset( $segment_blocks[ $index ] ) ? $first_id( $segment_blocks[ $index ]['html'] ) : '';

	if ( '' !== $segment_id ) {
		$html = (string) preg_replace( '/^(<div\b)/', '$1 aria-labelledby="' . esc_attr( $segment_id ) . '"', $html, 1 );
	}

	if ( $index === $selected ) {
		// Only the open panel loses `hidden`.
		$html = (string) preg_replace( '/\s+hidden="hidden"/', '', $html, 1 );
	}

	$panels_html .= $html;
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
