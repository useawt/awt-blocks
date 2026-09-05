<?php
/**
 * Wrapper for the Custom HTML block on the front end.
 *
 * The editor draws a `.wp-block-html` box around a Custom HTML block, but the
 * front end prints the markup with nothing around it. The theme's styling for
 * hand-written markup — form controls, tables, lists — keys on that class, so
 * on the front end it matched nothing and the markup rendered bare.
 *
 * The class is why the styling can be safe: it says "an author wrote this by
 * hand", so the rules never reach a control a block styled itself.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\CustomHtml;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter(
	'render_block_core/html',
	static function ( $content ) {
		$content = (string) $content;
		if ( '' === trim( $content ) ) {
			return $content;
		}
		return '<div class="wp-block-html">' . $content . '</div>';
	}
);
