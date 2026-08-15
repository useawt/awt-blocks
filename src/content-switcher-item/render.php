<?php
/**
 * AWT Content switcher segment — single button inside the switcher's tablist.
 *
 * Rendered by the parent awt/content-switcher (which walks its inner blocks).
 * Pairs by ordinal with the matching awt/content-switcher-panel; the parent's
 * view store wires aria-controls / aria-labelledby and the selected state at
 * boot, so this renders in the unselected resting state.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\unique_id;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$label    = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Segment', 'awt-blocks' );
$value    = isset( $attributes['value'] ) ? (string) $attributes['value'] : '';
$disabled = ! empty( $attributes['disabled'] );

$btn_id = unique_id( 'awt-cs-btn' );

$btn_class   = $ds ? $ds->classes_for( 'content-switcher', array( 'element' => 'btn' ) ) : 'cds--content-switcher-btn';
$label_class = $ds ? $ds->classes_for( 'content-switcher', array( 'element' => 'label' ) ) : 'cds--content-switcher__label';

// role="tab" + the data-wp-on handlers mirror the WAI-ARIA tabs pattern the
// parent's view store drives. aria-selected starts false / tabindex -1; the
// store activates the first segment on init. The `cds--content-switcher__label`
// span sits above Carbon's selected-state ::after overlay (theme.css gives it
// position:relative; z-index:1).
printf(
	'<button id="%1$s" type="button" class="%2$s" role="tab" aria-selected="false" tabindex="-1"%3$s data-value="%4$s" data-wp-on--click="actions.choose" data-wp-on--keydown="actions.keydown"><span class="%5$s">%6$s</span></button>',
	esc_attr( $btn_id ),
	esc_attr( $btn_class ),
	$disabled ? ' disabled' : '',
	esc_attr( $value ),
	esc_attr( $label_class ),
	wp_kses_post( $label )
);
