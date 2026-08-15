<?php
/**
 * AWT Tab — single tab button inside the tabs' tab-list.
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

$label    = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Tab', 'awt-blocks' );
$disabled = ! empty( $attributes['disabled'] );

$tab_id = unique_id( 'awt-tab' );

$nav_item_class = $ds
	? $ds->classes_for(
		'tabs',
		array(
			'element'  => 'nav-item',
			'disabled' => $disabled,
		)
	)
	: ( 'cds--tabs__nav-item' . ( $disabled ? ' cds--tabs__nav-item--disabled' : '' ) );

$nav_link_class       = $ds ? $ds->classes_for( 'tabs', array( 'element' => 'nav-link' ) ) : 'cds--tabs__nav-link';
$nav_item_label_class = $ds ? $ds->classes_for( 'tabs', array( 'element' => 'nav-item-label' ) ) : 'cds--tabs__nav-item-label';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => $nav_item_class,
		'role'  => 'presentation',
	)
);

$button_attrs = sprintf(
	'id="%1$s" type="button" role="tab" aria-selected="false" tabindex="-1" %2$sdata-wp-on--click="actions.choose" data-wp-on--keydown="actions.keydown"',
	esc_attr( $tab_id ),
	$disabled ? 'disabled ' : ''
);

// Carbon's reference structure wraps the label in a
// `cds--tabs__nav-item-label` span. That class carries
// `line-height: 2rem` (32px) — without it the button collapsed to the
// raw 14px text height, which is why the tabs looked short and squat.
printf(
	'<li %1$s><button class="%4$s" %2$s><span class="%5$s">%3$s</span></button></li>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$button_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	wp_kses_post( $label ),
	esc_attr( $nav_link_class ),
	esc_attr( $nav_item_label_class )
);
