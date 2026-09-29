<?php
/**
 * A link that opens a new tab says so, and an empty Header navigation
 * renders nothing.
 *
 * Both found on awtpremium.com, 2026-09-29: a "See AWT free" button opening
 * useawt.com in a new tab gave a screen reader no warning, and a Header
 * navigation with every item removed still printed a "Primary" landmark and,
 * on small screens, an "Open menu" button over an empty list.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the new-tab note and the empty navigation.
 */
class Test_New_Tab_Note extends WP_UnitTestCase {

	const NOTE = '(opens in a new tab)';

	/**
	 * Every block that can open its link in a new tab.
	 *
	 * @return array[] Data-provider shape: [ block markup ].
	 */
	public function new_tab_blocks(): array {
		return array(
			'button'      => array( '<!-- wp:awt/button {"text":"Go","href":"/x","target":"_blank"} /-->' ),
			'link'        => array( '<!-- wp:awt/link {"text":"Go","href":"/x","target":"_blank"} /-->' ),
			'footer link' => array( '<!-- wp:awt/footer-link {"text":"Go","href":"/x","external":true} /-->' ),
			'tag'         => array( '<!-- wp:awt/tag {"text":"Go","href":"/x","target":"_blank"} /-->' ),
			'testimonial' => array( '<!-- wp:awt/testimonial {"quote":"Q","authorName":"A","href":"/x","linkText":"Go","target":"_blank"} /-->' ),
		);
	}

	/**
	 * The note is inside the link, hidden visually, and there once.
	 *
	 * @dataProvider new_tab_blocks
	 *
	 * @param string $markup Block markup.
	 */
	public function test_new_tab_link_carries_the_note_once( string $markup ) {
		$html = do_blocks( $markup );
		$this->assertMatchesRegularExpression( '/<a\b[^>]*target="_blank"[^>]*>.*<span class="cds--visually-hidden awt-new-tab-note"> \(opens in a new tab\)<\/span><\/a>/s', $html );
		$this->assertSame( 1, substr_count( $html, self::NOTE ) );
	}

	/**
	 * A block nested in another AWT block is not announced twice.
	 */
	public function test_nested_block_is_announced_once() {
		$html = do_blocks( '<!-- wp:awt/section --><!-- wp:awt/button {"text":"Go","href":"/x","target":"_blank"} /--><!-- /wp:awt/section -->' );
		$this->assertSame( 1, substr_count( $html, self::NOTE ) );
	}

	/**
	 * A link that opens in the same tab gets no note.
	 */
	public function test_same_tab_link_has_no_note() {
		$html = do_blocks( '<!-- wp:awt/button {"text":"Go","href":"/x"} /--><!-- wp:awt/link {"text":"Go","href":"/x"} /--><!-- wp:awt/footer-link {"text":"Go","href":"/x"} /-->' );
		$this->assertStringNotContainsString( self::NOTE, $html );
	}

	/**
	 * With an aria-label, the note joins the label, since hidden text would
	 * not reach the accessible name.
	 */
	public function test_aria_label_gains_the_note() {
		$html = do_blocks( '<!-- wp:awt/button {"href":"/x","target":"_blank","iconName":"launch","ariaLabel":"Open the demo"} /-->' );
		$this->assertStringContainsString( 'aria-label="Open the demo ' . self::NOTE . '"', $html );
		$this->assertStringNotContainsString( 'awt-new-tab-note', $html );
		$this->assertSame( 1, substr_count( $html, self::NOTE ) );
	}

	/**
	 * A link named by aria-labelledby is left as it is.
	 */
	public function test_aria_labelledby_is_left_alone() {
		$html = do_blocks( '<!-- wp:awt/button {"text":"Go","href":"/x","target":"_blank","ariaLabelledby":"elsewhere"} /-->' );
		$this->assertStringNotContainsString( self::NOTE, $html );
	}

	/**
	 * A Header navigation with no items prints nothing at all.
	 */
	public function test_empty_header_nav_renders_nothing() {
		$this->assertSame( '', trim( do_blocks( '<!-- wp:awt/header-nav /-->' ) ) );
		$this->assertSame( '', trim( do_blocks( '<!-- wp:awt/header-nav --><!-- /wp:awt/header-nav -->' ) ) );
	}

	/**
	 * A Header navigation with an item still prints the landmark and the
	 * small-screen menu button.
	 */
	public function test_header_nav_with_an_item_renders() {
		$html = do_blocks( '<!-- wp:awt/header-nav --><!-- wp:awt/header-nav-item {"text":"Docs","href":"/docs"} /--><!-- /wp:awt/header-nav -->' );
		$this->assertStringContainsString( '<nav ', $html );
		$this->assertStringContainsString( 'aria-label="Open menu"', $html );
		$this->assertStringContainsString( '>Docs<', $html );
	}
}
