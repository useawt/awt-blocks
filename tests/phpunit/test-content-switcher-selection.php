<?php
/**
 * The content switcher renders its first segment selected, on the server.
 *
 * Selection and the segment/panel links were left to view.js, so with no
 * JavaScript every segment was unselected and out of the Tab order and every
 * panel hidden (outside accessibility review, 2026-10-21). Now the server
 * renders them, as the Tabs block does and as Carbon's ContentSwitcher starts.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the content switcher's server-rendered state.
 */
class Test_Content_Switcher_Selection extends WP_UnitTestCase {

	/**
	 * Renders a switcher with three segments and panels.
	 *
	 * @param bool $first_disabled Whether the first segment is disabled.
	 * @return string Rendered HTML.
	 */
	private function render( bool $first_disabled = false ): string {
		$markup = '<!-- wp:awt/content-switcher -->';
		foreach ( array( 'List', 'Grid', 'Timeline' ) as $i => $label ) {
			$attrs   = array(
				'label' => $label,
				'value' => strtolower( $label ),
			);
			$attrs  += ( 0 === $i && $first_disabled ) ? array( 'disabled' => true ) : array();
			$markup .= '<!-- wp:awt/content-switcher-item ' . wp_json_encode( $attrs ) . ' /-->';
		}
		foreach ( array( 'List', 'Grid', 'Timeline' ) as $label ) {
			$markup .= '<!-- wp:awt/content-switcher-panel --><!-- wp:paragraph --><p>' . $label . ' view</p><!-- /wp:paragraph --><!-- /wp:awt/content-switcher-panel -->';
		}
		return do_blocks( $markup . '<!-- /wp:awt/content-switcher -->' );
	}

	/**
	 * Selection state of each segment, as "label:selected/tabindex".
	 *
	 * @param string $html Rendered HTML.
	 * @return string[]
	 */
	private function segments( string $html ): array {
		preg_match_all( '#<button [^>]*role="tab"[^>]*>.*?</button>#s', $html, $m );
		return array_map(
			static function ( string $tag ): string {
				preg_match( '/aria-selected="(\w+)"/', $tag, $sel );
				preg_match( '/tabindex="(-?\d)"/', $tag, $tab );
				return wp_strip_all_tags( $tag ) . ':' . $sel[1] . '/' . $tab[1]
					. ( str_contains( $tag, 'cds--content-switcher--selected' ) ? ' selected-class' : '' );
			},
			$m[0]
		);
	}

	/**
	 * The first segment is selected and in the Tab order, its panel shown, and
	 * every pair linked.
	 */
	public function test_first_segment_selected_and_pairs_linked() {
		$html = $this->render();
		$this->assertSame( array( 'List:true/0 selected-class', 'Grid:false/-1', 'Timeline:false/-1' ), $this->segments( $html ) );

		preg_match_all( '#<button [^>]*aria-controls="([^"]+)" id="([^"]+)"#', $html, $tabs, PREG_SET_ORDER );
		$this->assertCount( 3, $tabs );
		foreach ( $tabs as $i => $tab ) {
			$this->assertMatchesRegularExpression(
				'#<div aria-labelledby="' . $tab[2] . '" [^>]*id="' . $tab[1] . '" role="tabpanel"[^>]*' . ( 0 === $i ? '' : ' hidden="hidden"' ) . '>#',
				$html
			);
		}
		$this->assertSame( 2, substr_count( $html, 'hidden="hidden"' ) );
	}

	/**
	 * A disabled first segment is skipped, as view.js skips it.
	 */
	public function test_disabled_first_segment_is_skipped() {
		$this->assertSame(
			array( 'List:false/-1', 'Grid:true/0 selected-class', 'Timeline:false/-1' ),
			$this->segments( $this->render( true ) )
		);
	}
}
