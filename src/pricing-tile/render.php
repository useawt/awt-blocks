<?php
/**
 * AWT Pricing tile — server-rendered output.
 *
 * Edition selector tile modelled on Carbon's bx--tile--selectable pattern
 * (ibm.com/products/.../pricing). Carries tier name + optional price +
 * description + CTA. NO embedded feature list — feature comparison lives
 * in a separate awt/data-table below (with cellType: 'boolean' columns).
 *
 * The SaaS-style card-with-features variant (awt/pricing-card) is in
 * AWT Premium.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tier_name    = isset( $attributes['tierName'] ) ? (string) $attributes['tierName'] : '';
$price        = isset( $attributes['price'] ) ? (string) $attributes['price'] : '';
$price_period = isset( $attributes['pricePeriod'] ) ? (string) $attributes['pricePeriod'] : '';
$description  = isset( $attributes['description'] ) ? (string) $attributes['description'] : '';
$cta_text     = isset( $attributes['ctaText'] ) ? (string) $attributes['ctaText'] : '';
$cta_href     = isset( $attributes['ctaHref'] ) ? (string) $attributes['ctaHref'] : '#';
$cta_kind     = isset( $attributes['ctaKind'] ) ? (string) $attributes['ctaKind'] : 'primary';
$featured     = ! empty( $attributes['featured'] );
$badge        = isset( $attributes['badge'] ) ? (string) $attributes['badge'] : '';
$selectable   = ! empty( $attributes['selectable'] );

$valid_cta_kinds = array( 'primary', 'secondary', 'tertiary', 'ghost' );
if ( ! in_array( $cta_kind, $valid_cta_kinds, true ) ) {
	$cta_kind = 'primary';
}

$classes = array( 'awt-pricing-tile' );
if ( $featured ) {
	$classes[] = 'awt-pricing-tile--featured';
}
if ( $selectable ) {
	$classes[] = 'awt-pricing-tile--selectable';
}

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => implode( ' ', $classes ),
	)
);

$badge_html        = $badge !== '' ? sprintf( '<div class="awt-pricing-tile__badge">%s</div>', esc_html( $badge ) ) : '';
$tier_html         = $tier_name !== '' ? sprintf( '<h3 class="awt-pricing-tile__tier-name">%s</h3>', esc_html( $tier_name ) ) : '';
$price_html        = $price !== '' ? sprintf( '<span class="awt-pricing-tile__price">%s</span>', esc_html( $price ) ) : '';
$price_period_html = $price_period !== '' ? sprintf( '<span class="awt-pricing-tile__price-period">%s</span>', esc_html( $price_period ) ) : '';
$description_html  = $description !== '' ? sprintf( '<p class="awt-pricing-tile__description">%s</p>', wp_kses_post( $description ) ) : '';

// §A: pricing-tile is an AWT-native composite — its shell stays native, but the CTA
// IS a Carbon button, so it routes its classes through the active design system's
// `button` resolver (same call awt/button makes) instead of hardcoding `cds--*`.
// The resolver emits BOTH a kind modifier (--primary / --secondary / …) AND a size
// modifier (--lg) plus the layout-size class — without the size modifier Carbon's
// typography rules don't anchor and a primary button renders blue-on-blue. If the
// resolver returns '' for `button` (e.g. no AWT theme active), the CTA falls
// back to a native anchor (only this sub-element degrades, not the whole tile).
$ds            = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;
$cta_btn_class = $ds
	? $ds->classes_for(
		'button',
		array(
			'kind' => $cta_kind,
			'size' => 'lg',
		)
	)
	: 'cds--btn cds--btn--' . $cta_kind . ' cds--btn--lg cds--layout--size-lg';

$cta_html = $cta_text !== '' ? sprintf(
	'<a class="%1$s" href="%2$s"><span>%3$s</span></a>',
	esc_attr( trim( $cta_btn_class . ' awt-pricing-tile__cta' ) ),
	esc_url( $cta_href ),
	esc_html( $cta_text )
) : '';

$price_row_html = '';
if ( $price_html !== '' || $price_period_html !== '' ) {
	$price_row_html = sprintf(
		'<div class="awt-pricing-tile__price-row">%s%s</div>',
		$price_html,
		$price_period_html
	);
}

printf(
	'<div %1$s>%2$s%3$s%4$s%5$s%6$s</div>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$badge_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$tier_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$price_row_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$description_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$cta_html // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
);
