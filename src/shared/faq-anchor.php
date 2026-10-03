<?php
/**
 * FAQ item anchors — the id each question carries, so a link can point
 * straight at it (`/faq/#faq-how-do-i-update`).
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\Faq;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
