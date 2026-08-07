<?php
/**
 * AWT Tile group — server-rendered output.
 *
 * A `<fieldset>` with a `<legend>` around selectable tiles. That is the whole
 * job, and it is worth a block because nothing else can do it: a screen reader
 * announces "group, <legend>" on entering, so the visitor hears WHAT they are
 * choosing before hearing the choices. Grouped tiles rendered without this were
 * announced as radio buttons belonging to nothing.
 *
 * `<fieldset>` + `<legend>` rather than `role="group"` + `aria-label` (Carbon's
 * choice for its multi-select story): the legend is visible, so the heading
 * helps everyone rather than only screen-reader users, and it needs no
 * translation of an invisible string.
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$label = isset( $attributes['label'] ) ? (string) $attributes['label'] : '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$group_class = $ds ? $ds->classes_for( 'tile', array( 'element' => 'group' ) ) : 'cds--tile-group';
$label_class = $ds ? $ds->classes_for( 'tile', array( 'element' => 'group-label' ) ) : 'cds--label';

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $group_class ) );

printf(
	'<fieldset %1$s>%2$s%3$s</fieldset>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$label !== ''
		? sprintf( '<legend class="%1$s">%2$s</legend>', esc_attr( $label_class ), esc_html( $label ) )
		: '',
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
