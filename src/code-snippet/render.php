<?php
/**
 * AWT Code snippet — server-rendered output.
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

$variant       = isset( $attributes['variant'] ) ? (string) $attributes['variant'] : 'multi';
$code          = isset( $attributes['code'] ) ? (string) $attributes['code'] : '';
$language      = isset( $attributes['language'] ) ? (string) $attributes['language'] : '';
$copy_label    = isset( $attributes['copyLabel'] ) ? (string) $attributes['copyLabel'] : __( 'Copy', 'awt-blocks' );
$copied_label  = isset( $attributes['copiedLabel'] ) ? (string) $attributes['copiedLabel'] : __( 'Copied', 'awt-blocks' );
$hide_copy_btn = ! empty( $attributes['hideCopyBtn'] );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$is_inline = $variant === 'inline';

$root_class            = $ds ? $ds->classes_for( 'code-snippet', array( 'variant' => $variant ) ) : 'cds--snippet cds--snippet--' . $variant;
$copy_btn_class        = $ds ? $ds->classes_for( 'code-snippet', array( 'element' => 'copy-button' ) ) : 'cds--snippet-button cds--copy-btn';
$copy_btn_inline_class = $ds ? $ds->classes_for( 'code-snippet', array( 'element' => 'copy-button-inline' ) ) : 'cds--snippet-button cds--copy-btn cds--snippet-button--inline';
$container_class       = $ds ? $ds->classes_for( 'code-snippet', array( 'element' => 'container' ) ) : 'cds--snippet-container';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => $root_class,
		'data-wp-interactive' => 'awt/code-snippet',
		'data-wp-context'     => wp_json_encode(
			array(
				'copyLabel'   => $copy_label,
				'copiedLabel' => $copied_label,
			)
		),
	)
);

$code_attrs = $language !== '' ? sprintf( ' data-language="%s"', esc_attr( $language ) ) : '';

$copy_btn = '';
if ( ! $is_inline && ! $hide_copy_btn ) {
	$copy_btn = sprintf(
		'<button type="button" class="%1$s" aria-label="%2$s" data-wp-on--click="actions.copy">%3$s</button>',
		esc_attr( $copy_btn_class ),
		esc_attr( $copy_label ),
		icon( 'copy', 16 )
	);
}

if ( $is_inline ) {
	printf(
		'<span %1$s><code%2$s>%3$s</code>%4$s</span>',
		$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
		$code_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built with esc_attr() above.
		esc_html( $code ),
		$hide_copy_btn ? '' : sprintf(
			' <button type="button" class="%1$s" aria-label="%2$s" data-wp-on--click="actions.copy">%3$s</button>',
			esc_attr( $copy_btn_inline_class ),
			esc_attr( $copy_label ),
			icon( 'copy', 16 ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- icon() returns vetted plugin-bundled SVG markup.
		)
	);
	return;
}

// Carbon wraps the <pre><code> in a `.cds--snippet-container` whose
// `overflow-x: auto` isolates the scrolling region from the copy button.
// Without the wrapper, the snippet's `overflow-x: auto` collides with the
// absolutely-positioned button: long code scrolls underneath the button
// and only becomes visible after the user scrolls past the button hit-box.
// Adding the container also matches Carbon's expected DOM, so its CSS
// (padding-inline-start: 1rem on the container, padding-inline-end: 2.5rem
// on the snippet) lines up cleanly with our overrides.

/*
 * The tab stop has to sit on whichever element actually scrolls, and that is a
 * different element for each variant:
 *
 *   single — our own rule scrolls the container
 *            (`.cds--snippet--single .cds--snippet-container { overflow-x: auto }`)
 *   multi  — CARBON scrolls the <pre>
 *            (`.cds--snippet--multi .cds--snippet-container pre { overflow: auto }`)
 *
 * Both variants used to put `tabindex="0"` on the container, which is correct
 * for single and wrong for multi: there the tab stop landed on a box that does
 * not scroll, one level above the box that does, so a keyboard user could focus
 * the snippet and still not reach the code past the right edge (WCAG 2.1.1; axe
 * `scrollable-region-focusable`, which pointed at the <pre>, not the container).
 * Only the scrolling element is focusable now, so neither variant carries a tab
 * stop that does nothing. No `role` is added: a <pre> announces its own content,
 * and overriding its role would cost the preformatted semantics for nothing.
 */
$is_multi        = 'multi' === $variant;
$container_extra = $is_multi ? '' : ' tabindex="0"';
$pre_extra       = $is_multi ? ' tabindex="0"' : '';

printf(
	'<div %1$s><div class="%5$s"%6$s><pre%7$s><code%2$s>%3$s</code></pre></div>%4$s</div>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$code_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built with esc_attr() above.
	esc_html( $code ),
	$copy_btn, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	esc_attr( $container_class ),
	$container_extra, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- literal attribute chosen above, no dynamic input.
	$pre_extra // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- literal attribute chosen above, no dynamic input.
);
