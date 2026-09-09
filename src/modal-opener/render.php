<?php
/**
 * AWT Modal opener — server-rendered output.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$text     = isset( $attributes['text'] ) ? (string) $attributes['text'] : __( 'Open modal', 'awt-blocks' );
$kind     = isset( $attributes['kind'] ) ? (string) $attributes['kind'] : 'primary';
$size     = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$modal_id = isset( $attributes['modalId'] ) ? (string) $attributes['modalId'] : 'awt-modal';

// Carbon's button height comes from the `--cds-layout-size-height` variable,
// which only `cds--layout--size-{size}` sets — `cds--btn--{size}` does not.
// Without it the button sits at Carbon's `lg` default whatever size is chosen,
// which is what the Size control did here until 2026-09-09. Same reasoning as
// `button/render.php`.
$layout_size_class = in_array( $size, array( 'xs', 'sm', 'md', 'lg', 'xl', '2xl' ), true )
	? ' cds--layout--size-' . $size
	: '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$root_class = $ds ? $ds->classes_for(
	'modal',
	array(
		'element' => 'opener',
		'kind'    => $kind,
		'size'    => $size,
	)
) : 'cds--btn cds--btn--' . $kind . ' cds--btn--' . $size . $layout_size_class;

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => $root_class,
		'type'                => 'button',
		'aria-haspopup'       => 'dialog',
		'aria-controls'       => $modal_id,
		'data-modal-id'       => $modal_id,
		'data-wp-interactive' => 'awt/modal-opener',
		'data-wp-on--click'   => 'actions.open',
	)
);

printf( '<button %1$s><span>%2$s</span></button>', $wrapper_attrs, wp_kses_post( $text ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
