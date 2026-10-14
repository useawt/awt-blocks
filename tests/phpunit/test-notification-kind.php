<?php
/**
 * A notification says its kind in words, before its title.
 *
 * Colour and the icon were the only signs of the kind, and the icon is hidden
 * from screen readers, so a warning was read as a plain message (outside
 * accessibility review, 2026-10-14). The kind is now hidden text at the start
 * of the title: "Warning: The events feed changes on 1 October".
 *
 * @package AWT\Blocks
 */

/**
 * Checks the hidden kind text.
 */
class Test_Notification_Kind extends WP_UnitTestCase {

	/**
	 * Kinds and the words read for them.
	 *
	 * @return array[] [ kind or null for the default, words ].
	 */
	public function kinds(): array {
		return array(
			'default'          => array( null, 'Information:' ),
			'info'             => array( 'info', 'Information:' ),
			'success'          => array( 'success', 'Success:' ),
			'warning'          => array( 'warning', 'Warning:' ),
			'error'            => array( 'error', 'Error:' ),
			'unknown, as info' => array( 'nonsense', 'Information:' ),
		);
	}

	/**
	 * The title starts with the kind, hidden from sight.
	 *
	 * @dataProvider kinds
	 *
	 * @param string|null $kind  The Kind setting.
	 * @param string      $words What is read before the title.
	 */
	public function test_title_starts_with_the_kind( ?string $kind, string $words ) {
		$attrs = array( 'title' => 'The events feed changes on 1 October' );
		if ( $kind !== null ) {
			$attrs['kind'] = $kind;
		}
		$html = do_blocks( '<!-- wp:awt/notification ' . wp_json_encode( $attrs ) . ' /-->' );
		$this->assertMatchesRegularExpression(
			'#<p class="cds--inline-notification__title"><span class="cds--visually-hidden">' . preg_quote( $words, '#' ) . ' </span>The events feed changes on 1 October</p>#',
			$html
		);
	}

	/**
	 * The toast variant says it too.
	 */
	public function test_toast_title_starts_with_the_kind() {
		$html = do_blocks( '<!-- wp:awt/notification {"kind":"error","title":"Connection lost","variant":"toast"} /-->' );
		$this->assertStringContainsString( '<p class="cds--toast-notification__title"><span class="cds--visually-hidden">Error: </span>Connection lost', $html );
	}
}
