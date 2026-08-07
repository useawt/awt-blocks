<?php
/**
 * FAQ schema collector — aggregates awt/faq-item instances per request and
 * emits a single FAQPage JSON-LD blob in <head> on wp_footer. Google's rich
 * result requirements: one FAQPage per page, each Question + acceptedAnswer
 * inside the mainEntity array.
 *
 * Each awt/faq-item render.php pushes onto AWT\Blocks\FaqSchema\register().
 * The wp_footer hook reads the request-scoped state, builds the JSON-LD, and
 * outputs it once at the end of the page.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\FaqSchema;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Free/Premium boundary for FAQ structured data.
 *
 * FAQ Page JSON-LD output (Google rich-result structured data) is an AWT
 * Premium capability. The collector code below ships in the free plugin but is
 * DORMANT: this gate defaults to false, so the free tier registers nothing and
 * emits no JSON-LD. AWT Premium re-enables the whole feature with one line and
 * no forked code:
 *
 *     add_filter( 'awt_faq_schema_enabled', '__return_true' );
 *
 * Keeping the implementation here (rather than deleting it) is deliberate — it
 * is the shared base AWT Premium builds on instead of forking. The
 * awt/faq-item block itself stays free (it's still an accessible
 * disclosure/accordion); only the structured-data output is gated.
 *
 * @return bool
 */
function is_enabled(): bool {
	return (bool) \apply_filters( 'awt_faq_schema_enabled', false );
}

/**
 * Request-scoped FAQ item store. Reset per request implicitly via PHP's
 * static-variable lifecycle.
 *
 * @return array<int, array{question:string, anchor:string, answer:string}>
 */
function &items(): array {
	static $items = array();
	return $items;
}

/**
 * Register one FAQ item from its render.php. Called once per awt/faq-item
 * server-rendered instance on the page.
 *
 * @param string $question Question text. Goes to Question.name.
 * @param string $anchor   Slug used as the question's @id (DOM id + URL fragment).
 * @param string $answer   Plain-text answer. Goes to acceptedAnswer.text.
 */
function register( string $question, string $anchor, string $answer ): void {
	if ( ! is_enabled() ) {
		// Premium-gated: free tier collects nothing.
		return;
	}
	if ( $question === '' ) {
		// FAQ items without a question can't form valid structured data.
		return;
	}
	$items_ref   =& items();
	$items_ref[] = array(
		'question' => $question,
		'anchor'   => $anchor,
		'answer'   => $answer,
	);
}

/**
 * Emit the aggregated FAQPage JSON-LD on wp_footer.
 *
 * Skips emission when:
 *  - No items registered (no FAQ on the page).
 *  - Inside the block-editor admin context (the editor doesn't render with
 *    real templates anyway).
 */
function emit_json_ld(): void {
	if ( ! is_enabled() ) {
		// Premium-gated (defensive — register() already no-ops when disabled).
		return;
	}
	$items_ref = items();
	if ( empty( $items_ref ) ) {
		return;
	}
	if ( is_admin() ) {
		return;
	}

	$main_entity = array();
	foreach ( $items_ref as $item ) {
		$entry = array(
			'@type' => 'Question',
			'name'  => $item['question'],
		);
		if ( $item['anchor'] !== '' ) {
			$entry['@id'] = '#' . $item['anchor'];
		}
		if ( $item['answer'] !== '' ) {
			$entry['acceptedAnswer'] = array(
				'@type' => 'Answer',
				'text'  => $item['answer'],
			);
		}
		$main_entity[] = $entry;
	}

	$json = array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => $main_entity,
	);

	// JSON_HEX_TAG encodes the < and > characters as \u003C / \u003E so question
	// or answer text can never break out of the script element (e.g. a literal
	// closing script tag inside a question).
	$encoded = wp_json_encode( $json, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
	if ( $encoded === false ) {
		return;
	}

	printf(
		'<script type="application/ld+json" id="awt-faq-schema">%s</script>',
		$encoded // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode() output with JSON_HEX_TAG inside a JSON-LD script tag.
	);
}

\add_action( 'wp_footer', __NAMESPACE__ . '\\emit_json_ld' );

/**
 * Extract plain text from a block's serialized inner content for the JSON-LD
 * acceptedAnswer.text fallback. Strips HTML tags and collapses whitespace.
 *
 * @param string $rendered_inner_html The block's $content (already rendered).
 * @return string
 */
function plain_text_from_html( string $rendered_inner_html ): string {
	if ( $rendered_inner_html === '' ) {
		return '';
	}
	// Strip tags and decode entities so " is restored.
	$text = wp_strip_all_tags( $rendered_inner_html );
	$text = html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	// Collapse all whitespace runs into single spaces.
	$text = trim( preg_replace( '/\s+/', ' ', $text ) ?? '' );
	return $text;
}

/**
 * Build a URL-safe slug from a question string. Used when an FAQ item's
 * anchor attribute is empty.
 *
 * Deduplication across multiple items with the same question text is done
 * naively by appending `-2`, `-3`, etc. for repeats.
 *
 * @param string $question The FAQ question text.
 * @return string
 */
function slugify_question( string $question ): string {
	$slug = sanitize_title_with_dashes( $question, '', 'save' );
	if ( $slug === '' ) {
		$slug = 'faq';
	}
	// Deduplicate per request.
	static $used = array();
	$base        = $slug;
	$i           = 2;
	while ( in_array( $slug, $used, true ) ) {
		$slug = $base . '-' . $i;
		++$i;
	}
	$used[] = $slug;
	return 'faq-' . $slug;
}
