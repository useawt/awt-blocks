<?php
/**
 * AWT Notification — server-rendered output.
 *
 * Inline (banner) + toast variants. Role + aria-live wire automatic
 * announcement on render.
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

$kind               = isset( $attributes['kind'] ) ? (string) $attributes['kind'] : 'info';
$notification_title = isset( $attributes['title'] ) ? (string) $attributes['title'] : __( 'Notification', 'awt-blocks' );
$subtitle           = isset( $attributes['subtitle'] ) ? (string) $attributes['subtitle'] : '';
$caption            = isset( $attributes['caption'] ) ? (string) $attributes['caption'] : '';
$low_contrast       = ! empty( $attributes['lowContrast'] );
$hide_close         = ! empty( $attributes['hideCloseButton'] );
$variant            = isset( $attributes['variant'] ) ? (string) $attributes['variant'] : 'inline';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$base    = $variant === 'toast' ? 'cds--toast-notification' : 'cds--inline-notification';
$classes = array( $base, $base . '--' . $kind );
if ( $low_contrast ) {
	$classes[] = $base . '--low-contrast';
}

$root_class = $ds ? $ds->classes_for(
	'notification',
	array(
		'variant'     => $variant,
		'kind'        => $kind,
		'lowContrast' => $low_contrast,
	)
) : implode( ' ', $classes );

// Carbon's notifications use the FILLED icon variants at 20px so the glyphs
// read clearly against the dark / tinted backgrounds and align with the title
// row. Outline icons (Stage 0 fallback) end up looking thin and washed out
// against Carbon's notification backgrounds.
$kind_icon_map = array(
	'info'    => 'information--filled',
	'success' => 'checkmark--filled',
	'warning' => 'warning--alt--filled',
	'error'   => 'error--filled',
);
$kind_icon     = $kind_icon_map[ $kind ] ?? 'information--filled';

$is_alert          = $kind === 'error';
$notification_role = $is_alert ? 'alert' : 'status';
$aria_live         = $is_alert ? 'assertive' : 'polite';

$wrapper_extra = array(
	'class'     => $root_class,
	'role'      => $notification_role,
	'aria-live' => $aria_live,
);
if ( ! $hide_close ) {
	// The close button dismisses via the Interactivity API (view.js). The
	// reactive `hidden` binding takes the whole notification out of the
	// accessibility tree on dismiss — Carbon's reference removes the node.
	$wrapper_extra['data-wp-interactive']  = 'awt/notification';
	$wrapper_extra['data-wp-context']      = wp_json_encode( array( 'dismissed' => false ) );
	$wrapper_extra['data-wp-bind--hidden'] = 'context.dismissed';
}
$wrapper_attrs = get_block_wrapper_attributes( $wrapper_extra );

$close_btn = $hide_close
	? ''
	: sprintf(
		'<button type="button" class="%1$s__close-button" aria-label="%2$s" data-wp-on--click="actions.dismiss">%3$s</button>',
		esc_attr( $base ),
		esc_attr__( 'Close notification', 'awt-blocks' ),
		// Carbon's notification close button uses a 20px icon — matches the 20px
		// kind icon and the editor preview's hardcoded 20×20 SVG. The helper
		// defaults to 16, which made the published close glyph smaller than the
		// editor's; pin it to 20 for editor/front-end parity.
		icon( 'close', 20 )
	);

$caption_html = ( $variant === 'toast' && $caption !== '' )
	? sprintf( '<div class="%1$s__caption">%2$s</div>', esc_attr( $base ), wp_kses_post( $caption ) )
	: '';

printf(
	'<div %1$s>'
	. '<div class="%2$s__details">'
	. '<div class="%2$s__icon" aria-hidden="true">%3$s</div>'
	. '<div class="%2$s__text-wrapper">'
	. '<p class="%2$s__title">%4$s%5$s</p>'
	. '%6$s'
	. '</div>'
	. '</div>'
	. '%7$s'
	. '</div>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $base ),
	$kind_icon ? icon( $kind_icon, 20 ) : '', // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- icon() returns vetted plugin-bundled SVG markup.
	wp_kses_post( $notification_title ),
	$subtitle !== '' ? ' <span class="' . esc_attr( $base ) . '__subtitle">' . wp_kses_post( $subtitle ) . '</span>' : '',
	$caption_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$close_btn // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
);
