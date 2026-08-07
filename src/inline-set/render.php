<?php
/**
 * AWT Inline set.
 *
 * Carbon-style inline-flow container — wraps button/tag/icon/link siblings with
 * a consistent gap via flexbox. Equivalent in role to Carbon's `cds--button-set`
 * but generic over the inline children we ship. The wrapper owns the spacing so
 * authors don't have to pad each child manually, and editor + front-end match
 * because both render the same flex container.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\classnames;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$orientation = isset( $attributes['orientation'] ) ? (string) $attributes['orientation'] : 'horizontal';
$gap         = isset( $attributes['gap'] ) ? (string) $attributes['gap'] : 'md';
$align       = isset( $attributes['align'] ) ? (string) $attributes['align'] : 'start';
$wrap        = ! isset( $attributes['wrap'] ) || ! empty( $attributes['wrap'] );

$modifiers = array(
	$orientation,
	'gap-' . $gap,
	'align-' . $align,
	$wrap ? 'wrap' : 'nowrap',
);

$class = classnames( 'awt-inline-set', $modifiers, (string) ( $attributes['className'] ?? '' ) );
$attrs = get_block_wrapper_attributes( array( 'class' => $class ) );

echo '<div ' . $attrs . '>' . $content . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $attrs and $content come from core, $class composed from safe sources.
