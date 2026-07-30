<?php
/**
 * AWT Side nav link — server-rendered output.
 *
 * Inherits aria-current behavior from the shared current-URL matcher.
 *
 * A link with no icon now renders no icon. It used to emit the link's first
 * character as a stand-in, for rail mode to show while the label was clipped.
 * Rail mode has been removed (it never had a front end — see side-nav's
 * render.php), so the only thing left for that character to do was leak into
 * places where the label is visible anyway: the fallback was suppressed by
 * rules keyed to `.cds--side-nav--persistent` / `--expanded`, which stop
 * matching the moment the nav folds into the header menu on a narrow screen.
 * A single letter was never a usable icon either.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\CurrentUrl\matches_current;
use function AWT\Blocks\Render\icon;

$text       = isset( $attributes['text'] ) ? (string) $attributes['text'] : __( 'Link', 'awt' );
$href       = isset( $attributes['href'] ) ? (string) $attributes['href'] : '#';
$icon_name  = isset( $attributes['iconName'] ) ? (string) $attributes['iconName'] : '';
$is_current = ! empty( $attributes['isCurrent'] );
$match_mode = isset( $attributes['matchMode'] ) ? (string) $attributes['matchMode'] : 'exact';

$aria_current = ( $is_current || matches_current( $href, $match_mode ) ) ? 'page' : null;

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$item_class = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'item' ) ) : 'cds--side-nav__item';
$link_class = $ds ? $ds->classes_for(
	'side-nav',
	array(
		'element'   => 'link',
		'isCurrent' => (bool) $aria_current,
	)
) : ( 'cds--side-nav__link' . ( $aria_current ? ' cds--side-nav__link--current' : '' ) );
$icon_class = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'icon' ) ) : 'cds--side-nav__icon';
$text_class = $ds ? $ds->classes_for( 'side-nav', array( 'element' => 'link-text' ) ) : 'cds--side-nav__link-text';

$icon_html = '';
if ( $icon_name !== '' ) {
	$icon_html = icon( $icon_name );
	if ( $icon_html === '' ) {
		// Unknown icon name — render as label fallback so authoring stays visible.
		$icon_html = sprintf( '<span class="%s" aria-hidden="true">[%s]</span>', esc_attr( $icon_class ), esc_html( $icon_name ) );
	} else {
		$icon_html = '<span class="' . esc_attr( $icon_class ) . '">' . $icon_html . '</span>';
	}
}

$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $item_class ) );

$current_attr = $aria_current ? sprintf( ' aria-current="%s"', esc_attr( $aria_current ) ) : '';

printf(
	'<li %1$s><a class="%2$s" href="%3$s"%4$s>%5$s<span class="%6$s">%7$s</span></a></li>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	esc_attr( $link_class ),
	esc_url( $href ),
	$current_attr, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built with esc_attr() above.
	$icon_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	esc_attr( $text_class ),
	wp_kses_post( $text )
);
