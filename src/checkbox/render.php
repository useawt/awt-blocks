<?php
/**
 * AWT Checkbox — server-rendered output.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\Render\describedby;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$label         = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Checkbox label', 'awt-blocks' );
$name          = isset( $attributes['name'] ) ? (string) $attributes['name'] : '';
$value         = isset( $attributes['value'] ) ? (string) $attributes['value'] : '';
$checked       = ! empty( $attributes['checked'] );
$disabled      = ! empty( $attributes['disabled'] );
$indeterminate = ! empty( $attributes['indeterminate'] );
$required      = ! empty( $attributes['required'] );
$helper_text   = isset( $attributes['helperText'] ) ? (string) $attributes['helperText'] : '';
$invalid       = ! empty( $attributes['invalid'] );
$invalid_text  = isset( $attributes['invalidText'] ) ? (string) $attributes['invalidText'] : '';

$input_id   = unique_id( 'awt-checkbox' );
$helper_id  = $helper_text !== '' ? $input_id . '-helper' : '';
$invalid_id = ( $invalid && $invalid_text !== '' ) ? $input_id . '-error' : '';

$describedby = describedby( array( $helper_id, $invalid_id ) );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$cb_root_class        = $ds ? $ds->classes_for( 'checkbox' ) : 'cds--form-item cds--checkbox-wrapper';
$cb_input_class       = $ds ? $ds->classes_for( 'checkbox', array( 'element' => 'input' ) ) : 'cds--checkbox';
$cb_label_class       = $ds ? $ds->classes_for( 'checkbox', array( 'element' => 'label' ) ) : 'cds--checkbox-label';
$cb_label_text_class  = $ds ? $ds->classes_for( 'checkbox', array( 'element' => 'label-text' ) ) : 'cds--checkbox-label-text';
$cb_helper_class      = $ds ? $ds->classes_for( 'checkbox', array( 'element' => 'helper-text' ) ) : 'cds--form__helper-text';
$cb_requirement_class = $ds ? $ds->classes_for( 'checkbox', array( 'element' => 'requirement' ) ) : 'cds--form-requirement';

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $cb_root_class ) );

$input_attrs = html_attrs(
	array(
		'type'               => 'checkbox',
		'id'                 => $input_id,
		'class'              => $cb_input_class,
		'name'               => $name,
		'value'              => $value,
		'checked'            => $checked,
		'disabled'           => $disabled,
		'required'           => $required,
		'aria-describedby'   => $describedby,
		'aria-invalid'       => $invalid ? 'true' : null,
		'data-indeterminate' => $indeterminate ? 'true' : null,
	)
);

$html  = '<div ' . $wrapper_attrs . '>';
$html .= '<input' . $input_attrs . ' />';
$html .= '<label for="' . esc_attr( $input_id ) . '" class="' . esc_attr( $cb_label_class ) . '">';
$html .= '<span class="' . esc_attr( $cb_label_text_class ) . '">' . wp_kses_post( $label ) . '</span>';
$html .= '</label>';

if ( $helper_text !== '' ) {
	$html .= '<div id="' . esc_attr( $helper_id ) . '" class="' . esc_attr( $cb_helper_class ) . '">' . wp_kses_post( $helper_text ) . '</div>';
}
if ( $invalid && $invalid_text !== '' ) {
	$html .= '<div id="' . esc_attr( $invalid_id ) . '" class="' . esc_attr( $cb_requirement_class ) . '">' . wp_kses_post( $invalid_text ) . '</div>';
}
$html .= '</div>';

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- All values escaped above.
