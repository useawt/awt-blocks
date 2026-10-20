<?php
/**
 * AWT Tooltip — server-rendered output.
 *
 * Carbon's definition tooltip: the trigger is a button styled as text with a
 * dotted underline, connected to the hint via aria-describedby. Hover and
 * focus open the hint, a tap, Enter or Space toggles it, and Escape closes it.
 * It used to be a focusable span, which a screen reader announced as plain
 * text, with no underline to show a hint was there (outside accessibility
 * review, 2026-10-20).
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

// No trigger text: nothing to hover or focus. A new tooltip starts empty.
if ( \AWT\Blocks\Render\is_blank( $trigger_text ) ) {
	return;
}

$tooltip_id = unique_id( 'awt-tooltip' );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$root_class    = $ds ? $ds->classes_for( 'tooltip', array( 'align' => $align ) ) : classnames( 'cds--tooltip', array( $align ) );
$trigger_class = $ds ? $ds->classes_for( 'tooltip', array( 'element' => 'trigger' ) ) : 'cds--definition-term';
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
		'type'                    => 'button',
		'class'                   => $trigger_class,
		'aria-controls'           => $tooltip_id,
		'aria-describedby'        => $tooltip_id,
		'aria-expanded'           => 'false',
		'data-wp-init'            => 'callbacks.init',
		'data-wp-on--mouseenter'  => 'actions.scheduleShow',
		'data-wp-on--mouseleave'  => 'actions.scheduleHide',
		'data-wp-on--focus'       => 'actions.showNow',
		'data-wp-on--blur'        => 'actions.hideNow',
		'data-wp-on--keydown'     => 'actions.keydown',
		'data-wp-on--pointerdown' => 'actions.press',
		'data-wp-on--click'       => 'actions.toggle',
	)
);

// A button may hold only text and inline formatting: the editor offers bold
// and italic, and anything else (a link pasted in the code editor) would put
// one control inside another.
$trigger_html = wp_kses(
	$trigger_text,
	array(
		'strong' => array(),
		'em'     => array(),
		'b'      => array(),
		'i'      => array(),
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
$html .= '<button' . $trigger_attrs . '>' . $trigger_html . '</button>';
$html .= '<span' . $content_attrs . ' hidden>' . wp_kses_post( $description ) . '</span>';
$html .= '</span>';
$html .= '</div>';

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
