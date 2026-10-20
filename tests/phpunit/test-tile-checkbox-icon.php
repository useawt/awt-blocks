<?php
/**
 * An independent selectable tile shows Carbon's checkbox.
 *
 * It showed the radio tile's filled checkmark whether or not it was selected,
 * so an unselected tile looked selected (outside accessibility review,
 * 2026-10-20). Like Carbon's SelectableTile it now starts with an empty
 * square; view.js swaps in the checked one on selection. A tile in a group is
 * a radio tile and keeps Carbon's filled checkmark, shown only when chosen.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the selectable tile's icon.
 */
class Test_Tile_Checkbox_Icon extends WP_UnitTestCase {

	/**
	 * Carbon's Checkbox icon path (empty square).
	 */
	const CHECKBOX = 'M26,4H6A2,2,0,0,0,4,6V26a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V6A2,2,0,0,0,26,4ZM6,26V6H26V26Z';

	/**
	 * Carbon's CheckmarkFilled path (the radio tile's mark).
	 */
	const CHECKMARK = 'M8,1C4.1,1,1,4.1,1,8';

	/**
	 * Renders a selectable tile with these attributes.
	 *
	 * @param array $attrs Block attributes.
	 * @return string Rendered HTML.
	 */
	private function render( array $attrs ): string {
		return do_blocks(
			'<!-- wp:awt/tile ' . wp_json_encode( $attrs + array( 'variant' => 'selectable' ) ) . ' -->'
			. '<!-- wp:paragraph --><p>Toggle me</p><!-- /wp:paragraph -->'
			. '<!-- /wp:awt/tile -->'
		);
	}

	/**
	 * An independent tile starts with the empty checkbox.
	 */
	public function test_independent_tile_shows_an_empty_checkbox() {
		$html = $this->render( array() );
		$this->assertMatchesRegularExpression(
			'#role="checkbox" aria-checked="false"[^>]*><span class="cds--tile__checkmark cds--tile__checkmark--persistent" aria-hidden="true"><svg [^>]*viewBox="0 0 32 32"[^>]*><path d="' . preg_quote( self::CHECKBOX, '#' ) . '"/></svg></span>#',
			$html
		);
		$this->assertStringNotContainsString( self::CHECKMARK, $html );
	}

	/**
	 * A tile in a group keeps the radio tile's checkmark.
	 */
	public function test_grouped_tile_keeps_the_checkmark() {
		$html = $this->render( array( 'groupName' => 'size' ) );
		$this->assertStringContainsString( self::CHECKMARK, $html );
		$this->assertStringNotContainsString( self::CHECKBOX, $html );
	}
}
