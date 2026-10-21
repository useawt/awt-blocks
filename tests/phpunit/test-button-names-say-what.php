<?php
/**
 * Close and More information buttons name what they act on.
 *
 * Every notification close button was "Close notification" and every
 * Toggletip button "More information", whatever was beside it (outside
 * accessibility review, 2026-10-21). The close button now names its
 * notification, and a Toggletip left at its default name names its label.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the two buttons' names.
 */
class Test_Button_Names_Say_What extends WP_UnitTestCase {

	/**
	 * The aria-label of the first tag matching a class.
	 *
	 * @param string $html      Rendered HTML.
	 * @param string $css_class Class on the button.
	 * @return string|null
	 */
	private function name_of( string $html, string $css_class ): ?string {
		return preg_match( '#<button [^>]*class="[^"]*' . preg_quote( $css_class, '#' ) . '[^"]*" aria-label="([^"]*)"#', $html, $m )
			? html_entity_decode( $m[1], ENT_QUOTES, 'UTF-8' )
			: null;
	}

	/**
	 * Renders a notification and returns its close button's name.
	 *
	 * @param array $attrs Block attributes.
	 * @return string|null
	 */
	private function close_name( array $attrs ): ?string {
		return $this->name_of( do_blocks( '<!-- wp:awt/notification ' . wp_json_encode( $attrs ) . ' /-->' ), '__close-button' );
	}

	/**
	 * Renders a toggletip and returns its button's name.
	 *
	 * @param array $attrs Block attributes.
	 * @return string|null
	 */
	private function info_name( array $attrs ): ?string {
		$attrs += array( 'description' => 'Backups run at 02:00.' );
		return $this->name_of( do_blocks( '<!-- wp:awt/toggletip ' . wp_json_encode( $attrs ) . ' /-->' ), 'cds--toggletip-button' );
	}

	/**
	 * The close button names the title, else the subtitle.
	 */
	public function test_close_button_names_its_notification() {
		$this->assertSame( 'Close notification: Connection lost', $this->close_name( array( 'title' => 'Connection <b>lost</b>' ) ) );
		$this->assertSame(
			'Close notification: Retrying in 30 seconds.',
			$this->close_name(
				array(
					'title'    => '',
					'subtitle' => 'Retrying in 30 seconds.',
				)
			)
		);
		$this->assertSame(
			'Close notification',
			$this->close_name(
				array(
					'title'   => '',
					'caption' => 'Just now',
					'variant' => 'toast',
				)
			)
		);
	}

	/**
	 * A default Toggletip name gains the label; an author's own is kept.
	 */
	public function test_toggletip_button_names_its_label() {
		$this->assertSame( 'More information: Storage limits', $this->info_name( array( 'label' => 'Storage limits' ) ) );
		$this->assertSame(
			'More information: Storage limits',
			$this->info_name(
				array(
					'label'     => 'Storage limits',
					'ariaLabel' => '',
				)
			)
		);
		$this->assertSame(
			'About storage limits',
			$this->info_name(
				array(
					'label'     => 'Storage limits',
					'ariaLabel' => 'About storage limits',
				)
			)
		);
		$this->assertSame( 'More information', $this->info_name( array( 'description' => 'Backups run at 02:00.' ) ) );
	}
}
