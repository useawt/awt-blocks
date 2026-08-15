<?php
/**
 * AWT Link — server-rendered output.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\icon;
use function AWT\Blocks\Render\classnames;
use function AWT\Blocks\Render\compute_rel;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$text      = isset( $attributes['text'] ) ? (string) $attributes['text'] : __( 'Link text', 'awt-blocks' );
$href      = isset( $attributes['href'] ) ? (string) $attributes['href'] : '';
$target    = isset( $attributes['target'] ) ? (string) $attributes['target'] : '';
$rel       = isset( $attributes['rel'] ) ? (string) $attributes['rel'] : '';
$size      = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$inline    = ! empty( $attributes['inline'] );
$visited   = isset( $attributes['visited'] ) ? (bool) $attributes['visited'] : false;
$disabled  = ! empty( $attributes['disabled'] );
$icon_name = isset( $attributes['iconName'] ) ? (string) $attributes['iconName'] : '';

// Carbon link visited semantics:
//
// - Default `.cds--link` already overrides the browser's purple :visited
// color back to link-primary blue (see Carbon's `.cds--link:visited`
// rule). So a "normal" link stays blue forever, even after the visitor
// clicks it.
// - Opting INTO purple-on-visit requires the `.cds--link--visited`
// modifier (Carbon's `.cds--link.cds--link--visited:visited { color:
// link-visited }` rule).
//
// Previously this file emitted `cds--link--no-visited` when $visited=false
// — a class that doesn't exist in Carbon. The semantics were also
// inverted (true meant "no purple"). Both fixed: $visited=true now adds
// the correct opt-in modifier `cds--link--visited`. Note: browsers only
// trigger :visited when the URL has actually been visited, so the purple
// color only appears post-click — that's a browser security restriction,
// not a Carbon limitation.
$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$modifiers = array(
	$size,
	$inline ? 'inline' : '',
	$visited ? 'visited' : '',
	$disabled ? 'disabled' : '',
);
$modifiers = array_values( array_filter( $modifiers, static fn( $m ) => $m !== '' ) );

$link_root_class = $ds
	? $ds->classes_for(
		'link',
		array(
			'size'     => $size,
			'inline'   => $inline,
			'visited'  => $visited,
			'disabled' => $disabled,
		)
	)
	: classnames( 'cds--link', $modifiers );

$link_icon_class = $ds
	? $ds->classes_for( 'link', array( 'element' => 'icon' ) )
	: 'cds--link__icon';

// get_block_wrapper_attributes() already merges the block's className.
$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $link_root_class ) );

// Carbon wraps the icon in a `.cds--link__icon` span: that's what supplies the
// inline-start margin (0.5rem), the 1.25rem sizing, and the vertical-align
// trick that keeps the icon aligned with the text baseline. Without the
// wrapper the SVG renders flush against the link text with no gap and looks
// nothing like Carbon's reference example.
$icon_html = '';
if ( $icon_name !== '' ) {
	$svg = icon( $icon_name, 20 );
	if ( $svg !== '' ) {
		$icon_html = '<span class="' . esc_attr( $link_icon_class ) . '">' . $svg . '</span>';
	}
}

$attrs = html_attrs(
	array(
		'href'          => $href !== '' ? $href : '#',
		'target'        => $target,
		'rel'           => compute_rel( $target, $rel ),
		'aria-disabled' => $disabled ? 'true' : null,
	)
);

printf(
	'<a %1$s%2$s>%3$s%4$s</a>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value.
	wp_kses_post( $text ),
	$icon_html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
);
