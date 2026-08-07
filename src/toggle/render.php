<?php
/**
 * AWT Toggle — server-rendered output.
 *
 * Carbon's current Toggle CSS expects:
 *
 *   .cds--toggle__button (a visually-hidden input — Carbon scopes it with
 *   position:absolute; clip:rect(0,0,0,0))
 *   + .cds--toggle__label (the clickable label, sibling — via :focus + .label
 *      selectors in carbon.css)
 *
 * Stage 0 ships the input as <input type="checkbox" role="switch">. Pairing
 * input + label gives us native activation (click label -> toggle input);
 * we layer the Interactivity API on top for reactive `aria-checked` /
 * state-label updates and to expose the toggled state to a parent <form>.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\classnames;
use function AWT\Blocks\Render\unique_id;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$label      = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Toggle label', 'awt' );
$name       = isset( $attributes['name'] ) ? (string) $attributes['name'] : '';
$size       = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$toggled    = ! empty( $attributes['toggled'] );
$disabled   = ! empty( $attributes['disabled'] );
$readonly   = ! empty( $attributes['readonly'] );
$label_a    = isset( $attributes['labelA'] ) ? (string) $attributes['labelA'] : __( 'Off', 'awt' );
$label_b    = isset( $attributes['labelB'] ) ? (string) $attributes['labelB'] : __( 'On', 'awt' );
$hide_label = ! empty( $attributes['hideLabel'] );

$input_id = unique_id( 'awt-toggle' );

// Carbon's small-toggle rules target `.cds--toggle__appearance--sm` (the
// appearance span that wraps the switch + on/off text), NOT a `--sm` modifier
// on the outer `.cds--toggle` element. So size on the wrapper does nothing;
// the `--sm` modifier must live on the appearance element instead.
$modifiers = array( $disabled ? 'disabled' : '' );
$modifiers = array_values( array_filter( $modifiers, static fn( $m ) => $m !== '' ) );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$toggle_inner_class      = $ds ? $ds->classes_for( 'toggle', array( 'disabled' => $disabled ) ) : classnames( 'cds--toggle', $modifiers );
$toggle_button_class     = $ds ? $ds->classes_for( 'toggle', array( 'element' => 'button' ) ) : 'cds--toggle__button';
$toggle_label_class      = $ds ? $ds->classes_for( 'toggle', array( 'element' => 'label' ) ) : 'cds--toggle__label';
$toggle_label_text_class = $ds ? $ds->classes_for(
	'toggle',
	array(
		'element'    => 'label-text',
		'hide_label' => $hide_label,
	)
) : ( $hide_label ? 'cds--toggle__label-text cds--visually-hidden' : 'cds--toggle__label-text' );
$toggle_appearance_class = $ds ? $ds->classes_for(
	'toggle',
	array(
		'element' => 'appearance',
		'size'    => $size,
	)
) : ( 'cds--toggle__appearance' . ( $size === 'sm' ? ' cds--toggle__appearance--sm' : '' ) );
$toggle_switch_class     = $ds ? $ds->classes_for(
	'toggle',
	array(
		'element' => 'switch',
		'toggled' => $toggled,
	)
) : ( $toggled ? 'cds--toggle__switch cds--toggle__switch--checked' : 'cds--toggle__switch' );
$toggle_text_class       = $ds ? $ds->classes_for( 'toggle', array( 'element' => 'text' ) ) : 'cds--toggle__text';

// Carbon's .cds--toggle is `display: inline-block` — merging it onto the
// wp-block wrapper breaks the editor's centered layout (auto margins don't
// center inline-block). Keep the wp-block wrapper as a block-level container
// and put the Carbon class on an inner element instead.
$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => 'awt-block-wrap ' . (string) ( $attributes['className'] ?? '' ),
		'data-wp-interactive' => 'awt/toggle',
	)
);

$context_json = wp_json_encode(
	array(
		'toggled' => $toggled,
		'labelA'  => $label_a,
		'labelB'  => $label_b,
	)
);

$input_attrs = html_attrs(
	array(
		'type'                       => 'checkbox',
		'id'                         => $input_id,
		'class'                      => $toggle_button_class,
		'role'                       => 'switch',
		'name'                       => $name,
		'value'                      => '1',
		'checked'                    => $toggled,
		'disabled'                   => $disabled || $readonly,
		'data-wp-on--change'         => 'actions.toggle',
		'data-wp-bind--checked'      => 'state.checked',
		'data-wp-bind--aria-checked' => 'state.ariaChecked',
	)
);

$html  = '<div ' . $wrapper_attrs . ' data-wp-context=\'' . esc_attr( $context_json ) . '\'>';
$html .= '<div class="' . esc_attr( $toggle_inner_class ) . '">';
$html .= '<input' . $input_attrs . ( $toggled ? ' aria-checked="true"' : ' aria-checked="false"' ) . ' />';
$html .= '<label for="' . esc_attr( $input_id ) . '" class="' . esc_attr( $toggle_label_class ) . '">';
$html .= '<span class="' . esc_attr( $toggle_label_text_class ) . '">' . wp_kses_post( $label ) . '</span>';
$html .= '<span class="' . esc_attr( $toggle_appearance_class ) . '">';
$html .= '<span class="' . esc_attr( $toggle_switch_class ) . '" data-wp-class--cds--toggle__switch--checked="state.checked"></span>';
$html .= '<span class="' . esc_attr( $toggle_text_class ) . '">' . esc_html( $toggled ? $label_b : $label_a ) . '</span>';
$html .= '</span>';
$html .= '</label>';
$html .= '</div>';
$html .= '</div>';

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
