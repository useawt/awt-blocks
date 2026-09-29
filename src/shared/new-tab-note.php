<?php
/**
 * Tell screen reader users when a link opens a new tab.
 *
 * Button, Link, Footer link, Tag and Testimonial can each open their link in
 * a new tab. Sighted users may get a launch icon; the icon is decorative, so a
 * screen reader user got nothing and found out only when Back stopped working.
 * WCAG technique G201 asks for a warning, and an accessibility product should
 * give one.
 *
 * Every link these blocks print with `target="_blank"` gains the words
 * "(opens in a new tab)":
 *   - as visually hidden text inside the link, which joins its accessible name;
 *   - or appended to its aria-label, when it has one, since an aria-label
 *     replaces the text content as the name and the hidden text would be lost.
 * A link named by aria-labelledby is left alone: its name lives in another
 * element, which this cannot safely change.
 *
 * Done once, on the rendered output, rather than in five render.php files, so
 * the wording and the rules stay the same everywhere. It runs after the
 * Accessibility panel's filter (priority 11), which is what writes a block's
 * aria-label. All five blocks are leaves, so the output holds only the block's
 * own links, never an author's links from inner blocks.
 *
 * The string is the same one updates.php uses for the plugin author link, so
 * it is translated once.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\NewTabNote;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const BLOCKS = array( 'awt/button', 'awt/link', 'awt/footer-link', 'awt/tag', 'awt/testimonial' );

/**
 * Add the note to every new-tab link in a block's output.
 *
 * @param string $html Rendered block HTML.
 * @return string The HTML with each new-tab link announced.
 */
function add_note( string $html ): string {
	if ( stripos( $html, '_blank' ) === false ) {
		return $html;
	}
	$note = __( '(opens in a new tab)', 'awt-blocks' );
	return (string) preg_replace_callback(
		'/<a\b([^>]*)>(.*?)<\/a>/is',
		static function ( array $m ) use ( $note ): string {
			$attrs = $m[1];
			if ( ! preg_match( '/\starget=(["\'])_blank\1/i', $attrs ) || preg_match( '/\saria-labelledby=/i', $attrs ) ) {
				return $m[0];
			}
			if ( preg_match( '/\saria-label=(["\'])(.*?)\1/is', $attrs, $label ) ) {
				if ( str_contains( $label[2], esc_attr( $note ) ) ) {
					return $m[0];
				}
				$named = str_replace( $label[0], ' aria-label=' . $label[1] . $label[2] . ' ' . esc_attr( $note ) . $label[1], $attrs );
				return '<a' . $named . '>' . $m[2] . '</a>';
			}
			if ( str_contains( $m[2], 'awt-new-tab-note' ) ) {
				return $m[0];
			}
			return '<a' . $attrs . '>' . $m[2] . '<span class="cds--visually-hidden awt-new-tab-note"> ' . esc_html( $note ) . '</span></a>';
		},
		$html
	);
}

add_filter(
	'render_block',
	static function ( string $content, array $block ): string {
		if ( ! in_array( $block['blockName'] ?? '', BLOCKS, true ) ) {
			return $content;
		}
		return add_note( $content );
	},
	12,
	2
);
