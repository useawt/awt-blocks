<?php
/**
 * AWT Content switcher panel — content shown for the matching segment.
 *
 * Paired by ordinal with an awt/content-switcher-item. The parent's view store
 * toggles the `hidden` attribute and wires aria-labelledby at boot. The wrapper
 * class is AWT-native (`awt-content-switcher__panel`) — Carbon's content
 * switcher has no panel container of its own, so there's nothing to route
 * through the design system here.
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

$panel_id = unique_id( 'awt-cs-panel' );

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'    => 'awt-content-switcher__panel',
		'id'       => $panel_id,
		'role'     => 'tabpanel',
		'tabindex' => '0',
		'hidden'   => true,
	)
);

printf( '<div %1$s>%2$s</div>', $wrapper_attrs, $content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; inner-block markup, escaped by each inner block on render.
