<?php
/**
 * AWT Side nav — server-rendered output.
 *
 * Mode 'none' self-removes per spec. Otherwise emits Carbon's side-nav landmark.
 *
 * There is one rendering mode. The inspector used to offer `rail` and `overlay`
 * alongside `persistent`, and neither had a front end: `--rail` is a real Carbon
 * class but only means anything with Carbon's React hover/focus expansion, which
 * ships no CSS here, so it clipped every label to a focusable-but-invisible 3rem
 * strip; `--overlay` is not a Carbon class at all. Both are normalized to the one
 * mode that renders. `defaultExpanded` and `togglable` are likewise no longer
 * read — see the note on the fold-in below and the block's CHANGELOG entry. All
 * three attributes stay registered so content saved by an older version still
 * round-trips through the editor without a validation error.
 *
 * Narrow screens: the nav itself is hidden below Carbon's lg breakpoint (theme.css
 * explains why 0-width is worse than `display: none`), and view.js moves its
 * `<nav>` into the header's slide-out menu so the links stay reachable behind the
 * header's menu button — Carbon's guidance for a persistent side nav on a phone.
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

$nav_mode   = isset( $attributes['mode'] ) ? (string) $attributes['mode'] : 'persistent';
$aria_label = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : __( 'Side navigation', 'awt' );
$dom_id     = isset( $attributes['id'] ) ? (string) $attributes['id'] : 'side-nav';

if ( $nav_mode === 'none' ) {
	return;
}

$nav_mode = 'persistent';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$root_class = $ds
	? $ds->classes_for( 'side-nav', array( 'mode' => $nav_mode ) )
	// Theme-absent fallback; mirrors Carbon::classes_for( 'side-nav' ), including
	// the `--ux` class that docks a persistent nav below the 3rem header.
	: 'cds--side-nav cds--side-nav--' . $nav_mode . ' cds--side-nav--ux';

$nav_class   = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'navigation' ) ) : 'cds--side-nav__navigation';
$items_class = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'items' ) ) : 'cds--side-nav__items';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => $root_class,
		'aria-label'          => $aria_label,
		'id'                  => $dom_id,
		'data-wp-interactive' => 'awt/side-nav',
		'data-wp-init'        => 'callbacks.foldIntoHeaderMenu',
	)
);

printf(
	'<aside %1$s><nav class="%2$s" aria-label="%3$s"><ul class="%4$s">%5$s</ul></nav></aside>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $nav_class ),
	esc_attr( $aria_label ),
	esc_attr( $items_class ),
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
