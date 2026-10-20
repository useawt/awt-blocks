<?php
/**
 * Navigation links say which page and which section the reader is in.
 *
 * The matcher ignored the query string, so on search results the Home link
 * was announced as the current page, and a section link set to "This address
 * or any page under it" was announced as the current page on every page
 * beneath it (outside accessibility review, 2026-10-20). Now the page itself
 * is aria-current="page", a section above it is aria-current="true", and
 * search results and 404 pages mark nothing.
 *
 * @package AWT\Blocks
 */

/**
 * Checks aria-current on navigation links.
 */
class Test_Nav_Current extends WP_UnitTestCase {

	/**
	 * The request URI before the test, which go_to() replaces.
	 *
	 * @var string|null
	 */
	private $request_uri;

	/**
	 * Remember the request URI.
	 */
	public function set_up() {
		parent::set_up();
		$this->request_uri = $_SERVER['REQUEST_URI'] ?? null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- saved to restore, never output.
	}

	/**
	 * Put the request URI and plain permalinks back: later tests build links
	 * from both.
	 */
	public function tear_down() {
		$this->set_permalink_structure( '' );
		if ( null === $this->request_uri ) {
			unset( $_SERVER['REQUEST_URI'] );
		} else {
			$_SERVER['REQUEST_URI'] = $this->request_uri;
		}
		parent::tear_down();
	}

	/**
	 * Renders a header navigation link.
	 *
	 * @param array $attrs Block attributes.
	 * @return string Rendered HTML.
	 */
	private function nav_item( array $attrs ): string {
		return do_blocks( '<!-- wp:awt/header-nav-item ' . wp_json_encode( $attrs ) . ' /-->' );
	}

	/**
	 * The aria-current a header link to this address gets, or null.
	 *
	 * @param string $href Link address.
	 * @param string $mode 'exact' or 'prefix'.
	 * @return string|null
	 */
	private function current_state( string $href, string $mode = 'exact' ): ?string {
		$html = $this->nav_item(
			array(
				'text'      => 'Link',
				'href'      => $href,
				'matchMode' => $mode,
			)
		);
		return preg_match( '/aria-current="([^"]*)"/', $html, $m ) ? $m[1] : null;
	}

	/**
	 * Search results and missing pages are no menu item's page.
	 */
	public function test_search_and_404_mark_nothing() {
		$this->go_to( home_url( '/?s=library' ) );
		$this->assertNull( $this->current_state( '/' ) );
		$this->assertStringNotContainsString(
			'aria-current',
			$this->nav_item(
				array(
					'text' => 'Home',
					'href' => '/',
				)
			)
		);

		$this->set_permalink_structure( '/%postname%/' );
		$this->go_to( home_url( '/no-such-page/' ) );
		$this->assertTrue( is_404() );
		$this->assertNull( $this->current_state( '/' ) );
		$this->assertNull( $this->current_state( '/no-such-page/' ) );
	}

	/**
	 * Home is the current page on the front page only.
	 */
	public function test_home_is_current_on_the_front_page() {
		$this->go_to( home_url( '/' ) );
		$this->assertSame( 'page', $this->current_state( '/' ) );
		$this->assertStringContainsString(
			'aria-current="page"',
			$this->nav_item(
				array(
					'text' => 'Home',
					'href' => '/',
				)
			)
		);
	}

	/**
	 * With plain permalinks every request path is "/": Home is not every page,
	 * and a link with a query string matches only its own page.
	 */
	public function test_plain_permalinks_match_by_query() {
		$page  = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$other = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$this->go_to( home_url( '/?page_id=' . $page ) );
		$this->assertNull( $this->current_state( '/' ) );
		$this->assertSame( 'page', $this->current_state( '/?page_id=' . $page ) );
		$this->assertNull( $this->current_state( '/?page_id=' . $other ) );
	}

	/**
	 * A section link is "true" beneath it and "page" on its own page.
	 */
	public function test_section_link_is_true_beneath_it() {
		$this->set_permalink_structure( '/%postname%/' );
		$blocks = self::factory()->post->create(
			array(
				'post_type' => 'page',
				'post_name' => 'blocks',
			)
		);
		self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_name'   => 'accordion',
				'post_parent' => $blocks,
			)
		);

		$this->go_to( home_url( '/blocks/accordion/' ) );
		$this->assertSame( 'true', $this->current_state( '/blocks/', 'prefix' ) );
		$this->assertNull( $this->current_state( '/blocks/', 'exact' ) );
		$this->assertSame( 'page', $this->current_state( '/blocks/accordion/' ) );
		$this->assertMatchesRegularExpression(
			'#<a class="cds--header__menu-item cds--header__menu-item--current" href="/blocks/" aria-current="true">Blocks</a>#',
			$this->nav_item(
				array(
					'text'      => 'Blocks',
					'href'      => '/blocks/',
					'matchMode' => 'prefix',
				)
			)
		);
		$side = do_blocks( '<!-- wp:awt/side-nav-link {"text":"Blocks","href":"/blocks/","matchMode":"prefix"} /-->' );
		$this->assertMatchesRegularExpression( '#cds--side-nav__link--current" href="/blocks/" aria-current="true"#', $side );

		$this->go_to( home_url( '/blocks/' ) );
		$this->assertSame( 'page', $this->current_state( '/blocks/', 'prefix' ) );
		$this->assertMatchesRegularExpression(
			'#<a class="cds--header__menu-item" href="/blocks/" aria-current="page">#',
			$this->nav_item(
				array(
					'text'      => 'Blocks',
					'href'      => '/blocks/',
					'matchMode' => 'prefix',
				)
			)
		);
	}
}
