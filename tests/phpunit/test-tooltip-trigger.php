<?php
/**
 * The tooltip trigger is a button with a dotted underline.
 *
 * It was a focusable span, which a screen reader announced as plain text,
 * with no underline to show a hint was there (outside accessibility review,
 * 2026-10-20). It is now Carbon's definition tooltip button.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the tooltip trigger's markup.
 */
class Test_Tooltip_Trigger extends WP_UnitTestCase {

	/**
	 * Renders a tooltip with these attributes.
	 *
	 * @param array $attrs Block attributes.
	 * @return string Rendered HTML.
	 */
	private function render( array $attrs ): string {
		return do_blocks( '<!-- wp:awt/tooltip ' . wp_json_encode( $attrs ) . ' /-->' );
	}

	/**
	 * The trigger is a button linked to its hint, with no added tab stop.
	 */
	public function test_trigger_is_a_button() {
		$html = $this->render(
			array(
				'triggerText' => 'Draft',
				'description' => 'Saved, but not published yet.',
			)
		);
		$this->assertMatchesRegularExpression(
			'#<button type="button" class="cds--definition-term" aria-controls="(awt-tooltip-\d+)" aria-describedby="\1" aria-expanded="false" [^>]*data-wp-on--click="actions\.toggle">Draft</button><span id="\1" class="cds--tooltip__content" role="tooltip" hidden>#',
			$html
		);
		$this->assertStringNotContainsString( 'tabindex', $html );
		$this->assertStringNotContainsString( 'cds--tooltip__trigger', $html );
	}

	/**
	 * Bold and italic stay; a link would put a control inside the button.
	 */
	public function test_trigger_holds_only_text_formatting() {
		$html = $this->render(
			array(
				'triggerText' => '<strong>Retention</strong> <em>period</em> <a href="/x">policy</a>',
				'description' => 'Backups are kept for 30 days.',
			)
		);
		$this->assertStringContainsString( '><strong>Retention</strong> <em>period</em> policy</button>', $html );
		$this->assertStringNotContainsString( '<a ', $html );
	}
}
