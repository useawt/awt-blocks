<?php
/**
 * AWT Header action — server-rendered output.
 *
 * Renders as <button> by default. When href is set and panelId is empty, renders
 * as <a>. When panelId is set, wires the Interactivity API store + ARIA
 * (aria-haspopup, aria-controls, aria-expanded) per spec §1 panel triggering.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\icon;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$icon_name = isset( $attributes['iconName'] ) ? (string) $attributes['iconName'] : 'search';
$label     = isset( $attributes['label'] ) ? (string) $attributes['label'] : '';
$href      = isset( $attributes['href'] ) ? (string) $attributes['href'] : '';
$panel_id  = isset( $attributes['panelId'] ) ? (string) $attributes['panelId'] : '';
$kind      = isset( $attributes['kind'] ) ? (string) $attributes['kind'] : 'icon-only';

// §A: CSS classes from the active design system (guarded for non-AWT themes).
$ds           = function_exists( '\\AWT\\Theme\\DesignSystem\\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;
$action_class = $ds ? $ds->classes_for( 'header-action' ) : 'cds--header__action';
$icon_class   = $ds ? $ds->classes_for( 'header-action', array( 'element' => 'icon' ) ) : 'cds--header__action-icon';
$label_class  = $ds ? $ds->classes_for( 'header-action', array( 'element' => 'label' ) ) : 'cds--header__action-label';

$icon_html = icon( $icon_name );
if ( $icon_html === '' ) {
	// Render a generic placeholder for icons not in the inline registry.
	$icon_html = sprintf( '<span aria-hidden="true" class="%s">%s</span>', esc_attr( $icon_class ), esc_html( $icon_name ) );
}

$inner = $icon_html;
if ( $kind === 'with-label' && $label !== '' ) {
	$inner .= sprintf( '<span class="%s">%s</span>', esc_attr( $label_class ), esc_html( $label ) );
}

$base_attrs = array( 'class' => $action_class );

if ( $panel_id !== '' ) {
	// Toggle button — wire Interactivity API + ARIA per spec.
	$wrapper_attrs = get_block_wrapper_attributes(
		array_merge(
			$base_attrs,
			array(
				'type'                => 'button',
				'aria-label'          => $label,
				'aria-controls'       => $panel_id,
				'aria-expanded'       => 'false',
				'aria-haspopup'       => 'dialog',
				'data-wp-interactive' => 'awt/header-action',
				'data-wp-context'     => wp_json_encode( array( 'panelId' => $panel_id ) ),
				'data-wp-on--click'   => 'actions.toggle',
				'data-wp-init'        => 'callbacks.init',
			)
		)
	);
	printf( '<button %1$s>%2$s</button>', $wrapper_attrs, $inner ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; built above with all dynamic parts escaped.
	return;
}

if ( $href !== '' ) {
	$wrapper_attrs = get_block_wrapper_attributes(
		array_merge(
			$base_attrs,
			array( 'aria-label' => $label )
		)
	);
	printf( '<a %1$s href="%2$s">%3$s</a>', $wrapper_attrs, esc_url( $href ), $inner ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; built above with all dynamic parts escaped.
	return;
}

$wrapper_attrs = get_block_wrapper_attributes(
	array_merge(
		$base_attrs,
		array(
			'type'       => 'button',
			'aria-label' => $label,
		)
	)
);
printf( '<button %1$s>%2$s</button>', $wrapper_attrs, $inner ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; built above with all dynamic parts escaped.
