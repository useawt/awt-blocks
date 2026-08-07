<?php
/**
 * AWT Menu button — server-rendered output.
 *
 * Uses the WAI-ARIA menu-button pattern. Interactivity API ('awt/menu-button')
 * handles open/close, Escape, ArrowDown/ArrowUp, Home, End, and item activation.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\classnames;
use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\Render\icon;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$label          = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Menu', 'awt' );
$kind           = isset( $attributes['kind'] ) ? (string) $attributes['kind'] : 'primary';
$size           = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'lg';
$menu_alignment = isset( $attributes['menuAlignment'] ) ? (string) $attributes['menuAlignment'] : 'bottom';
$disabled       = ! empty( $attributes['disabled'] );
$items          = isset( $attributes['items'] ) && is_array( $attributes['items'] ) ? $attributes['items'] : array();

$menu_id    = unique_id( 'awt-menu' );
$trigger_id = $menu_id . '-trigger';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

// Carbon's .cds--menu-button is inline-block (and theme.css sets position:
// relative). Merging it onto the wp-block wrapper breaks the editor's
// constrained-layout centering. Outer wrapper stays block-level; inner div
// holds the Carbon class.
$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => 'awt-block-wrap',
		'data-wp-interactive' => 'awt/menu-button',
	)
);

$context_json = wp_json_encode(
	array(
		'open'        => false,
		'activeIndex' => -1,
	)
);

$root_class      = $ds ? $ds->classes_for( 'menu-button' ) : 'cds--menu-button';
$trigger_class   = $ds ? $ds->classes_for(
	'menu-button',
	array(
		'element' => 'trigger',
		'kind'    => $kind,
		'size'    => $size,
	)
) : classnames( 'cds--btn', array( $kind, $size ), 'cds--menu-button__trigger' );
$menu_class      = $ds ? $ds->classes_for(
	'menu-button',
	array(
		'element'       => 'menu',
		'menuAlignment' => $menu_alignment,
	)
) : 'cds--menu cds--menu--' . $menu_alignment;
$menu_item_class = $ds ? $ds->classes_for( 'menu-button', array( 'element' => 'menu-item' ) ) : 'cds--menu-item';
$item_btn_class  = $ds ? $ds->classes_for( 'menu-button', array( 'element' => 'menu-item-button' ) ) : 'cds--menu-item__button';

// aria-expanded + hidden are mutated imperatively by view.js (per phase-1 §2
// #8 default). No data-wp-bind needed; initial values come from this render.
$trigger_attrs = html_attrs(
	array(
		'type'                => 'button',
		'id'                  => $trigger_id,
		'class'               => $trigger_class,
		'aria-haspopup'       => 'menu',
		'aria-controls'       => $menu_id,
		'aria-expanded'       => 'false',
		'disabled'            => $disabled,
		'data-wp-on--click'   => 'actions.toggle',
		'data-wp-on--keydown' => 'actions.triggerKeydown',
	)
);

$menu_attrs = html_attrs(
	array(
		'id'                  => $menu_id,
		'class'               => $menu_class,
		'role'                => 'menu',
		'aria-labelledby'     => $trigger_id,
		'data-wp-on--keydown' => 'actions.menuKeydown',
	)
);

$html  = '<div ' . $wrapper_attrs . ' data-wp-context=\'' . esc_attr( $context_json ) . '\'>';
$html .= '<div class="' . esc_attr( $root_class ) . '">';
$html .= '<button' . $trigger_attrs . '>';
$html .= wp_kses_post( $label );
// The chevron carries `cds--btn__icon`: Carbon's CSS uses that class for
// (a) positioning (margin-inline-start: 0.5rem so it sits a half-step from
// the label), and (b) the 110ms rotate transition. The open-state rotation
// (180deg) is wired by toggling `cds--menu-button__trigger--open` on the
// button from view.js — Carbon's selector `.cds--menu-button__trigger--open
// svg { transform: rotate(180deg) }` then fires.
$html .= icon( 'chevron-down', 16, 'cds--btn__icon' );
$html .= '</button>';
$html .= '<ul' . $menu_attrs . ' hidden>';

foreach ( $items as $idx => $item ) {
	$item_label    = isset( $item['label'] ) ? (string) $item['label'] : '';
	$item_value    = isset( $item['value'] ) ? (string) $item['value'] : '';
	$item_link     = isset( $item['link'] ) ? (string) $item['link'] : '';
	$item_disabled = ! empty( $item['disabled'] );

	$item_attrs = html_attrs(
		array(
			'class'         => $menu_item_class,
			'role'          => 'menuitem',
			'data-index'    => $idx,
			'aria-disabled' => $item_disabled ? 'true' : null,
		)
	);

	// `data-link` (when set) tells the view store to navigate the visitor to
	// that URL on selection — turns the action menu into a navigation menu for
	// regular sites. `data-value` is still emitted for form/app consumers that
	// listen for the `awt:menu-select` event.
	$button_attrs = html_attrs(
		array(
			'type'              => 'button',
			'class'             => $item_btn_class,
			'data-value'        => $item_value,
			'data-link'         => $item_link !== '' ? esc_url( $item_link ) : null,
			'data-wp-on--click' => $item_disabled ? null : 'actions.selectItem',
			'tabindex'          => '-1',
			'disabled'          => $item_disabled,
		)
	);

	$html .= '<li' . $item_attrs . '>';
	$html .= '<button' . $button_attrs . '>' . wp_kses_post( $item_label ) . '</button>';
	$html .= '</li>';
}
$html .= '</ul>';
$html .= '</div>';
$html .= '</div>';

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
