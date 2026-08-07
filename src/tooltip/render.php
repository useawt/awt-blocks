<?php
/**
 * AWT Tooltip — server-rendered output.
 *
 * WAI-ARIA tooltip pattern. The trigger is keyboard-focusable (tabindex=0) and
 * connected to the popup via aria-describedby. Escape closes when focused.
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

$description    = isset( $attributes['description'] ) ? (string) $attributes['description'] : '';
$align          = isset( $attributes['align'] ) ? (string) $attributes['align'] : 'top';
$default_open   = ! empty( $attributes['defaultOpen'] );
$enter_delay_ms = isset( $attributes['enterDelayMs'] ) ? (int) $attributes['enterDelayMs'] : 100;
$leave_delay_ms = isset( $attributes['leaveDelayMs'] ) ? (int) $attributes['leaveDelayMs'] : 300;
$trigger_text   = isset( $attributes['triggerText'] ) ? (string) $attributes['triggerText'] : '';

$tooltip_id = unique_id( 'awt-tooltip' );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$root_class    = $ds ? $ds->classes_for( 'tooltip', array( 'align' => $align ) ) : classnames( 'cds--tooltip', array( $align ) );
$trigger_class = $ds ? $ds->classes_for( 'tooltip', array( 'element' => 'trigger' ) ) : 'cds--tooltip__trigger';
$content_class = $ds ? $ds->classes_for( 'tooltip', array( 'element' => 'content' ) ) : 'cds--tooltip__content';

$class = classnames( $root_class, array(), (string) ( $attributes['className'] ?? '' ) );

// Carbon's .cds--tooltip is inline-block. Use an outer block-level wrapper for
// editor layout centering; inner span carries the Carbon class.
$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => 'awt-block-wrap',
		'data-wp-interactive' => 'awt/tooltip',
	)
);

$context_json = wp_json_encode(
	array(
		'open'         => $default_open,
		'enterDelayMs' => $enter_delay_ms,
		'leaveDelayMs' => $leave_delay_ms,
	)
);

$trigger_attrs = html_attrs(
	array(
		'class'                  => $trigger_class,
		'tabindex'               => '0',
		'aria-describedby'       => $tooltip_id,
		'data-wp-init'           => 'callbacks.init',
		'data-wp-on--mouseenter' => 'actions.scheduleShow',
		'data-wp-on--mouseleave' => 'actions.scheduleHide',
		'data-wp-on--focus'      => 'actions.showNow',
		'data-wp-on--blur'       => 'actions.hideNow',
		'data-wp-on--keydown'    => 'actions.keydown',
	)
);

// Always rendered hidden. view.js manages the hidden attribute imperatively
// (floating-ui open/close path). For "open by default", callbacks.init opens it
// on hydration so floating-ui positions it correctly and sets data-placement
// (which the caret keys off) — rather than letting it render unpositioned with
// no caret.
$content_attrs = html_attrs(
	array(
		'id'    => $tooltip_id,
		'class' => $content_class,
		'role'  => 'tooltip',
	)
);

$html  = '<div ' . $wrapper_attrs . ' data-wp-context=\'' . esc_attr( $context_json ) . '\'>';
$html .= '<span class="' . esc_attr( $class ) . '">';
$html .= '<span' . $trigger_attrs . '>' . wp_kses_post( $trigger_text ) . '</span>';
$html .= '<span' . $content_attrs . ' hidden>' . wp_kses_post( $description ) . '</span>';
$html .= '</span>';
$html .= '</div>';

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
