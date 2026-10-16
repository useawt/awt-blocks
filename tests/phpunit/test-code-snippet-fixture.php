<?php
/**
 * The multi-line Code snippet example keeps its line breaks.
 *
 * The render fixture's example had lost the backslashes of its `\n` escapes,
 * so it rendered on one line as "{n  return …;n}nnconsole.log", the snapshot
 * froze it that way, and the catalog showed it live (found 2026-10-16).
 *
 * @package AWT\Blocks
 */

/**
 * Checks the fixture's multi-line example.
 */
class Test_Code_Snippet_Fixture extends WP_UnitTestCase {

	/**
	 * The example renders on separate lines.
	 */
	public function test_example_has_line_breaks() {
		$fixture = dirname( __DIR__ ) . '/snapshots/fixtures/block-code-snippet.html';
		$html    = do_blocks( (string) file_get_contents( $fixture ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a local test fixture.
		$this->assertStringContainsString( "function greet(name) {\n  return `Hello, \${name}!`;\n}\n\nconsole.log(", $html );
		$this->assertStringNotContainsString( ';n}nn', $html );
	}
}
