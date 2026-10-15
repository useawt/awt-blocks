<?php
/**
 * A filter tag's dismiss button works and names the tag it removes.
 *
 * The button had no script, so it did nothing, and every one was named just
 * "Dismiss" (outside accessibility review, 2026-10-15). The tag now joins the
 * awt/tag store, which hides it on click (view.js), and the button reads
 * "Dismiss Region: us-east".
 *
 * @package AWT\Blocks
 */

/**
 * Checks the filter tag's markup.
 */
class Test_Tag_Filter extends WP_UnitTestCase {

	/**
	 * Renders a tag with these attributes.
	 *
	 * @param array $attrs Block attributes.
	 * @return string Rendered HTML.
	 */
	private function render( array $attrs ): string {
		return do_blocks( '<!-- wp:awt/tag ' . wp_json_encode( $attrs ) . ' /-->' );
	}

	/**
	 * The button names its tag and is wired to hide it.
	 */
	public function test_button_names_and_hides_its_tag() {
		$html = $this->render(
			array(
				'text'   => 'Region: us-east',
				'filter' => true,
			)
		);
		$this->assertStringContainsString( 'data-wp-interactive="awt/tag"', $html );
		$this->assertStringContainsString( 'data-wp-bind--hidden="context.dismissed"', $html );
		$this->assertStringContainsString( 'data-wp-context="{&quot;dismissed&quot;:false}"', $html );
		$this->assertMatchesRegularExpression(
			'#<button type="button" class="[^"]*cds--tag__close-icon[^"]*" aria-label="Dismiss Region: us-east" data-wp-on--click="actions\.dismiss">#',
			$html
		);
	}

	/**
	 * Markup in the label stays out of the name.
	 */
	public function test_name_is_the_plain_label() {
		$html = $this->render(
			array(
				'text'   => 'Size &amp; <b>fit</b>',
				'filter' => true,
			)
		);
		$this->assertStringContainsString( 'aria-label="Dismiss Size &amp; fit"', $html );
	}

	/**
	 * A tag with no text renders nothing, so no button is ever left without a
	 * tag to name.
	 */
	public function test_no_text_no_button() {
		foreach ( array( '', '<b></b>' ) as $text ) {
			$this->assertSame(
				'',
				trim(
					$this->render(
						array(
							'text'   => $text,
							'filter' => true,
						)
					)
				)
			);
		}
	}

	/**
	 * A plain tag gets no button and no dismissed state.
	 */
	public function test_plain_tag_has_no_button() {
		$html = $this->render( array( 'text' => 'Region: us-east' ) );
		$this->assertStringNotContainsString( '<button', $html );
		$this->assertStringNotContainsString( 'context.dismissed', $html );
	}

	/**
	 * A linked tag never gets a button, Filter or not.
	 */
	public function test_link_tag_has_no_button() {
		$html = $this->render(
			array(
				'text'   => 'Region: us-east',
				'filter' => true,
				'href'   => 'https://example.com/',
			)
		);
		$this->assertStringNotContainsString( '<button', $html );
		$this->assertStringNotContainsString( 'context.dismissed', $html );
	}
}
