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

$text     = isset( $attributes['text'] ) ? (string) $attributes['text'] : __( 'Tag', 'awt' );
$tag_type = isset( $attributes['type'] ) ? (string) $attributes['type'] : 'gray';
$size     = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$filter   = ! empty( $attributes['filter'] );
$href     = isset( $attributes['href'] ) ? (string) $attributes['href'] : '';
$target   = isset( $attributes['target'] ) ? (string) $attributes['target'] : '';
$rel      = isset( $attributes['rel'] ) ? (string) $attributes['rel'] : '';

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

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $tag_root_class ) );

$dismiss = $filter
	? sprintf(
		'<button type="button" class="%1$s" aria-label="%2$s">%3$s</button>',
		esc_attr( $tag_close_class ),
		esc_attr__( 'Dismiss', 'awt' ),
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
	'<%1$s %2$s%3$s><span class="%4$s">%5$s</span>%6$s</%1$s>',
	$tag_name, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- constrained to 'a' or 'span' above.
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$link_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value.
	esc_attr( $tag_label_class ),
	wp_kses_post( $text ),
	$dismiss // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
);
