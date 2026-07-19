<?php
/**
 * Tests for the template-chrome content-inserter gate in src/shared/.
 *
 * @package AWT\Blocks
 */

use function AWT\Blocks\TemplateChrome\filter_allowed;
use const AWT\Blocks\TemplateChrome\TEMPLATE_ONLY_BLOCKS;

/**
 * The side-nav block is template chrome: hidden from the inserter while
 * post content is edited, offered everywhere templates are edited.
 */
class Test_Template_Chrome extends WP_UnitTestCase {

	/**
	 * Build a WP_Block_Editor_Context editing a post of the given type.
	 *
	 * @param string $post_type Post type for the edited post.
	 * @return WP_Block_Editor_Context
	 */
	private function context_for_post_type( string $post_type ): WP_Block_Editor_Context {
		$post = self::factory()->post->create_and_get( array( 'post_type' => $post_type ) );
		return new WP_Block_Editor_Context( array( 'post' => $post ) );
	}

	/**
	 * Editing a page: side-nav is removed from an allow-all (`true`) list,
	 * which materializes to the registry minus the gated blocks.
	 */
	public function test_page_content_editing_hides_side_nav() {
		$result = filter_allowed( true, $this->context_for_post_type( 'page' ) );

		$this->assertIsArray( $result );
		$this->assertNotContains( 'awt/side-nav', $result );
		$this->assertContains( 'awt/header-nav', $result, 'Only side-nav is gated — the rest of the UI shell stays.' );
		$this->assertContains( 'core/paragraph', $result );
	}

	/**
	 * Editing a post with an explicit allowed array: only side-nav is dropped.
	 */
	public function test_post_content_editing_filters_explicit_list() {
		$allowed = array( 'core/paragraph', 'awt/side-nav', 'awt/button' );
		$result  = filter_allowed( $allowed, $this->context_for_post_type( 'post' ) );

		$this->assertSame( array( 'core/paragraph', 'awt/button' ), $result );
	}

	/**
	 * Template and template-part editing keeps the incoming list untouched.
	 */
	public function test_template_editing_is_untouched() {
		foreach ( array( 'wp_template', 'wp_template_part' ) as $type ) {
			$this->assertTrue( filter_allowed( true, $this->context_for_post_type( $type ) ) );
		}
	}

	/**
	 * Contexts with no edited post (Site Editor and friends) are untouched.
	 */
	public function test_no_post_context_is_untouched() {
		$context = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );
		$this->assertTrue( filter_allowed( true, $context ) );
		$this->assertTrue( filter_allowed( true, null ) );
	}

	/**
	 * `false` (nothing allowed) passes through — nothing to restrict further.
	 */
	public function test_false_passes_through() {
		$this->assertFalse( filter_allowed( false, $this->context_for_post_type( 'page' ) ) );
	}

	/**
	 * The filter is actually hooked, and the child blocks need no gating of
	 * their own: they declare `parent`, so the inserter only offers them
	 * inside a side-nav.
	 */
	public function test_hooked_and_children_covered_by_parent() {
		$this->assertNotFalse( has_filter( 'allowed_block_types_all', 'AWT\Blocks\TemplateChrome\filter_allowed' ) );

		$registry = WP_Block_Type_Registry::get_instance();
		foreach ( array( 'awt/side-nav-section', 'awt/side-nav-link', 'awt/side-nav-divider' ) as $child ) {
			$block_type = $registry->get_registered( $child );
			$this->assertNotNull( $block_type, "$child is registered" );
			$this->assertNotEmpty( $block_type->parent, "$child declares a parent" );
		}

		foreach ( TEMPLATE_ONLY_BLOCKS as $name ) {
			$this->assertNotNull( $registry->get_registered( $name ), "$name is registered (gate hides it from the inserter only)" );
		}
	}
}
