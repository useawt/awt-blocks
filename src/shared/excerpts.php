<?php
/**
 * Automatic excerpts for posts built with AWT blocks.
 *
 * WordPress builds an automatic excerpt by throwing away every block it does
 * not recognise, then trimming what is left. It knows only core blocks, so a
 * post whose text sits inside AWT layout blocks came out empty — the blog
 * listing showed a title with no summary under it.
 *
 * Layout blocks are registered as "wrapper" blocks: WordPress keeps looking
 * inside them for text instead of dropping them. Blocks that carry their own
 * text are allowed outright.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\Excerpts;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Layout blocks whose inner blocks hold the text.
 */
const WRAPPERS = array(
	'awt/section',
	'awt/inline-set',
	'awt/feature-grid',
	'awt/accordion',
	'awt/accordion-item',
	'awt/tabs',
	'awt/tab-panel',
	'awt/content-switcher',
	'awt/content-switcher-panel',
	'awt/tile',
	'awt/tile-group',
	'awt/pricing-tile',
	'awt/hero',
	'awt/modal',
	'awt/testimonial',
	'awt/notification',
);

/**
 * Blocks that render their own text from attributes.
 */
const ALLOWED = array(
	'awt/list',
	'awt/list-item',
	'awt/faq-item',
	'awt/stat',
	'awt/link',
);

add_filter(
	'excerpt_allowed_wrapper_blocks',
	static function ( $blocks ) {
		return array_merge( (array) $blocks, WRAPPERS );
	}
);

add_filter(
	'excerpt_allowed_blocks',
	static function ( $blocks ) {
		return array_merge( (array) $blocks, WRAPPERS, ALLOWED );
	}
);
