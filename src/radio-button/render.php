<?php
/**
 * AWT Radio button — single option inside a radio-button-group.
 *
 * Reads the shared `name` from a global the parent group sets during render.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\unique_id;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$label    = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Option', 'awt-blocks' );
$value    = isset( $attributes['value'] ) ? (string) $attributes['value'] : '';
$checked  = ! empty( $attributes['checked'] );
$disabled = ! empty( $attributes['disabled'] );

$group_name     = isset( $block->context['awt/radioGroupName'] ) ? (string) $block->context['awt/radioGroupName'] : '';
$group_required = ! empty( $block->context['awt/radioGroupRequired'] );

$input_id = unique_id( 'awt-radio' );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$rb_wrapper_class    = $ds ? $ds->classes_for( 'radio', array( 'element' => 'button-wrapper' ) ) : 'cds--radio-button-wrapper';
$rb_input_class      = $ds ? $ds->classes_for( 'radio', array( 'element' => 'button-input' ) ) : 'cds--radio-button';
$rb_label_class      = $ds ? $ds->classes_for( 'radio', array( 'element' => 'button-label' ) ) : 'cds--radio-button__label';
$rb_appearance_class = $ds ? $ds->classes_for( 'radio', array( 'element' => 'button-appearance' ) ) : 'cds--radio-button__appearance';
$rb_label_text_class = $ds ? $ds->classes_for( 'radio', array( 'element' => 'button-label-text' ) ) : 'cds--radio-button__label-text';

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $rb_wrapper_class ) );

$input_attrs = html_attrs(
	array(
		'type'     => 'radio',
		'id'       => $input_id,
		'class'    => $rb_input_class,
		'name'     => $group_name,
		'value'    => $value,
		'checked'  => $checked,
		'disabled' => $disabled,
		'required' => $group_required,
	)
);

$html  = '<div ' . $wrapper_attrs . '>';
$html .= '<input' . $input_attrs . ' />';
$html .= '<label for="' . esc_attr( $input_id ) . '" class="' . esc_attr( $rb_label_class ) . '">';
$html .= '<span class="' . esc_attr( $rb_appearance_class ) . '"></span>';
$html .= '<span class="' . esc_attr( $rb_label_text_class ) . '">' . wp_kses_post( $label ) . '</span>';
$html .= '</label>';
$html .= '</div>';

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
