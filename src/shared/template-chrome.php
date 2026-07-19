<?php
/**
 * AWT template chrome — content-inserter gate.
 *
 * Carbon's side nav is UI shell: `.cds--side-nav` is position:fixed viewport
 * chrome that docks to the left edge of the site, below the header. That is
 * correct when the block lives in a template or template part (the theme
 * ships a "Side navigation" part for exactly this), but inside post content
 * it detaches from wherever the author placed it and pins itself over the
 * page — colliding with the site header.
 *
 * So the side-nav block is offered only where templates are edited: this
 * filter removes it from the inserter when a specific content post is being
 * edited (the post/page editor, the pattern editor) and leaves template and
 * template-part editing — and every context with no single edited post, like
 * the Site Editor — untouched. The side-nav child blocks (section / link /
 * divider) declare `parent`, so they follow automatically.
 *
 * Existing content instances are unaffected: the block stays registered, so
 * anything already saved keeps rendering and stays editable.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\TemplateChrome;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Blocks that only work as template chrome, never inside post content.
 *
 * @var string[]
 */
const TEMPLATE_ONLY_BLOCKS = array( 'awt/side-nav' );

/**
 * Remove template-only blocks from the inserter when post content is edited.
 *
 * Note: when the incoming list is `true` (allow all) and we must restrict, we
 * materialize it from the server-side registry — same trade-off the theme's
 * design-system inserter filter makes when it restricts.
 *
 * @param bool|string[]                 $allowed Current allowed list (true = all).
 * @param \WP_Block_Editor_Context|null $context Editor context.
 * @return bool|string[]
 */
function filter_allowed( $allowed, $context = null ) {
	$post = $context->post ?? null;
	if ( ! $post instanceof \WP_Post ) {
		// No single edited post: Site Editor (templates, template parts) et al.
		return $allowed;
	}
	if ( in_array( $post->post_type, array( 'wp_template', 'wp_template_part' ), true ) ) {
		return $allowed;
	}
	if ( false === $allowed ) {
		return $allowed;
	}
	$list = is_array( $allowed )
		? $allowed
		: array_keys( \WP_Block_Type_Registry::get_instance()->get_all_registered() );

	return array_values( array_diff( $list, TEMPLATE_ONLY_BLOCKS ) );
}

add_filter( 'allowed_block_types_all', __NAMESPACE__ . '\\filter_allowed', 10, 2 );
