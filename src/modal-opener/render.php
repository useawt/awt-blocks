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

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$root_class = $ds ? $ds->classes_for(
	'modal',
	array(
		'element' => 'opener',
		'kind'    => $kind,
		'size'    => $size,
	)
) : 'cds--btn cds--btn--' . $kind . ' cds--btn--' . $size;

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
