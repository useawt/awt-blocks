<?php
/**
 * AWT Tag — server-rendered output.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\icon;
use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\compute_rel;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$text     = isset( $attributes['text'] ) ? (string) $attributes['text'] : __( 'Tag', 'awt-blocks' );
$tag_type = isset( $attributes['type'] ) ? (string) $attributes['type'] : 'gray';
$size     = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$filter   = ! empty( $attributes['filter'] );
$href     = isset( $attributes['href'] ) ? (string) $attributes['href'] : '';
$target   = isset( $attributes['target'] ) ? (string) $attributes['target'] : '';
$rel      = isset( $attributes['rel'] ) ? (string) $attributes['rel'] : '';

// A tag added from the inserter starts empty. Left that way it prints
// nothing: an empty chip says nothing, and a linked one is a link with no
// accessible name.
if ( \AWT\Blocks\Render\is_blank( $text ) ) {
	return;
}

$is_link = $href !== '';
// A linked tag renders as <a>; "dismissible" + link are mutually exclusive
// (no close <button> inside an anchor).
$filter = $filter && ! $is_link;

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$tag_root_class = $ds
	? $ds->classes_for(
		'tag',
		array(
			'type'   => $tag_type,
			'size'   => $size,
			'filter' => $filter,
		)
	)
	: implode( ' ', array_filter( array( 'cds--tag', 'cds--tag--' . $tag_type, 'cds--tag--' . $size, $filter ? 'cds--tag--filter' : '' ) ) );
if ( $is_link ) {
	$tag_root_class .= ' awt-tag--link';
}

$tag_label_class = $ds
	? $ds->classes_for( 'tag', array( 'element' => 'label' ) )
	: 'cds--tag__label';

$tag_close_class = $ds
	? $ds->classes_for( 'tag', array( 'element' => 'close-icon' ) )
	: 'cds--tag__close-icon';

// A label too long for the tag is cut off with an ellipsis, as in Carbon,
// and as in Carbon the full text stays reachable: every label carries it as
// a `title` for mouse users, and view.js wraps a cut-off label on a plain tag
// in Carbon's definition tooltip, a button that shows the full text, for
// keyboard and touch. Link and dismissible tags get the `title` only; Carbon
// treats interactive tags apart. Before, a cut-off label could not be read at
// all, and the WCAG text spacing overrides cut off "Accessible toilet, ground
// floor" (reported by the outside accessibility review, 2026-10-14).
//
// A filter tag's dismiss button hides the tag (view.js). It had no script
// and did nothing, and every one was named just "Dismiss"; it now names the
// tag it removes, "Dismiss Region: us-east" (reported by the outside
// accessibility review, 2026-10-15).
$wrapper_extra = array( 'class' => $tag_root_class );
if ( ! $is_link && ! $filter ) {
	$wrapper_extra['data-wp-interactive'] = 'awt/tag';
	$wrapper_extra['data-wp-init']        = 'callbacks.init';
}
if ( $filter ) {
	$wrapper_extra['data-wp-interactive']  = 'awt/tag';
	$wrapper_extra['data-wp-context']      = wp_json_encode( array( 'dismissed' => false ) );
	$wrapper_extra['data-wp-bind--hidden'] = 'context.dismissed';
}
$wrapper_attrs = get_block_wrapper_attributes( $wrapper_extra );
$label_title   = trim( html_entity_decode( wp_strip_all_tags( $text ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );

$dismiss = $filter
	? sprintf(
		'<button type="button" class="%1$s" aria-label="%2$s" data-wp-on--click="actions.dismiss">%3$s</button>',
		esc_attr( $tag_close_class ),
		// A tag with no text renders nothing, so there is always a label to name.
		/* translators: %s: the tag's label, for example "Region: us-east". */
		esc_attr( sprintf( __( 'Dismiss %s', 'awt-blocks' ), $label_title ) ),
		icon( 'close' )
	)
	: '';

$tag_name   = $is_link ? 'a' : 'span';
$link_attrs = $is_link
	? ' ' . html_attrs(
		array(
			'href'   => $href,
			'target' => $target !== '' ? $target : null,
			'rel'    => compute_rel( $target, $rel ),
		)
	)
	: '';

printf(
	'<%1$s %2$s%3$s><span class="%4$s" title="%7$s">%5$s</span>%6$s</%1$s>',
	$tag_name, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- constrained to 'a' or 'span' above.
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$link_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value.
	esc_attr( $tag_label_class ),
	wp_kses_post( $text ),
	$dismiss, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	esc_attr( $label_title )
);
