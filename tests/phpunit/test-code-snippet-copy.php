<?php
/**
 * A copy is confirmed in Carbon's tooltip and a status message; the button
 * keeps its name.
 *
 * A copy used to swap the button's name to "Copied", which most screen
 * readers do not announce on the button you are on, with nothing shown but a
 * colour (outside accessibility review, 2026-10-15). view.js opens the
 * tooltip and fills the status message; this checks what it works with.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the copy button's markup.
 */
class Test_Code_Snippet_Copy extends WP_UnitTestCase {

	/**
	 * Renders a snippet.
	 *
	 * @param array $attrs Block attributes.
	 * @return string Rendered HTML.
	 */
	private function render( array $attrs ): string {
		return do_blocks( '<!-- wp:awt/code-snippet ' . wp_json_encode( $attrs + array( 'code' => 'npm install' ) ) . ' /-->' );
	}

	/**
	 * Expected markup around the button.
	 *
	 * @param string $align   Tooltip placement.
	 * @param string $classes The button's classes.
	 * @param string $copy    The button's name.
	 * @return string The markup.
	 */
	private function tip( string $align, string $classes, string $copy ): string {
		return '<span class="cds--popover-container cds--popover--caret cds--popover--high-contrast cds--popover--' . $align . ' cds--tooltip cds--icon-tooltip awt-snippet-copy"><button type="button" class="' . $classes . '" aria-label="' . $copy . '" data-wp-on--click="actions.copy">';
	}

	/**
	 * Block snippets: the tooltip opens to the left, holds the confirmation,
	 * and a status message follows.
	 */
	public function test_block_snippets_have_tooltip_and_status() {
		foreach ( array( 'single', 'multi' ) as $variant ) {
			$html = $this->render( array( 'variant' => $variant ) );
			$this->assertStringContainsString( $this->tip( 'left', 'cds--snippet-button cds--copy-btn', 'Copy' ), $html );
			$this->assertStringContainsString( '<span class="cds--popover" aria-hidden="true"><span class="cds--popover-content cds--tooltip-content">Copied</span><span class="cds--popover-caret"></span></span></span><span class="cds--visually-hidden" role="status"></span>', $html );
		}
	}

	/**
	 * An inline snippet's tooltip opens below it.
	 */
	public function test_inline_snippet_tooltip_below() {
		$html = $this->render( array( 'variant' => 'inline' ) );
		$this->assertStringContainsString( $this->tip( 'bottom', 'cds--snippet-button cds--copy-btn cds--snippet-button--inline', 'Copy' ), $html );
		$this->assertStringContainsString( 'role="status"', $html );
	}

	/**
	 * The author's own words are used for both.
	 */
	public function test_own_labels() {
		$html = $this->render(
			array(
				'variant'     => 'multi',
				'copyLabel'   => 'Kopieren',
				'copiedLabel' => 'Kopiert',
			)
		);
		$this->assertStringContainsString( 'aria-label="Kopieren"', $html );
		$this->assertStringContainsString( '<span class="cds--popover-content cds--tooltip-content">Kopiert</span>', $html );
	}

	/**
	 * With the Copy button hidden there is nothing to confirm.
	 */
	public function test_no_button_no_tooltip() {
		$html = $this->render(
			array(
				'variant'     => 'multi',
				'hideCopyBtn' => true,
			)
		);
		$this->assertStringNotContainsString( 'awt-snippet-copy', $html );
		$this->assertStringNotContainsString( 'role="status"', $html );
	}
}
