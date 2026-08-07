<?php
/**
 * AWT Form — server-rendered output.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$form_action = isset( $attributes['action'] ) ? (string) $attributes['action'] : '';
$method      = isset( $attributes['method'] ) ? (string) $attributes['method'] : 'post';
$enctype     = isset( $attributes['enctype'] ) ? (string) $attributes['enctype'] : '';
$novalidate  = ! empty( $attributes['novalidate'] );
$aria_label  = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : '';
$legend      = isset( $attributes['legend'] ) ? (string) $attributes['legend'] : '';
$description = isset( $attributes['description'] ) ? (string) $attributes['description'] : '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$form_root_class   = $ds ? $ds->classes_for( 'form' ) : 'cds--form';
$form_header_class = $ds ? $ds->classes_for( 'form', array( 'element' => 'header' ) ) : 'cds--form__header';
$form_title_class  = $ds ? $ds->classes_for( 'form', array( 'element' => 'title' ) ) : 'cds--form__title';
$form_desc_class   = $ds ? $ds->classes_for( 'form', array( 'element' => 'description' ) ) : 'cds--form__description';

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $form_root_class ) );

$form_attrs = html_attrs(
	array(
		'action'     => $form_action,
		'method'     => $method,
		'enctype'    => $enctype,
		'novalidate' => $novalidate,
		'aria-label' => $aria_label,
	)
);

$html = '<form ' . $wrapper_attrs . $form_attrs . '>';
if ( $legend !== '' || $description !== '' ) {
	$html .= '<div class="' . esc_attr( $form_header_class ) . '">';
	if ( $legend !== '' ) {
		$html .= '<h2 class="' . esc_attr( $form_title_class ) . '">' . wp_kses_post( $legend ) . '</h2>';
	}
	if ( $description !== '' ) {
		$html .= '<p class="' . esc_attr( $form_desc_class ) . '">' . wp_kses_post( $description ) . '</p>';
	}
	$html .= '</div>';
}
$html .= $content;
$html .= '</form>';

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $content is filtered by core; other values escaped.
