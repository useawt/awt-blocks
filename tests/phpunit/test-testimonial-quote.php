<?php
/**
 * A testimonial says it is a quote, in words, before the quotation.
 *
 * VoiceOver and TalkBack do not announce a blockquote, so the quotation was
 * heard as the site's own words (outside accessibility review, 2026-10-15).
 * The blockquote now opens with a hidden "Quote:", in the site's language.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the hidden quote word.
 */
class Test_Testimonial_Quote extends WP_UnitTestCase {

	/**
	 * Renders a testimonial with these attributes.
	 *
	 * @param array $attrs Block attributes.
	 * @return string Rendered HTML.
	 */
	private function render( array $attrs ): string {
		return do_blocks( '<!-- wp:awt/testimonial ' . wp_json_encode( $attrs ) . ' /-->' );
	}

	/**
	 * The quotation starts with the hidden word, and the attribution follows it.
	 */
	public function test_quote_starts_with_the_word() {
		$html = $this->render(
			array(
				'quote'      => 'It just <em>works</em>.',
				'authorName' => 'Ada Lovelace',
			)
		);
		$this->assertStringContainsString(
			'<blockquote class="awt-testimonial__quote"><span class="cds--visually-hidden">Quote: </span>It just <em>works</em>.</blockquote><figcaption',
			$html
		);
	}

	/**
	 * A testimonial in another language keeps the word in the site's.
	 */
	public function test_word_keeps_the_site_language() {
		$site = get_bloginfo( 'language' );
		$this->assertNotSame( '', $site );
		$html = $this->render(
			array(
				'quote'   => 'Ça marche.',
				'awtLang' => 'fr',
			)
		);
		$this->assertMatchesRegularExpression( '#<figure [^>]*lang="fr"#', $html );
		$this->assertStringContainsString(
			'<span class="cds--visually-hidden" lang="' . $site . '">Quote: </span>Ça marche.',
			$html
		);
	}

	/**
	 * A language the same as the site's needs no second one on the word.
	 */
	public function test_same_language_adds_nothing() {
		$html = $this->render(
			array(
				'quote'   => 'It just works.',
				'awtLang' => strtolower( get_bloginfo( 'language' ) ),
			)
		);
		$this->assertStringContainsString( '<span class="cds--visually-hidden">Quote: </span>It just works.', $html );
	}

	/**
	 * No quotation, no word.
	 */
	public function test_no_quote_no_word() {
		$html = $this->render( array( 'authorName' => 'Ada Lovelace' ) );
		$this->assertStringNotContainsString( 'Quote:', $html );
		$this->assertStringNotContainsString( '<blockquote', $html );
	}
}
