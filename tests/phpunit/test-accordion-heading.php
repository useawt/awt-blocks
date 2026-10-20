<?php
/**
 * Accordion section titles are headings.
 *
 * The title was a button only, so the sections were missing from a screen
 * reader's list of headings (outside accessibility review, 2026-10-20). The
 * button now sits in a heading, h3 unless the section's Heading level says
 * otherwise, as the FAQ question's does.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the accordion item's heading.
 */
class Test_Accordion_Heading extends WP_UnitTestCase {

	/**
	 * Renders an accordion with one section.
	 *
	 * @param array $attrs Accordion item attributes.
	 * @return string Rendered HTML.
	 */
	private function render( array $attrs ): string {
		return do_blocks(
			'<!-- wp:awt/accordion --><!-- wp:awt/accordion-item ' . wp_json_encode( $attrs ) . ' -->'
			. '<!-- wp:paragraph --><p>Body</p><!-- /wp:paragraph -->'
			. '<!-- /wp:awt/accordion-item --><!-- /wp:awt/accordion -->'
		);
	}

	/**
	 * The button sits in an h3 by default.
	 */
	public function test_title_is_an_h3_by_default() {
		$html = $this->render( array( 'title' => 'Opening hours' ) );
		$this->assertMatchesRegularExpression(
			'#<li [^>]*><h3 class="awt-accordion-item__heading" style="margin:0;"><button [^>]*class="cds--accordion__heading"[^>]*>.*?Opening hours</span></button></h3><div #s',
			$html
		);
	}

	/**
	 * The author's level is used; anything outside 2 to 6 falls back to h3.
	 */
	public function test_level_setting() {
		$this->assertStringContainsString( '<h5 class="awt-accordion-item__heading"', $this->render( array( 'level' => '5' ) ) );
		$this->assertStringContainsString( '<h2 class="awt-accordion-item__heading"', $this->render( array( 'level' => '2' ) ) );
		$this->assertStringContainsString( '<h3 class="awt-accordion-item__heading"', $this->render( array( 'level' => '1' ) ) );
		$this->assertStringContainsString( '<h3 class="awt-accordion-item__heading"', $this->render( array( 'level' => 'x' ) ) );
	}
}
