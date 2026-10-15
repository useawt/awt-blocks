<?php
/**
 * A code snippet's scrolling box is wired to be a tab stop only while it
 * scrolls.
 *
 * It was a tab stop always, with no role or name, even when nothing scrolled
 * (outside accessibility review, 2026-10-15). The box still arrives with
 * `tabindex="0"`, so a page without scripts can be scrolled from the
 * keyboard; view.js takes the stop away while the code fits and names the
 * box "Code snippet" while it is one.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the snippet's markup.
 */
class Test_Code_Snippet_Scroll extends WP_UnitTestCase {

	/**
	 * Renders a snippet.
	 *
	 * @param string $variant single, multi or inline.
	 * @return string Rendered HTML.
	 */
	private function render( string $variant ): string {
		$attrs = array(
			'code'    => 'npm install',
			'variant' => $variant,
		);
		return do_blocks( '<!-- wp:awt/code-snippet ' . wp_json_encode( $attrs ) . ' /-->' );
	}

	/**
	 * Single and multi-line snippets carry the check and the name, and start
	 * as a tab stop on the box that scrolls.
	 */
	public function test_block_snippets_are_watched() {
		$single = $this->render( 'single' );
		$multi  = $this->render( 'multi' );
		foreach ( array( $single, $multi ) as $html ) {
			$this->assertStringContainsString( 'data-wp-init="callbacks.watchScroll"', $html );
			$this->assertStringContainsString( '&quot;regionLabel&quot;:&quot;Code snippet&quot;', $html );
		}
		$this->assertMatchesRegularExpression( '#<div class="cds--snippet-container" tabindex="0"><pre>#', $single );
		$this->assertMatchesRegularExpression( '#<div class="cds--snippet-container"><pre tabindex="0">#', $multi );
	}

	/**
	 * The name is translated.
	 */
	public function test_name_is_translated() {
		$translate = static function ( $text, $original, $domain ) {
			return ( 'awt-blocks' === $domain && 'Code snippet' === $original ) ? 'Codebeispiel' : $text;
		};
		add_filter( 'gettext', $translate, 10, 3 );
		$html = $this->render( 'multi' );
		remove_filter( 'gettext', $translate, 10 );
		$this->assertStringContainsString( '&quot;regionLabel&quot;:&quot;Codebeispiel&quot;', $html );
	}

	/**
	 * An inline snippet never scrolls on its own and is not watched.
	 */
	public function test_inline_snippet_is_not_watched() {
		$html = $this->render( 'inline' );
		$this->assertStringNotContainsString( 'watchScroll', $html );
		$this->assertStringNotContainsString( 'regionLabel', $html );
		$this->assertStringNotContainsString( 'tabindex', $html );
	}
}
