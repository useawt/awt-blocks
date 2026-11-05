<?php
/**
 * A header action that shows a label says so in its class.
 *
 * The theme widens a labelled action from this class. It used to find the
 * label with `:has()`, which Edge and Chrome before 105 do not support: on an
 * old Edge the action stayed an icon-sized square, "Learn" ran across the
 * next action and "Log in" wrapped onto two lines (accessibilitycloud.com,
 * 2026-11-05). The browser test adds the class itself, so this is the test
 * that notices if the block stops printing it.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the with-label class on awt/header-action.
 */
class Test_Header_Action_Label extends WP_UnitTestCase {

	const MODIFIER = 'cds--header__action--with-label';

	/**
	 * Labelled actions in each element the block can render.
	 *
	 * @return array[] Data-provider shape: [ block markup ].
	 */
	public function labelled_actions(): array {
		return array(
			'link'   => array( '<!-- wp:awt/header-action {"iconName":"login","label":"Log in","href":"/login","kind":"with-label"} /-->' ),
			'button' => array( '<!-- wp:awt/header-action {"iconName":"help","label":"Help","kind":"with-label"} /-->' ),
			'panel'  => array( '<!-- wp:awt/header-action {"iconName":"search","label":"Search","panelId":"search-panel","kind":"with-label"} /-->' ),
		);
	}

	/**
	 * The class is on the action itself, next to the label it sizes for.
	 *
	 * @dataProvider labelled_actions
	 *
	 * @param string $markup Block markup.
	 */
	public function test_labelled_action_carries_the_class( string $markup ) {
		$html = do_blocks( $markup );
		$this->assertMatchesRegularExpression( '/^<(a|button)\b[^>]*\bclass="[^"]*\bcds--header__action cds--header__action--with-label\b/', trim( $html ) );
		$this->assertStringContainsString( 'cds--header__action-label', $html );
	}

	/**
	 * An icon-only action, or a labelled kind with no label, stays a square.
	 */
	public function test_action_without_a_shown_label_has_no_class() {
		$this->assertStringNotContainsString( self::MODIFIER, do_blocks( '<!-- wp:awt/header-action {"iconName":"search","label":"Search","href":"/?s="} /-->' ) );
		$this->assertStringNotContainsString( self::MODIFIER, do_blocks( '<!-- wp:awt/header-action {"iconName":"search","label":"","href":"/?s=","kind":"with-label"} /-->' ) );
	}
}
