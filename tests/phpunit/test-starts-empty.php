<?php
/**
 * Blocks start empty, and what an empty one prints.
 *
 * A block added from the inserter carried a word like "Button" or "Tag" as
 * its text, so the author had to delete it before typing their own (found
 * 2026-10-12). Blocks now start empty with a hint in the editor, so the
 * published page has to cope with a block nobody typed into:
 * - something to click or read with no text prints nothing;
 * - a form field or a dialog keeps the word it used to start with, so it
 *   still has a name;
 * - a block saved without the attribute still gets the attribute's default.
 *
 * @package AWT\Blocks
 */

/**
 * Checks what each block prints with blank text.
 */
class Test_Starts_Empty extends WP_UnitTestCase {

	/**
	 * Blocks that print nothing when their text is blank.
	 *
	 * @return array[] Data-provider shape: [ block markup ].
	 */
	public function prints_nothing(): array {
		return array(
			'tag'               => array( '<!-- wp:awt/tag {"text":""} /-->' ),
			'linked tag'        => array( '<!-- wp:awt/tag {"text":" ","href":"/x"} /-->' ),
			'button'            => array( '<!-- wp:awt/button {"text":""} /-->' ),
			'linked button'     => array( '<!-- wp:awt/button {"text":"<br>","href":"/x"} /-->' ),
			'link'              => array( '<!-- wp:awt/link {"text":"","href":"/x"} /-->' ),
			'modal opener'      => array( '<!-- wp:awt/modal-opener {"text":"&nbsp;"} /-->' ),
			'menu button'       => array( '<!-- wp:awt/menu-button {"label":""} /-->' ),
			'tooltip'           => array( '<!-- wp:awt/tooltip {"triggerText":""} /-->' ),
			'notification'      => array( '<!-- wp:awt/notification {"title":""} /-->' ),
			'statistic'         => array( '<!-- wp:awt/stat {"value":"","heading":""} /-->' ),
			'inline set, empty' => array( '<!-- wp:awt/inline-set --><!-- wp:awt/button {"text":""} /--><!-- wp:awt/tag {"text":""} /--><!-- /wp:awt/inline-set -->' ),
		);
	}

	/**
	 * Nothing to click or read: nothing printed.
	 *
	 * @dataProvider prints_nothing
	 *
	 * @param string $markup Block markup.
	 */
	public function test_blank_prints_nothing( string $markup ) {
		$this->assertSame( '', trim( do_blocks( $markup ) ) );
	}

	/**
	 * A button with an icon still prints: the icon is what it shows.
	 */
	public function test_icon_button_with_no_text_still_prints() {
		$this->assertStringContainsString( '<button', do_blocks( '<!-- wp:awt/button {"text":"","iconName":"add","ariaLabel":"Add"} /-->' ) );
	}

	/**
	 * A notification or statistic with any text left prints that text.
	 */
	public function test_partly_filled_blocks_print() {
		$this->assertStringContainsString( 'Saved', do_blocks( '<!-- wp:awt/notification {"title":"","subtitle":"Saved"} /-->' ) );
		$this->assertStringContainsString( '42', do_blocks( '<!-- wp:awt/stat {"value":"42","heading":""} /-->' ) );
	}

	/**
	 * Fields and the dialog keep a name.
	 *
	 * @return array[] Data-provider shape: [ block markup, the name it keeps ].
	 */
	public function keeps_a_name(): array {
		return array(
			'checkbox'   => array( '<!-- wp:awt/checkbox {"label":""} /-->', 'Checkbox label' ),
			'text input' => array( '<!-- wp:awt/text-input {"label":""} /-->', 'Label' ),
			'toggle'     => array( '<!-- wp:awt/toggle {"label":""} /-->', 'Toggle label' ),
			'text area'  => array( '<!-- wp:awt/text-area {"label":""} /-->', 'Description' ),
			'select'     => array( '<!-- wp:awt/select {"label":""} /-->', 'Select' ),
			'dropdown'   => array( '<!-- wp:awt/dropdown {"label":""} /-->', 'Dropdown' ),
			'modal'      => array( '<!-- wp:awt/modal {"heading":""} /-->', 'Modal heading' ),
		);
	}

	/**
	 * A blank label or heading falls back to the old starting word.
	 *
	 * @dataProvider keeps_a_name
	 *
	 * @param string $markup Block markup.
	 * @param string $name   The name it keeps.
	 */
	public function test_blank_label_keeps_a_name( string $markup, string $name ) {
		$this->assertMatchesRegularExpression( '/>\s*' . preg_quote( $name, '/' ) . '\s*</', do_blocks( $markup ) );
	}

	/**
	 * Blocks saved without the attribute still get its default.
	 */
	public function test_saved_without_the_attribute_keeps_the_default() {
		$this->assertStringContainsString( '<span class="cds--tag__label" title="Tag">Tag</span>', do_blocks( '<!-- wp:awt/tag /-->' ) );
		$this->assertStringContainsString( 'Button', do_blocks( '<!-- wp:awt/button /-->' ) );
		$this->assertStringContainsString( 'Link text', do_blocks( '<!-- wp:awt/link {"href":"/x"} /-->' ) );
	}

	/**
	 * What counts as blank.
	 */
	public function test_is_blank() {
		foreach ( array( '', ' ', '<br>', '&nbsp;', "\u{00A0}", '<strong> </strong>' ) as $text ) {
			$this->assertTrue( \AWT\Blocks\Render\is_blank( $text ), (string) wp_json_encode( $text ) );
		}
		foreach ( array( 'Beta', '0', '<em>x</em>', '&amp;' ) as $text ) {
			$this->assertFalse( \AWT\Blocks\Render\is_blank( $text ), (string) wp_json_encode( $text ) );
		}
	}
}
