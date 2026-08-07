<?php
/**
 * AWT Button — server-rendered output.
 *
 * Matches Carbon's React Button component HTML class grammar exactly. Renders
 * <button> when no href is set (type="button", or type="submit" via the block's
 * type attribute), <a> otherwise (per spec: never a div with click handlers).
 * The type attribute is never emitted on the <a> form.
 *
 * @var array    $attributes Block attributes (text, kind, size, href, etc.).
 * @var string   $content    Inner block content (unused — Button has no inner blocks).
 * @var WP_Block $block      Block instance (unused).
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

$text          = isset( $attributes['text'] ) ? (string) $attributes['text'] : __( 'Button', 'awt' );
$kind          = isset( $attributes['kind'] ) ? (string) $attributes['kind'] : 'primary';
$size          = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'lg';
$btn_type      = isset( $attributes['type'] ) && $attributes['type'] === 'submit' ? 'submit' : 'button';
$href          = isset( $attributes['href'] ) ? (string) $attributes['href'] : '';
$target        = isset( $attributes['target'] ) ? (string) $attributes['target'] : '';
$rel           = isset( $attributes['rel'] ) ? (string) $attributes['rel'] : '';
$disabled      = ! empty( $attributes['disabled'] );
$icon_name     = isset( $attributes['iconName'] ) ? (string) $attributes['iconName'] : '';
$icon_position = isset( $attributes['iconPosition'] ) ? (string) $attributes['iconPosition'] : 'trailing';
$expressive    = ! empty( $attributes['isExpressive'] );

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$modifiers = array(
	$kind,
	$size,
	$expressive ? 'expressive' : '',
	$icon_name !== '' ? 'icon-only' : '',
);
$modifiers = array_values( array_filter( $modifiers, static fn( $m ) => $m !== '' ) );
// Carbon doesn't actually use --icon-only unless text is empty; remove it when text is present.
if ( $text !== '' ) {
	$modifiers = array_values( array_filter( $modifiers, static fn( $m ) => $m !== 'icon-only' ) );
}

// Carbon's button height is driven by the `--cds-layout-size-height` CSS
// variable, NOT by the `cds--btn--{size}` modifier class (which only handles
// peripheral details like border-radius on the badge variant). The variable
// is set on the element via the `cds--layout--size-{size}` utility class
// (e.g. `cds--layout--size-md` → `--cds-layout-size-height-md` → 2.5rem).
// Without this class, every button defaults to the lg (3rem) baseline
// regardless of the size prop. @carbon/react sets this class internally;
// we have to mirror that behavior here.
$layout_size_class = in_array( $size, array( 'xs', 'sm', 'md', 'lg', 'xl', '2xl' ), true )
	? 'cds--layout--size-' . $size
	: '';

$btn_root_class = $ds
	? $ds->classes_for(
		'button',
		array(
			'kind'       => $kind,
			'size'       => $size,
			'expressive' => $expressive,
			'icon_only'  => ( $icon_name !== '' && $text === '' ),
		)
	)
	: classnames( 'cds--btn', $modifiers, $layout_size_class );

$btn_icon_class = $ds
	? $ds->classes_for( 'button', array( 'element' => 'icon' ) )
	: 'cds--btn__icon';

// get_block_wrapper_attributes() already merges the block's className; the
// resolved root class is the complete Carbon (or active-system) class string.
$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $btn_root_class ) );

// Carbon's `.cds--btn__icon` class supplies the 0.5rem margin-inline-start
// that puts a gap between label and icon. Without it the icon renders flush
// against the label text (because `.cds--btn { justify-content: space-between }`
// only works when there's at least a margin between the flex children to
// separate them visually from the label edge).
$icon_html = $icon_name !== '' ? icon( $icon_name, 16, $btn_icon_class ) : '';

$inner = sprintf( '<span>%s</span>', wp_kses_post( $text ) );
if ( $icon_html !== '' ) {
	$inner = $icon_position === 'leading'
		? $icon_html . $inner
		: $inner . $icon_html;
}

if ( $href !== '' ) {
	$attrs = html_attrs(
		array(
			'href'          => $href,
			'target'        => $target,
			'rel'           => compute_rel( $target, $rel ),
			'aria-disabled' => $disabled ? 'true' : null,
		)
	);
	printf(
		'<a %1$s%2$s>%3$s</a>',
		$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
		$attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value.
		$inner // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	);
	return;
}

$attrs = html_attrs(
	array(
		'type'     => $btn_type,
		'disabled' => $disabled,
	)
);
printf(
	'<button %1$s%2$s>%3$s</button>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value.
	$inner // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
);
