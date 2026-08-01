<?php
/**
 * AWT FAQ item — server-rendered output.
 *
 * Renders the same Carbon accordion-item HTML as awt/accordion-item (disclosure
 * button + content panel with aria-expanded / aria-controls / role="region"),
 * reusing the existing `awt/accordion-item` Interactivity store for the toggle.
 *
 * Two things this block does that plain accordion-item does NOT:
 *   1. Wraps the trigger button in a real semantic heading (default <h3>) so
 *      screen-reader users can navigate by heading and the structure mirrors
 *      what schema.org FAQPage rich-result eligibility expects.
 *   2. Registers itself with the request-scoped FAQ schema collector. The
 *      collector emits a single FAQPage JSON-LD blob on wp_footer covering
 *      every awt/faq-item on the page (Google rich-result SEO).
 *
 * @var array    $attributes
 * @var string   $content   Rendered inner blocks (the answer body).
 * @var WP_Block $block     Used for its context — see the root-tag choice below.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\FaqSchema\register as register_faq;
use function AWT\Blocks\FaqSchema\plain_text_from_html;
use function AWT\Blocks\FaqSchema\slugify_question;

$question         = isset( $attributes['question'] ) ? (string) $attributes['question'] : '';
$answer_override  = isset( $attributes['answer'] ) ? (string) $attributes['answer'] : '';
$default_expanded = ! empty( $attributes['defaultExpanded'] );
$level            = isset( $attributes['level'] ) ? (string) $attributes['level'] : '3';
$anchor_attr      = isset( $attributes['anchor'] ) ? (string) $attributes['anchor'] : '';

// Constrain level to 2..6.
if ( ! in_array( $level, array( '2', '3', '4', '5', '6' ), true ) ) {
	$level = '3';
}
$heading_tag = 'h' . $level;

// Anchor: author override wins, otherwise auto-slug from the question.
$anchor = $anchor_attr !== '' ? $anchor_attr : slugify_question( $question );

// Answer plain-text: explicit override wins, otherwise extract from the
// rendered inner blocks. Empty string falls through silently.
$plain_answer = $answer_override !== ''
	? $answer_override
	: plain_text_from_html( $content );

// Register with the FAQ schema collector — one entry per render.
register_faq( $question, $anchor, $plain_answer );

$panel_id  = unique_id( 'awt-faq-panel' );
$button_id = unique_id( 'awt-faq-button' );

// §A: faq-item is a specialized Carbon accordion-item, so it routes its accordion
// classes through the design system's resolver (slug `accordion`, the same one
// awt/accordion-item uses) instead of hardcoding `cds--*`. If the resolver
// returns '' (e.g. no AWT theme active), DOM + ARIA stay intact, unstyled.
// The awt-faq-item* hooks are always present for our own overrides.
$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$item_class    = $ds
	? $ds->classes_for(
		'accordion',
		array(
			'element'         => 'item',
			'defaultExpanded' => $default_expanded,
		)
	)
	: ( 'cds--accordion__item' . ( $default_expanded ? ' cds--accordion__item--active' : '' ) );
$heading_class = $ds ? $ds->classes_for( 'accordion', array( 'element' => 'heading' ) ) : 'cds--accordion__heading';
$title_class   = $ds ? $ds->classes_for( 'accordion', array( 'element' => 'title' ) ) : 'cds--accordion__title';
$content_class = $ds ? $ds->classes_for( 'accordion', array( 'element' => 'content' ) ) : 'cds--accordion__content';
$arrow_class   = $ds ? $ds->classes_for( 'accordion', array( 'element' => 'arrow' ) ) : 'cds--accordion__arrow';

$wrapper_class      = trim( $item_class . ' awt-faq-item' );
$heading_attr_class = trim( $heading_class . ' awt-faq-item__trigger' );
$title_attr_class   = trim( $title_class . ' awt-faq-item__question' );
$content_attr_class = trim( $content_class . ' awt-faq-item__answer' );

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => $wrapper_class,
		'id'    => $anchor,
	)
);

// Carbon's `.cds--accordion__arrow` is meant to be an SVG directly so its CSS
// (fill + transform: rotate(-270deg) idle / rotate(-90deg) active) lands on
// the right element.
$arrow_svg = '<svg class="' . esc_attr( $arrow_class ) . '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" focusable="false" aria-hidden="true">'
	. '<path d="M11 8L6 13l-.7-.7L9.6 8 5.3 3.7 6 3z"/>'
	. '</svg>';

// Root tag depends on where the block sits. Inside awt/accordion the parent
// renders a <ul>, which may only contain <li> directly — so <li> it is, matching
// awt/accordion-item and Carbon's own accordion markup. But this block carries no
// `parent` restriction, so it is equally valid on its own, and a lone <li> with no
// list around it is itself an invalid list structure (WCAG 1.3.1). Standalone
// therefore renders a <div>; Carbon styles `.cds--accordion__item` by class, so
// the two look identical. Detected via the context awt/accordion provides —
// absent means no accordion ancestor. Found by the axe gate, 2026-08-01.
$in_accordion = isset( $block->context['awt/accordion/size'] );
$root_tag     = $in_accordion ? 'li' : 'div';

printf(
	'<' . $root_tag . ' %1$s>' // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- literal 'li' or 'div' chosen above.
	. '<%2$s class="awt-faq-item__question-heading" style="margin:0;">'
	. '<button id="%3$s" type="button" class="' . esc_attr( $heading_attr_class ) . '" aria-expanded="%4$s" aria-controls="%5$s"'
	. ' data-wp-interactive="awt/accordion-item" data-wp-on--click="actions.toggle">'
	. '%6$s'
	. '<span class="' . esc_attr( $title_attr_class ) . '">%7$s</span>'
	. '</button>'
	. '</%2$s>'
	. '<div id="%5$s" class="' . esc_attr( $content_attr_class ) . '" role="region" aria-labelledby="%3$s"%8$s>%9$s</div>'
	. '</' . $root_tag . '>', // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- literal 'li' or 'div' chosen above.
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	tag_escape( $heading_tag ),
	esc_attr( $button_id ),
	$default_expanded ? 'true' : 'false',
	esc_attr( $panel_id ),
	$arrow_svg, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above.
	wp_kses_post( $question ),
	$default_expanded ? '' : ' hidden',
	$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render.
);
