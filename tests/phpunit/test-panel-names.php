<?php
/**
 * The Accessibility panel's name lands on the element that can carry it.
 *
 * The panel wrote aria-label, aria-labelledby and aria-describedby onto each
 * block's first tag. On about half the blocks that is a wrapper `<div>` or
 * `<span>`, where ARIA prohibits a name, so it was dropped and the field,
 * switch or code area inside kept its own name, or none (outside
 * accessibility review, 2026-10-14). These tests render every block in the
 * snapshot fixtures with the panel filled in and check where each value went.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the routing in global-controls.php (NAME_TARGETS).
 */
class Test_Panel_Names extends WP_UnitTestCase {

	/**
	 * Blocks not in the snapshot fixtures, or variants they lack.
	 */
	const EXTRA = <<<'HTML'
<!-- wp:awt/side-nav -->
<!-- wp:awt/side-nav-section {"title":"Guides"} -->
<!-- wp:awt/side-nav-link {"label":"Install","url":"/install"} /-->
<!-- wp:awt/side-nav-divider /-->
<!-- /wp:awt/side-nav-section -->
<!-- /wp:awt/side-nav -->
<!-- wp:awt/header-nav -->
<!-- wp:awt/header-nav-item {"text":"Home","href":"/"} /-->
<!-- wp:awt/header-menu {"text":"Products"} -->
<!-- wp:awt/header-nav-item {"text":"Theme","href":"/theme"} /-->
<!-- /wp:awt/header-menu -->
<!-- /wp:awt/header-nav -->
<!-- wp:awt/header-action {"label":"Search","panelId":"search-panel"} /-->
<!-- wp:awt/header-action {"label":"Help"} /-->
<!-- wp:awt/color-scheme-toggle /-->
<!-- wp:awt/color-scheme-toggle {"kind":"segmented"} /-->
<!-- wp:awt/color-scheme-toggle {"kind":"with-label"} /-->
<!-- wp:awt/icon {"iconName":"add","decorative":false,"label":"Add"} /-->
<!-- wp:awt/code-snippet {"variant":"inline","code":"npm test"} /-->
<!-- wp:awt/tile -->
<!-- wp:awt/tile {"variant":"expandable","summary":"More"} -->
<!-- wp:paragraph --><p>Inside.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->
<!-- /wp:awt/tile -->
<!-- wp:awt/section {"tagName":"div"} --><!-- wp:paragraph --><p>x</p><!-- /wp:paragraph --><!-- /wp:awt/section -->
<!-- wp:awt/section {"tagName":"article"} --><!-- wp:paragraph --><p>x</p><!-- /wp:paragraph --><!-- /wp:awt/section -->
<!-- wp:awt/section {"tagName":"aside"} --><!-- wp:paragraph --><p>x</p><!-- /wp:paragraph --><!-- /wp:awt/section -->
<!-- wp:awt/tag {"text":"Docs","href":"/docs"} /-->
<!-- wp:awt/tag {"text":"Beta","filter":true} /-->
HTML;

	/**
	 * Give every awt block in some markup the panel's attributes, each with a
	 * value unique to that block.
	 *
	 * @param string $markup Block markup.
	 * @param string $mode   'label' (aria-label + describedby) or 'labelledby'.
	 * @return string Markup with the attributes added.
	 */
	private function probe( string $markup, string $mode ): string {
		$n = 0;
		return preg_replace_callback(
			'/<!-- wp:(awt\/[a-z0-9-]+)(\s+(\{.*?\}))?\s*(\/?)-->/s',
			static function ( array $m ) use ( &$n, $mode ): string {
				$attrs = isset( $m[3] ) && $m[3] !== '' ? json_decode( $m[3], true ) : array();
				if ( ! is_array( $attrs ) ) {
					return $m[0];
				}
				++$n;
				// An explicit anchor keeps the FAQ slugs, which are deduplicated
				// once per request, free for the snapshot test that runs later.
				if ( $m[1] === 'awt/faq-item' ) {
					$attrs['anchor'] = 'probe-anchor-' . $mode . '-' . $n;
				}
				if ( $mode === 'label' ) {
					$attrs['ariaLabel']       = 'PROBE' . $n;
					$attrs['ariaDescribedby'] = 'probe-desc-' . $n;
				} else {
					$attrs['ariaLabelledby'] = 'probe-name-' . $n;
				}
				return '<!-- wp:' . $m[1] . ' ' . wp_json_encode( $attrs ) . ' ' . $m[4] . '-->';
			},
			$markup
		);
	}

	/**
	 * Every fixture, plus the extra markup above.
	 *
	 * @return array[] [ name => [ markup ] ].
	 */
	public function corpora(): array {
		$rows = array( 'extra' => array( self::EXTRA ) );
		foreach ( glob( dirname( __DIR__ ) . '/snapshots/fixtures/*.html' ) as $path ) {
			$rows[ basename( $path, '.html' ) ] = array( (string) file_get_contents( $path ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local test fixture.
		}
		return $rows;
	}

	/**
	 * Every tag carrying one of our probe values, as [ tag, role, attrs ].
	 *
	 * @param string $html Rendered HTML.
	 * @param string $attr Attribute to look for.
	 * @param string $like Prefix of the probe value.
	 * @return array[] One entry per tag.
	 */
	private function carriers( string $html, string $attr, string $like ): array {
		$found = array();
		$p     = new WP_HTML_Tag_Processor( $html );
		while ( $p->next_tag() ) {
			$v = $p->get_attribute( $attr );
			if ( is_string( $v ) && strpos( $v, $like ) !== false ) {
				$found[] = array(
					'tag'  => $p->get_tag(),
					'role' => $p->get_attribute( 'role' ),
					'href' => $p->get_attribute( 'href' ),
				);
			}
		}
		return $found;
	}

	/**
	 * Whether a carrier has the generic role or a role that refuses a name.
	 *
	 * @param array $c Carrier from carriers().
	 */
	private function unnameable( array $c ): bool {
		if ( is_string( $c['role'] ) ) {
			return in_array( $c['role'], array( 'generic', 'presentation', 'none' ), true );
		}
		if ( $c['tag'] === 'A' ) {
			return $c['href'] === null;
		}
		return in_array( $c['tag'], array( 'DIV', 'SPAN', 'PRE', 'P', 'CODE', 'B', 'I', 'EM', 'STRONG', 'SMALL' ), true );
	}

	/**
	 * No block puts the panel's aria-label or aria-labelledby on an element
	 * that cannot carry a name.
	 *
	 * @dataProvider corpora
	 *
	 * @param string $markup Block markup.
	 */
	public function test_no_name_lands_on_a_generic_element( string $markup ) {
		$bad = array();
		foreach ( array(
			'label'      => array( 'aria-label', 'PROBE' ),
			'labelledby' => array( 'aria-labelledby', 'probe-name-' ),
		) as $mode => list( $attr, $like ) ) {
			foreach ( $this->carriers( do_blocks( $this->probe( $markup, $mode ) ), $attr, $like ) as $c ) {
				if ( $this->unnameable( $c ) ) {
					$bad[] = $attr . ' on ' . $c['tag'] . ( $c['role'] ? '[role=' . $c['role'] . ']' : '' );
				}
			}
		}
		$this->assertSame( array(), $bad );
	}

	/**
	 * Render one block with panel attributes.
	 *
	 * @param string $name  Block name.
	 * @param array  $attrs Attributes.
	 * @param string $inner Inner markup, or '' for a self-closing block.
	 */
	private function render( string $name, array $attrs, string $inner = '' ): string {
		$json = wp_json_encode( $attrs );
		return do_blocks(
			$inner === ''
				? "<!-- wp:{$name} {$json} /-->"
				: "<!-- wp:{$name} {$json} -->{$inner}<!-- /wp:{$name} -->"
		);
	}

	/**
	 * The opening tag that carries an attribute value.
	 *
	 * @param string $html  Rendered HTML.
	 * @param string $attr  Attribute name.
	 * @param string $value Exact value.
	 * @return string The tag, or '' when none carries it.
	 */
	private function tag_with( string $html, string $attr, string $value ): string {
		preg_match_all( '/<[a-z][a-z0-9]*\b[^>]*>/i', $html, $m );
		foreach ( $m[0] as $tag ) {
			if ( preg_match( '/\s' . preg_quote( $attr . '="' . $value . '"', '/' ) . '/', $tag ) ) {
				return $tag;
			}
		}
		return '';
	}

	/**
	 * Where the name goes, block by block.
	 *
	 * @return array[] [ block, attrs, inner markup, regex the named tag must match ].
	 */
	public function targets(): array {
		$para = '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->';
		return array(
			'code snippet, multi'  => array( 'awt/code-snippet', array( 'code' => 'a' ), '', '/^<pre(?=[^>]*\srole="region")(?=[^>]*\stabindex="0")/' ),
			'code snippet, single' => array(
				'awt/code-snippet',
				array(
					'code'    => 'a',
					'variant' => 'single',
				),
				'',
				'/^<div(?=[^>]*\bcds--snippet-container\b)(?=[^>]*\srole="region")(?=[^>]*\stabindex="0")/',
			),
			'code snippet, inline' => array(
				'awt/code-snippet',
				array(
					'code'    => 'a',
					'variant' => 'inline',
				),
				'',
				'/^<span(?=[^>]*\bcds--snippet\b)(?=[^>]*\srole="group")/',
			),
			'toggle'               => array( 'awt/toggle', array( 'label' => 'L' ), '', '/^<input\b[^>]*\brole="switch"/' ),
			'checkbox'             => array( 'awt/checkbox', array( 'label' => 'L' ), '', '/^<input\b[^>]*type="checkbox"/' ),
			'select'               => array( 'awt/select', array( 'label' => 'L' ), '', '/^<select\b/' ),
			'text area'            => array( 'awt/text-area', array( 'label' => 'L' ), '', '/^<textarea\b/' ),
			'dropdown'             => array(
				'awt/dropdown',
				array(
					'label'   => 'L',
					'options' => array(
						array(
							'label' => 'A',
							'value' => 'a',
						),
					),
				),
				'',
				'/^<button\b[^>]*\brole="combobox"/',
			),
			'menu button'          => array(
				'awt/menu-button',
				array(
					'label' => 'L',
					'items' => array(
						array(
							'label' => 'A',
							'value' => 'a',
						),
					),
				),
				'',
				'/^<button\b[^>]*\bcds--menu-button__trigger/',
			),
			'tooltip'              => array(
				'awt/tooltip',
				array(
					'triggerText' => 'T',
					'description' => 'D',
				),
				'',
				'/^<span(?=[^>]*\stabindex="0")(?=[^>]*\srole="group")/',
			),
			'tab'                  => array( 'awt/tab', array( 'label' => 'T' ), '', '/^<button\b[^>]*\brole="tab"/' ),
			'modal'                => array( 'awt/modal', array( 'heading' => 'H' ), $para, '/^<div\b[^>]*\brole="dialog"/' ),
			'accordion item'       => array( 'awt/accordion-item', array( 'title' => 'T' ), $para, '/^<button\b/' ),
			'faq item'             => array( 'awt/faq-item', array( 'question' => 'Q' ), $para, '/^<button\b/' ),
			'breadcrumb item'      => array(
				'awt/breadcrumb-item',
				array(
					'text' => 'T',
					'href' => '/t',
				),
				'',
				'/^<a\b/',
			),
			'hero'                 => array( 'awt/hero', array( 'version' => 2 ), $para, '/^<div(?=[^>]*\bawt-hero\b)(?=[^>]*\srole="group")/' ),
			'section as div'       => array( 'awt/section', array( 'tagName' => 'div' ), $para, '/^<div(?=[^>]*\srole="group")/' ),
			'section as aside'     => array( 'awt/section', array( 'tagName' => 'aside' ), $para, '/^<aside\b/' ),
			'expandable tile'      => array(
				'awt/tile',
				array(
					'variant' => 'expandable',
					'summary' => 'S',
				),
				$para,
				'/^<summary\b/',
			),
			'tile holding a tile'  => array( 'awt/tile', array(), '<!-- wp:awt/tile {"variant":"expandable","summary":"Inner"} -->' . $para . '<!-- /wp:awt/tile -->', '/^<div(?=[^>]*\bcds--tile\b)(?=[^>]*\srole="group")/' ),
			'header action'        => array( 'awt/header-action', array( 'label' => 'Search' ), '', '/^<(a|button)\b[^>]*\bcds--header__action/' ),
			'header nav item'      => array(
				'awt/header-nav-item',
				array(
					'text' => 'T',
					'href' => '/t',
				),
				'',
				'/^<a\b/',
			),
			'footer link'          => array(
				'awt/footer-link',
				array(
					'text' => 'T',
					'href' => '/t',
				),
				'',
				'/^<a\b/',
			),
			'text input'           => array( 'awt/text-input', array( 'label' => 'L' ), '', '/^<input\b/' ),
			'password input'       => array( 'awt/password-input', array( 'label' => 'L' ), '', '/^<input\b(?=[^>]*\stype="password")/' ),
			'radio button'         => array( 'awt/radio-button', array( 'label' => 'L' ), '', '/^<input\b(?=[^>]*\stype="radio")/' ),
			'side nav section'     => array( 'awt/side-nav-section', array( 'title' => 'Guides' ), '<!-- wp:awt/side-nav-link {"label":"A","url":"/a"} /-->', '/^<ul\b(?=[^>]*\bcds--side-nav__menu\b)/' ),
			'side nav link'        => array(
				'awt/side-nav-link',
				array(
					'label' => 'A',
					'url'   => '/a',
				),
				'',
				'/^<a\b/',
			),
			'linked tag'           => array(
				'awt/tag',
				array(
					'text' => 'Docs',
					'href' => '/docs',
				),
				'',
				'/^<a\b/',
			),
			'dismissible tag'      => array(
				'awt/tag',
				array(
					'text'   => 'Beta',
					'filter' => true,
				),
				'',
				'/^<span(?=[^>]*\bcds--tag--filter\b)(?=[^>]*\srole="group")/',
			),
			'header global'        => array( 'awt/header-global', array(), '', '/^<div(?=[^>]*\bcds--header__global\b)(?=[^>]*\srole="region")/' ),
			'tabs'                 => array( 'awt/tabs', array(), '<!-- wp:awt/tab {"label":"A"} /-->', '/^<ul\b(?=[^>]*\srole="tablist")/' ),
			'content switcher'     => array( 'awt/content-switcher', array(), '<!-- wp:awt/content-switcher-item {"label":"A"} /-->', '/^<div\b(?=[^>]*\srole="tablist")/' ),
			'toggletip'            => array(
				'awt/toggletip',
				array(
					'label'       => 'L',
					'description' => 'D',
				),
				'',
				'/^<button\b(?=[^>]*\bcds--toggletip-button\b)/',
			),
			'side nav'             => array( 'awt/side-nav', array(), '<!-- wp:awt/side-nav-link {"label":"A","url":"/a"} /-->', '/^<nav\b/' ),
			'header menu'          => array( 'awt/header-menu', array( 'text' => 'Products' ), '<!-- wp:awt/header-nav-item {"text":"A","href":"/a"} /-->', '/^<ul\b(?=[^>]*\bcds--header__menu\b)/' ),
		);
	}

	/**
	 * The panel's aria-label lands on the block's control, once.
	 *
	 * @dataProvider targets
	 *
	 * @param string $name    Block name.
	 * @param array  $attrs   Block attributes.
	 * @param string $inner   Inner markup.
	 * @param string $pattern Regex for the named tag.
	 */
	public function test_name_lands_on_the_control( string $name, array $attrs, string $inner, string $pattern ) {
		$html = $this->render( $name, $attrs + array( 'ariaLabel' => 'PANELNAME' ), $inner );
		$this->assertSame( 1, substr_count( $html, 'aria-label="PANELNAME' ), $html );
		$this->assertMatchesRegularExpression( $pattern, $this->tag_with( $html, 'aria-label', 'PANELNAME' ) );
	}

	/**
	 * Labelled by goes to the same element as the name.
	 *
	 * @dataProvider targets
	 *
	 * @param string $name    Block name.
	 * @param array  $attrs   Block attributes.
	 * @param string $inner   Inner markup.
	 * @param string $pattern Regex for the named tag.
	 */
	public function test_labelledby_lands_on_the_control( string $name, array $attrs, string $inner, string $pattern ) {
		$html = $this->render( $name, $attrs + array( 'ariaLabelledby' => 'panel-source' ), $inner );
		$this->assertMatchesRegularExpression( $pattern, $this->tag_with( $html, 'aria-labelledby', 'panel-source' ) );
	}

	/**
	 * A description is added to the field's own, not swapped for it.
	 */
	public function test_describedby_is_added_to_the_fields_own() {
		$html = $this->render(
			'awt/checkbox',
			array(
				'label'           => 'L',
				'helperText'      => 'Help',
				'ariaDescribedby' => 'panel-desc',
			)
		);
		$this->assertMatchesRegularExpression( '/<input\b[^>]*\baria-describedby="[^"]*-helper panel-desc"/', $html );
	}

	/**
	 * An aria-label on its own removes the aria-labelledby that would beat it.
	 *
	 * @return array[] [ block, attrs, inner ].
	 */
	public function labelledby_owners(): array {
		return array(
			'dropdown'   => array(
				'awt/dropdown',
				array(
					'label'   => 'L',
					'options' => array(
						array(
							'label' => 'A',
							'value' => 'a',
						),
					),
				),
				'',
			),
			'modal'      => array( 'awt/modal', array( 'heading' => 'H' ), '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->' ),
			'data table' => array(
				'awt/data-table',
				array(
					'caption' => 'C',
					'headers' => array(
						array(
							'key'  => 'a',
							'text' => 'A',
						),
					),
					'rows'    => array( array( 'a' => '1' ) ),
				),
				'',
			),
		);
	}

	/**
	 * The named element keeps no aria-labelledby of its own.
	 *
	 * @dataProvider labelledby_owners
	 *
	 * @param string $name  Block name.
	 * @param array  $attrs Block attributes.
	 * @param string $inner Inner markup.
	 */
	public function test_label_beats_the_blocks_own_labelledby( string $name, array $attrs, string $inner ) {
		$tag = $this->tag_with( $this->render( $name, $attrs + array( 'ariaLabel' => 'PANELNAME' ), $inner ), 'aria-label', 'PANELNAME' );
		$this->assertNotSame( '', $tag );
		$this->assertStringNotContainsString( 'aria-labelledby', $tag );
	}

	/**
	 * Blocks with nothing to name write no name.
	 *
	 * @return array[] [ block, attrs, inner ].
	 */
	public function nameless(): array {
		$para = '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->';
		return array(
			'tab panel'        => array( 'awt/tab-panel', array(), $para ),
			'switcher panel'   => array( 'awt/content-switcher-panel', array(), $para ),
			'side nav divider' => array( 'awt/side-nav-divider', array(), '' ),
			'decorative icon'  => array( 'awt/icon', array( 'iconName' => 'add' ), '' ),
			'informative icon' => array(
				'awt/icon',
				array(
					'iconName'   => 'add',
					'decorative' => false,
					'label'      => 'Add',
				),
				'',
			),
			'plain tag'        => array( 'awt/tag', array( 'text' => 'Beta' ), '' ),
		);
	}

	/**
	 * No aria-label or aria-labelledby is written.
	 *
	 * @dataProvider nameless
	 *
	 * @param string $name  Block name.
	 * @param array  $attrs Block attributes.
	 * @param string $inner Inner markup.
	 */
	public function test_nameless_blocks_write_no_name( string $name, array $attrs, string $inner ) {
		$html = $this->render(
			$name,
			$attrs + array(
				'ariaLabel'      => 'PANELNAME',
				'ariaLabelledby' => 'panel-source',
			),
			$inner
		);
		$this->assertStringNotContainsString( 'PANELNAME', $html );
		$this->assertStringNotContainsString( 'panel-source', $html );
	}

	/**
	 * The header navigation's menu button keeps its own name; the panel's
	 * labelled by, role and language go to the `<nav>`.
	 */
	public function test_header_nav_leaves_its_menu_button_alone() {
		$html = $this->render(
			'awt/header-nav',
			array(
				'ariaLabelledby' => 'panel-source',
				'awtLang'        => 'fr',
			),
			'<!-- wp:awt/header-nav-item {"text":"Home","href":"/"} /-->'
		);
		preg_match( '/<button\b[^>]*>/', $html, $button );
		$this->assertStringNotContainsString( 'panel-source', $button[0] );
		$this->assertStringNotContainsString( 'lang=', $button[0] );
		$this->assertMatchesRegularExpression( '/<nav\b[^>]*\baria-labelledby="panel-source"/', $html );
		$this->assertMatchesRegularExpression( '/<nav\b[^>]*\blang="fr"/', $html );
	}

	/**
	 * A Role of presentation is not written onto the element the name is on:
	 * browsers ignore it there, and the element would be generic again.
	 */
	public function test_presentation_gives_way_to_a_name() {
		$html = $this->render(
			'awt/hero',
			array(
				'version'   => 2,
				'awtRole'   => 'presentation',
				'ariaLabel' => 'PANELNAME',
			),
			'<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->'
		);
		$tag  = $this->tag_with( $html, 'aria-label', 'PANELNAME' );
		$this->assertStringContainsString( 'role="group"', $tag );
		$this->assertStringNotContainsString( 'presentation', $html );
	}

	/**
	 * A block registered elsewhere can say where its name goes.
	 */
	public function test_target_is_filterable() {
		$route = static function ( $entry, $name ) {
			return $name === 'awt/stat' ? array( 'name' => array( array( 'tag' => 'P' ) ) ) : $entry;
		};
		add_filter( 'awt_blocks_name_target', $route, 10, 2 );
		$html = $this->render(
			'awt/stat',
			array(
				'value'     => '1',
				'heading'   => 'H',
				'ariaLabel' => 'PANELNAME',
			)
		);
		remove_filter( 'awt_blocks_name_target', $route, 10 );
		$this->assertMatchesRegularExpression( '/^<p\b[^>]*\brole="group"/', $this->tag_with( $html, 'aria-label', 'PANELNAME' ) );
	}

	/**
	 * A header submenu's description goes to its title link, the element that
	 * takes focus; its name stays on the list, as the block's own field says.
	 */
	public function test_header_menu_description_goes_to_its_title() {
		$html = $this->render(
			'awt/header-menu',
			array(
				'text'            => 'Products',
				'ariaDescribedby' => 'panel-desc',
			),
			'<!-- wp:awt/header-nav-item {"text":"A","href":"/a"} /-->'
		);
		$this->assertMatchesRegularExpression( '/^<a\b/', $this->tag_with( $html, 'aria-describedby', 'panel-desc' ) );
	}

	/**
	 * The side nav's language goes with its `<nav>`, which moves into the
	 * header on small screens; a Role stays on the `<aside>`, and presentation
	 * there still removes that landmark.
	 */
	public function test_side_nav_role_and_language() {
		$html = $this->render(
			'awt/side-nav',
			array(
				'awtRole' => 'presentation',
				'awtLang' => 'fr',
			),
			'<!-- wp:awt/side-nav-link {"label":"A","url":"/a"} /-->'
		);
		$this->assertMatchesRegularExpression( '/<aside\b(?=[^>]*\srole="presentation")/', $html );
		$this->assertMatchesRegularExpression( '/<nav\b(?=[^>]*\slang="fr")/', $html );
		$this->assertDoesNotMatchRegularExpression( '/<nav\b[^>]*\srole=/', $html );
	}

	/**
	 * A Role and a name set together stay on one element: the author named
	 * the group or region they made.
	 *
	 * @return array[] [ block, attrs, inner, regex for the named tag ].
	 */
	public function role_and_name(): array {
		return array(
			'toggle'          => array( 'awt/toggle', array( 'label' => 'Email me' ), '', '/^<div(?=[^>]*\bawt-block-wrap\b)(?=[^>]*\srole="group")/' ),
			'expandable tile' => array(
				'awt/tile',
				array(
					'variant' => 'expandable',
					'summary' => 'Show more',
				),
				'<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->',
				'/^<details\b(?=[^>]*\srole="group")/',
			),
		);
	}

	/**
	 * The name follows the Role.
	 *
	 * @dataProvider role_and_name
	 *
	 * @param string $name    Block name.
	 * @param array  $attrs   Block attributes.
	 * @param string $inner   Inner markup.
	 * @param string $pattern Regex for the named tag.
	 */
	public function test_name_stays_with_the_role( string $name, array $attrs, string $inner, string $pattern ) {
		$html = $this->render(
			$name,
			$attrs + array(
				'awtRole'   => 'group',
				'ariaLabel' => 'PANELNAME',
			),
			$inner
		);
		$this->assertSame( 1, substr_count( $html, 'PANELNAME' ) );
		$this->assertMatchesRegularExpression( $pattern, $this->tag_with( $html, 'aria-label', 'PANELNAME' ) );
	}

	/**
	 * A tile in a radio group takes Role and Language on the `<label>` that
	 * is the tile, never on the radio button before it.
	 */
	public function test_radio_tile_role_and_language_go_on_the_tile() {
		$html = $this->render(
			'awt/tile',
			array(
				'variant'   => 'selectable',
				'groupName' => 'plan',
				'awtRole'   => 'group',
				'awtLang'   => 'fr',
			),
			'<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->'
		);
		$this->assertMatchesRegularExpression( '/<label\b(?=[^>]*\srole="group")(?=[^>]*\slang="fr")/', $html );
		$this->assertDoesNotMatchRegularExpression( '/<input\b[^>]*\s(role|lang)=/', $html );
	}

	/**
	 * Every block in the fixtures that can be named carries the panel's name
	 * somewhere, so a target that matches nothing cannot pass unnoticed.
	 *
	 * @dataProvider corpora
	 *
	 * @param string $markup Block markup.
	 */
	public function test_every_nameable_block_carries_the_name( string $markup ) {
		$html    = do_blocks( $this->probe( $markup, 'label' ) );
		$missing = array();
		preg_match_all( '/<!-- wp:(awt\/[a-z0-9-]+) (\{.*?\}) \/?-->/s', $this->probe( $markup, 'label' ), $m, PREG_SET_ORDER );
		$nameless = array( 'awt/tab-panel', 'awt/content-switcher-panel', 'awt/side-nav-divider', 'awt/icon', 'awt/tag' );
		foreach ( $m as $block ) {
			$attrs = json_decode( $block[2], true );
			if ( in_array( $block[1], $nameless, true ) || ! preg_match( '/^PROBE(\d+)$/', $attrs['ariaLabel'] ?? '', $n ) ) {
				continue;
			}
			if ( ! preg_match( '/\saria-label="PROBE' . $n[1] . '[" ]/', $html ) ) {
				$missing[] = $block[1];
			}
		}
		$this->assertSame( array(), $missing );
	}
}
