<?php
/**
 * AWT Radio button group.
 *
 * Renders a <fieldset><legend>...</legend> wrapper around inner radio buttons.
 * The group's `name` attribute is exposed to children via a request-scoped global
 * so each radio button shares the same input name when rendered.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\classnames;
use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\Render\describedby;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$name           = isset( $attributes['name'] ) ? (string) $attributes['name'] : '';
$legend         = isset( $attributes['legend'] ) ? (string) $attributes['legend'] : '';
$orientation    = isset( $attributes['orientation'] ) ? (string) $attributes['orientation'] : 'horizontal';
$label_position = isset( $attributes['labelPosition'] ) ? (string) $attributes['labelPosition'] : 'right';
$helper_text    = isset( $attributes['helperText'] ) ? (string) $attributes['helperText'] : '';
$invalid        = ! empty( $attributes['invalid'] );
$invalid_text   = isset( $attributes['invalidText'] ) ? (string) $attributes['invalidText'] : '';
$required       = ! empty( $attributes['required'] );

if ( $name === '' ) {
	$name = unique_id( 'awt-radio-group' );
}

$helper_id  = $helper_text !== '' ? $name . '-helper' : '';
$invalid_id = ( $invalid && $invalid_text !== '' ) ? $name . '-error' : '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$rbg_legend_class = $ds ? $ds->classes_for( 'radio', array( 'element' => 'group-legend' ) ) : 'cds--label';
$rbg_helper_class = $ds ? $ds->classes_for( 'radio', array( 'element' => 'group-helper' ) ) : 'cds--form__helper-text';
$rbg_error_class  = $ds ? $ds->classes_for( 'radio', array( 'element' => 'group-error' ) ) : 'cds--form-requirement';

$modifiers = array(
	$orientation,
	'label-' . $label_position,
	$invalid ? 'invalid' : '',
);
$modifiers = array_values( array_filter( $modifiers, static fn( $m ) => $m !== '' ) );

if ( $ds ) {
	$_rbg_variants = array(
		'element'        => 'group-root',
		'orientation'    => $orientation,
		'label_position' => $label_position,
	);
	if ( $invalid ) {
		$_rbg_variants['invalid'] = true; }
	$_rbg_base = $ds->classes_for( 'radio', $_rbg_variants );
	$class     = classnames( $_rbg_base, array(), (string) ( $attributes['className'] ?? '' ) );
} else {
	$class = classnames( 'cds--radio-button-group', $modifiers, (string) ( $attributes['className'] ?? '' ) );
}

$wrapper_extra = array( 'class' => $class );
$describedby   = describedby( array( $helper_id, $invalid_id ) );
if ( $describedby !== '' ) {
	$wrapper_extra['aria-describedby'] = $describedby;
}
$wrapper_attrs = get_block_wrapper_attributes( $wrapper_extra );

$html = '<fieldset ' . $wrapper_attrs . '>';
if ( $legend !== '' ) {
	$html .= '<legend class="' . esc_attr( $rbg_legend_class ) . '">' . wp_kses_post( $legend ) . '</legend>';
}
$html .= $content;
if ( $helper_text !== '' ) {
	$html .= '<div id="' . esc_attr( $helper_id ) . '" class="' . esc_attr( $rbg_helper_class ) . '">' . wp_kses_post( $helper_text ) . '</div>';
}
if ( $invalid && $invalid_text !== '' ) {
	$html .= '<div id="' . esc_attr( $invalid_id ) . '" class="' . esc_attr( $rbg_error_class ) . '">' . wp_kses_post( $invalid_text ) . '</div>';
}
$html .= '</fieldset>';

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
