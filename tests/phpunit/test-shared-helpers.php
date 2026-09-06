<?php
/**
 * Tests for the shared render/URL/schema helpers in src/shared/.
 *
 * @package AWT\Blocks
 */

use function AWT\Blocks\CurrentUrl\normalize;
use function AWT\Blocks\CurrentUrl\matches_current;
use function AWT\Blocks\CurrentUrl\only_most_specific_current;
use function AWT\Blocks\FaqSchema\slugify_question;
use function AWT\Blocks\Render\icon;
use function AWT\Blocks\Render\compute_rel;
use function AWT\Blocks\Render\classnames;

/**
 * Shared helper behavior.
 */
class Test_Shared_Helpers extends WP_UnitTestCase {

	/**
	 * URL normalization: trailing slashes stripped (root kept), case folded,
	 * external hosts passed through untouched.
	 */
	public function test_normalize_url_comparison_form() {
		$this->assertSame( '/about', normalize( '/about/' ) );
		$this->assertSame( '/', normalize( '/' ) );
		$this->assertSame( '/about', normalize( '/About' ) );
		$this->assertSame( '', normalize( '' ) );
		$this->assertSame( 'https://other.example/x', normalize( 'https://other.example/x' ) );
	}

	/**
	 * Placeholder hrefs never match the current URL.
	 */
	public function test_placeholder_hrefs_never_match() {
		$this->assertFalse( matches_current( '#' ) );
		$this->assertFalse( matches_current( '' ) );
		$this->assertFalse( matches_current( '#section' ) );
	}

	/**
	 * FAQ anchors: slugified, never empty.
	 */
	public function test_slugify_question() {
		// Use a question no snapshot fixture contains: the anchor registry
		// dedups per-process, so consuming a fixture's question here would
		// shift that fixture's anchor to '-2' in the snapshot suite.
		$this->assertSame( 'faq-does-the-helper-suite-pollute-anchors', slugify_question( 'Does the helper suite pollute anchors?' ) );
		// Unsluggable questions fall back to 'faq', then get the same
		// 'faq-' prefix as every anchor — hence the doubled 'faq-faq'.
		$this->assertSame( 'faq-faq', slugify_question( '???' ) );
		$this->assertNotSame( '', slugify_question( '!!!' ) );
	}

	/**
	 * Carbon icons render as decorative inline SVG: aria-hidden, unfocusable,
	 * sized as requested; unknown names produce a safe fallback (no fatal).
	 */
	public function test_icon_renders_decorative_svg() {
		$svg = icon( 'arrow--right', 16 );
		if ( '' === $svg || false === strpos( $svg, '<svg' ) ) {
			$this->markTestSkipped( 'Carbon icon SVGs not present in this environment (node_modules not mounted).' );
		}
		$this->assertStringContainsString( 'aria-hidden="true"', $svg );
		$this->assertStringContainsString( 'focusable="false"', $svg );

		$unknown = icon( 'no-such-icon-name' );
		$this->assertIsString( $unknown );
		$this->assertStringNotContainsString( '<script', $unknown );
	}

	/**
	 * Rel computation: target=_blank defaults to noopener noreferrer; an
	 * author-supplied rel wins verbatim (browsers imply noopener for _blank).
	 */
	public function test_compute_rel_for_new_tab_links() {
		$this->assertSame( 'noopener noreferrer', compute_rel( '_blank', '' ) );
		$this->assertSame( 'nofollow', compute_rel( '_blank', 'nofollow' ) );
		$this->assertSame( '', compute_rel( '', '' ) );
	}

	/**
	 * One current page per navigation: an ancestor loses the mark.
	 *
	 * A parent item matching on prefix stays marked while the reader is under
	 * it, so on the child's own page both claimed to be the current page and a
	 * screen reader announced two.
	 */
	public function test_only_the_deepest_current_item_keeps_the_mark() {
		$html = '<li><a href="/features/automatic/" aria-current="page">Automatic</a></li>'
			. '<li><a href="/features/automatic/websites/" aria-current="page">Websites</a></li>';

		$out = only_most_specific_current( $html );

		$this->assertStringNotContainsString( '/features/automatic/" aria-current="page"', $out );
		$this->assertStringContainsString( '/features/automatic/websites/" aria-current="page"', $out );
		$this->assertSame( 1, substr_count( $out, 'aria-current="page"' ) );
	}

	/**
	 * A section item stays marked on a page that has no item of its own.
	 */
	public function test_a_lone_current_item_is_left_alone() {
		$html = '<li><a href="/features/automatic/" aria-current="page">Automatic</a></li>'
			. '<li><a href="/features/manual/">Manual</a></li>';

		$this->assertSame( $html, only_most_specific_current( $html ) );
	}

	/**
	 * Two current items that are not on the same trail are both kept: nothing
	 * here can tell which the author meant.
	 */
	public function test_unrelated_current_items_are_both_kept() {
		$html = '<li><a href="/features/automatic/" aria-current="page">Automatic</a></li>'
			. '<li><a href="/pricing/" aria-current="page">Pricing</a></li>';

		$this->assertSame( 2, substr_count( only_most_specific_current( $html ), 'aria-current="page"' ) );
	}

	/**
	 * Classnames: base + modifiers + extra, no stray whitespace.
	 */
	public function test_classnames_composition() {
		$this->assertSame( 'cds--tag', classnames( 'cds--tag' ) );
		$this->assertSame(
			'cds--tag cds--tag--red cds--tag--md extra',
			classnames( 'cds--tag', array( 'red', 'md' ), 'extra' )
		);
	}
}
