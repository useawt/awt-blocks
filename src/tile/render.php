<?php
/**
 * AWT Tile — server-rendered output.
 *
 * Carbon tile variants:
 *   - default     — read-only <div>
 *   - clickable   — <a href="…"> (full surface clickable)
 *   - selectable  — with a groupName: a native <input type="radio"> plus the
 *                   tile as its <label>, so several tiles sharing the name form
 *                   a real radio group. Without one: a <div role="checkbox">
 *                   that toggles on its own. See the branch for why the two
 *                   differ.
 *   - expandable  — `<details>` element with a Carbon-styled summary header
 *                   and a chevron icon that rotates on expand. Native browser
 *                   toggle, full keyboard + screen-reader support out of the
 *                   box.
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\unique_id;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$variant      = isset( $attributes['variant'] ) ? (string) $attributes['variant'] : 'default';
$href         = isset( $attributes['href'] ) ? (string) $attributes['href'] : '';
$group_name   = isset( $attributes['groupName'] ) ? (string) $attributes['groupName'] : '';
$tile_value   = isset( $attributes['value'] ) ? (string) $attributes['value'] : '';
$summary      = isset( $attributes['summary'] ) ? (string) $attributes['summary'] : __( 'Expandable tile', 'awt-blocks' );
$default_open = ! empty( $attributes['defaultOpen'] );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$classes = array( 'cds--tile' );
if ( $variant === 'clickable' ) {
	$classes[] = 'cds--tile--clickable';
} elseif ( $variant === 'selectable' ) {
	$classes[] = 'cds--tile--selectable';
} elseif ( $variant === 'expandable' ) {
	$classes[] = 'cds--tile--expandable';
}

$root_class = $ds ? $ds->classes_for( 'tile', array( 'variant' => $variant ) ) : implode( ' ', $classes );

// A resting selectable or clickable tile has no perceivable shape: Carbon
// reserves a 1px border and leaves it transparent, so the control is found by
// its fill alone, which measures 1.10:1 from the page in the light themes.
// See tile_frame_class() for the numbers and for why Carbon's own
// enable-tile-contrast flag is not enough.
$frame_class = \AWT\Blocks\Render\tile_frame_class( $attributes, $variant );
if ( $frame_class !== '' ) {
	$root_class .= ' ' . $frame_class;
}

$summary_class      = $ds ? $ds->classes_for( 'tile', array( 'element' => 'summary' ) ) : 'cds--tile__summary';
$summary_text_class = $ds ? $ds->classes_for( 'tile', array( 'element' => 'summary-text' ) ) : 'cds--tile__summary-text';
$chevron_class      = $ds ? $ds->classes_for( 'tile', array( 'element' => 'chevron' ) ) : 'cds--tile__chevron';
$content_class      = $ds ? $ds->classes_for( 'tile', array( 'element' => 'content' ) ) : 'cds--tile__content';

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $root_class ) );

if ( $variant === 'clickable' && $href !== '' ) {
	printf( '<a %1$s href="%2$s">%3$s</a>', $wrapper_attrs, esc_url( $href ), $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; inner-block markup, escaped by each inner block on render.
	return;
}

if ( $variant === 'selectable' ) {
	/*
	 * Two mechanisms, because Carbon uses two and they are right for different
	 * jobs:
	 *
	 *   groupName set  -> pick ONE of several. A real <input type="radio">
	 *     sharing a `name`, with the tile as its <label>. The browser then
	 *     supplies exclusive selection, arrow-key navigation, a single tab stop
	 *     for the whole group, and a value that submits with the form. None of
	 *     that needs JavaScript, and the group's name comes from the Tile group
	 *     block's <legend>.
	 *
	 *   no groupName   -> an independent on/off tile. Carbon uses
	 *     role="checkbox" + aria-checked here too, since there is no native
	 *     element for "a box-shaped checkbox with arbitrary content", so this
	 *     branch keeps the scripted toggle.
	 *
	 * Until 2026-08-05 BOTH used role="radio" with aria-checked and a
	 * hand-rolled store, and the grouped case had no group element at all: a
	 * screen reader was told each tile was a radio button but never what the
	 * choice was about, and every tile was its own tab stop with no arrow keys.
	 * The tiles also carried no value, so a selection could not be submitted.
	 */
	$checkmark_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">'
		. '<path d="M8,1C4.1,1,1,4.1,1,8c0,3.9,3.1,7,7,7s7-3.1,7-7C15,4.1,11.9,1,8,1z M7,11L4.3,8.3l0.9-0.8L7,9.3l4-3.9l0.9,0.8L7,11z"/>'
		. '<path d="M7,11L4.3,8.3l0.9-0.8L7,9.3l4-3.9l0.9,0.8L7,11z" data-icon-path="inner-path" opacity="0"/>'
		. '</svg>';

	if ( $group_name !== '' ) {
		$radio_class = $ds
			? $ds->classes_for(
				'tile',
				array(
					'variant' => 'selectable',
					'radio'   => true,
				)
			)
			: 'cds--tile cds--tile--selectable cds--tile--radio';
		// The grouped branch builds its own class string, so the frame class
		// has to be added here too — the $root_class above is not what this
		// path emits. Missing it meant a radio tile stayed borderless while the
		// ungrouped one gained an outline, which the contrast measurement
		// caught and reading the code did not.
		if ( $frame_class !== '' ) {
			$radio_class .= ' ' . $frame_class;
		}
		$radio_attrs = get_block_wrapper_attributes( array( 'class' => $radio_class ) );
		$input_id    = unique_id( 'awt-tile' );

		// The <input> must stay the label's immediately-preceding sibling:
		// Carbon draws the focus ring with `.cds--tile-input:focus + .cds--tile`
		// and theme.css draws the selected state with `:checked + .cds--tile`.
		// No tabindex — the browser's own roving tabindex gives a same-name
		// radio group exactly one tab stop, which is the behavior we want.
		// (Carbon writes tabindex="0" on every input; it measures as one tab
		// stop anyway, so the attribute is redundant rather than load-bearing.)
		// No `value` attribute when the author has not set one. The obvious
		// fallback — reuse the generated id — would submit `awt-tile-27`, a
		// number that changes on every render, so a form would receive unstable
		// nonsense that looks like it works. Omitting it lets the browser do what
		// plain HTML does, and the block's Value field is there when the tiles
		// really are in a form.
		printf(
			'<input class="%1$s" type="radio" id="%2$s" name="%3$s"%4$s /><label %5$s for="%2$s"><span class="%6$s" aria-hidden="true">%7$s</span><span class="%8$s">%9$s</span></label>',
			esc_attr( $ds ? $ds->classes_for( 'tile', array( 'element' => 'input' ) ) : 'cds--tile-input' ),
			esc_attr( $input_id ),
			esc_attr( $group_name ),
			$tile_value !== '' ? ' value="' . esc_attr( $tile_value ) . '"' : '',
			$radio_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
			esc_attr( $ds ? $ds->classes_for( 'tile', array( 'element' => 'checkmark' ) ) : 'cds--tile__checkmark' ),
			$checkmark_svg, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG.
			esc_attr( $ds ? $ds->classes_for( 'tile', array( 'element' => 'selectable-content' ) ) : 'cds--tile-content' ),
			$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
		);
		return;
	}

	$context_json = wp_json_encode( array( 'role' => 'checkbox' ) );
	printf(
		'<div %1$s role="checkbox" aria-checked="false" tabindex="0" data-wp-interactive="awt/tile" data-wp-context=\'%2$s\' data-wp-on--click="actions.toggle" data-wp-on--keydown="actions.keydown"><span class="%3$s" aria-hidden="true">%4$s</span><span class="%5$s">%6$s</span></div>',
		$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
		esc_attr( $context_json ),
		esc_attr( $ds ? $ds->classes_for( 'tile', array( 'element' => 'checkmark-persistent' ) ) : 'cds--tile__checkmark cds--tile__checkmark--persistent' ),
		$checkmark_svg, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG.
		esc_attr( $ds ? $ds->classes_for( 'tile', array( 'element' => 'selectable-content' ) ) : 'cds--tile-content' ),
		$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
	);
	return;
}

if ( $variant === 'expandable' ) {
	// Native <details> gives us the toggle behavior, keyboard support, and
	// the open/closed state for free. We hide the browser's default marker
	// (via `cds--tile__summary` CSS) and inject a Carbon chevron via the
	// `cds--tile__chevron` span — Carbon's CSS rotates that chevron when
	// the parent has `cds--tile--is-expanded` (we add it via `[open]`
	// attribute selector in theme.css).
	$chevron = '<span class="' . esc_attr( $chevron_class ) . '" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" focusable="false"><path d="M8 11L3 6l.7-.7L8 9.6l4.3-4.3.7.7z"/></svg></span>';
	printf(
		// The summary's title + chevron are laid out by an INNER flex row, NOT by
		// putting `display:flex` on the <summary> itself. WebKit/Safari only honors
		// the native click-to-toggle when the <summary> keeps its default
		// `display: list-item`; making the summary a flex container silently
		// disables toggling there ("doesn't always open"). Keeping the flex on an
		// inner wrapper preserves the toggle in every browser.
		'<details %1$s%2$s><summary class="%6$s"><span class="cds--tile__summary-row"><span class="%7$s">%3$s</span>%4$s</span></summary><div class="%8$s">%5$s</div></details>',
		$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
		$default_open ? ' open' : '',
		esc_html( $summary ),
		$chevron, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above.
		$content, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
		esc_attr( $summary_class ),
		esc_attr( $summary_text_class ),
		esc_attr( $content_class )
	);
	return;
}

printf( '<div %1$s>%2$s</div>', $wrapper_attrs, $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; inner-block markup, escaped by each inner block on render.
