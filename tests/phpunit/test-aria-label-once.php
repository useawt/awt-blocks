<?php
/**
 * An aria-label set on a block is written once, on the element it names.
 *
 * The Accessibility panel's render filter copies `ariaLabel` onto a block's
 * outer element. Five blocks already put their own `ariaLabel` on an inner
 * element (a tablist, a button, a `<nav>`, a `<ul>`), and the filter added a
 * second copy to their wrapper: on a `<div>` or `<span>` with no role, where
 * axe reports it as needs-review and the axe gate does not fail on it, and on
 * the side nav's `<aside>`, where it gave two landmarks one name. Issue
 * useawt/awt-workspace#13, 2026-09-27.
 *
 * @package AWT\Blocks
 */

/**
 * Checks where a block's aria-label lands.
 */
class Test_Aria_Label_Once extends WP_UnitTestCase {

	const LABEL = 'TESTLABEL';

	/**
	 * Every block that declares `ariaLabel`, the inner blocks it needs to
	 * render at all, and the element the label belongs on (`tag.class`).
	 *
	 * @return array[] Data-provider shape: [ name, inner markup, extra attrs, expected element ].
	 */
	public function owners(): array {
		$para = '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->';
		return array(
			'content switcher' => array( 'awt/content-switcher', '<!-- wp:awt/content-switcher-item {"label":"A"} /--><!-- wp:awt/content-switcher-item {"label":"B"} /-->', array(), 'div.cds--content-switcher' ),
			'tabs'             => array( 'awt/tabs', '<!-- wp:awt/tab {"label":"A"} -->' . $para . '<!-- /wp:awt/tab -->', array(), 'ul.cds--tab--list' ),
			'toggletip'        => array(
				'awt/toggletip',
				'',
				array(
					'label'       => 'L',
					'description' => 'D',
				),
				'button.cds--toggletip-button',
			),
			'side nav'         => array( 'awt/side-nav', '<!-- wp:awt/side-nav-link {"label":"A","url":"#"} /-->', array(), 'nav.cds--side-nav__navigation' ),
			'header menu'      => array( 'awt/header-menu', '', array(), 'ul.cds--header__menu' ),
			'breadcrumb'       => array( 'awt/breadcrumb', '', array(), 'nav.cds--breadcrumb' ),
			'header nav'       => array( 'awt/header-nav', '<!-- wp:awt/header-nav-item {"text":"A","href":"#"} /-->', array(), 'nav.cds--header__nav' ),
			'header global'    => array( 'awt/header-global', '', array(), 'div.cds--header__global' ),
			'form'             => array( 'awt/form', '', array(), 'form.cds--form' ),
			'section'          => array( 'awt/section', $para, array(), 'section.awt-section' ),
		);
	}

	/**
	 * Render a block with the test label.
	 *
	 * @param string $name  Block name.
	 * @param string $inner Inner block markup, or '' for a self-closing block.
	 * @param array  $extra More attributes.
	 * @return string Rendered HTML.
	 */
	private function render( string $name, string $inner, array $extra = array() ): string {
		$attrs = wp_json_encode( array( 'ariaLabel' => self::LABEL ) + $extra );
		$src   = $inner === ''
			? "<!-- wp:{$name} {$attrs} /-->"
			: "<!-- wp:{$name} {$attrs} -->{$inner}<!-- /wp:{$name} -->";
		return do_blocks( $src );
	}

	/**
	 * The tags that carry the test label, as `tag.first-class`.
	 *
	 * @param string $html Rendered HTML.
	 * @return string[] One entry per labelled element.
	 */
	private function labelled( string $html ): array {
		preg_match_all( '/<[a-z][a-z0-9]*\b[^>]*\saria-label="' . self::LABEL . '"[^>]*>/i', $html, $m );
		return array_map(
			static function ( string $tag ): string {
				preg_match( '/^<([a-z0-9]+)/i', $tag, $t );
				preg_match( '/\sclass="([^" ]*)/', $tag, $c );
				return strtolower( $t[1] ) . '.' . ( $c[1] ?? '' );
			},
			$m[0]
		);
	}

	/**
	 * A block that owns its aria-label carries it once, on the right element.
	 *
	 * @dataProvider owners
	 *
	 * @param string $name     Block name.
	 * @param string $inner    Inner block markup.
	 * @param array  $extra    More attributes.
	 * @param string $expected Element the label belongs on.
	 */
	public function test_label_lands_once_on_the_named_element( string $name, string $inner, array $extra, string $expected ) {
		$this->assertSame( array( $expected ), $this->labelled( $this->render( $name, $inner, $extra ) ) );
	}

	/**
	 * No AWT block, rendered on its own, carries the label twice.
	 */
	public function test_no_block_writes_the_label_twice() {
		$twice = array();
		foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $name => $type ) {
			if ( ! str_starts_with( $name, 'awt/' ) ) {
				continue;
			}
			$found = $this->labelled( $this->render( $name, '' ) );
			if ( count( $found ) > 1 ) {
				$twice[ $name ] = $found;
			}
		}
		$this->assertSame( array(), $twice );
	}

	/**
	 * A block that does not declare `ariaLabel` still gets the panel's label
	 * on its outer element.
	 */
	public function test_panel_label_still_reaches_other_blocks() {
		$html = $this->render( 'awt/tile', '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->' );
		$this->assertCount( 1, $this->labelled( $html ) );
		$this->assertMatchesRegularExpression( '/^\s*<[^>]*\saria-label="' . self::LABEL . '"/', $html );
	}
}
