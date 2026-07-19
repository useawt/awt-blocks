<?php
/**
 * AWT global block controls — server side.
 *
 * Cross-cutting "Spacing" feature for every TOP-LEVEL AWT block (no `parent`):
 *
 *   1. Registers an `awtSpacing` attribute (default '05') on those blocks via
 *      register_block_type_args, so the attribute exists for both the PHP
 *      render and the editor regardless of script load order.
 *   2. On render_block, injects an `awt-spacing-NN` class onto the block's
 *      outer element. theme.css turns that class into a bottom margin using
 *      the matching Carbon spacing token (`--cds-spacing-NN`). Default 05.
 *   3. Enqueues assets/global-block-controls.js, which adds the editor
 *      Spacing panel + the Carbon component documentation links.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\GlobalControls;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const PREFIX          = 'awt/';
const SPACING_DEFAULT = '05';

/**
 * Add the `awtSpacing` attribute to top-level AWT blocks at registration.
 */
add_filter(
	'register_block_type_args',
	static function ( array $args, string $name ): array {
		if ( strpos( $name, PREFIX ) !== 0 ) {
			return $args;
		}
		// Child/inline blocks (those declaring a parent) are spaced by their
		// container — they don't get the control or the default.
		if ( ! empty( $args['parent'] ) ) {
			return $args;
		}
		// UI-shell blocks (header / nav / footer) live in horizontal
		// template-part layouts; a bottom margin would break them. They keep
		// their Carbon doc link (editor) but opt out of spacing.
		if ( isset( $args['category'] ) && $args['category'] === 'awt-ui-shell' ) {
			return $args;
		}
		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = array();
		}
		if ( ! isset( $args['attributes']['awtSpacing'] ) ) {
			$args['attributes']['awtSpacing'] = array(
				'type'    => 'string',
				'default' => SPACING_DEFAULT,
			);
		}
		return $args;
	},
	10,
	2
);

/**
 * Spacing control on CORE blocks (opt-in).
 *
 * The same Carbon-token bottom-margin control AWT blocks get is also offered on
 * top-level core blocks — but OPT-IN: the `awtSpacing` attribute defaults to ''
 * (no class emitted, block keeps its theme/blockGap spacing) and a class is only
 * added once the author picks a token. AWT blocks keep their forced default of
 * '05'; core blocks must not be force-margined site-wide. Child blocks (declared
 * parent/ancestor) and a denylist of structural/invisible blocks are excluded.
 */
const CORE_SPACING_DENY = array(
	'core/spacer',
	'core/nextpage',
	'core/more',
	'core/freeform',
	'core/html',
	'core/shortcode',
	'core/missing',
	'core/block',
	'core/template-part',
	'core/post-content',
	'core/query',
	'core/legacy-widget',
	'core/widget-group',
	'core/navigation',
	'core/list-item',
	'core/page-list-item',
);

/**
 * Whether a core block is in scope for the opt-in Spacing control.
 *
 * @param string $name Block name (e.g. 'core/paragraph').
 * @param array  $args Block registration args.
 */
function is_core_spacing_block( string $name, array $args ): bool {
	if ( strpos( $name, 'core/' ) !== 0 ) {
		return false;
	}
	if ( in_array( $name, CORE_SPACING_DENY, true ) ) {
		return false;
	}
	// Child/inner-only blocks are spaced by their container.
	return empty( $args['parent'] ) && empty( $args['ancestor'] );
}

/**
 * Per-block default Spacing token for core blocks. Most core blocks are opt-in
 * (default '' = no AWT spacing), but core/paragraph defaults to '05' (16px) to
 * match AWT blocks' bottom-margin rhythm. Mirror in global-block-controls.js.
 */
const CORE_SPACING_DEFAULTS = array( 'core/paragraph' => '05' );

/**
 * The default spacing token for a core block ('' = none).
 *
 * @param string $name Block name.
 */
function core_spacing_default( string $name ): string {
	return CORE_SPACING_DEFAULTS[ $name ] ?? '';
}

/**
 * Add the `awtSpacing` attribute to in-scope core blocks (per-block default).
 */
add_filter(
	'register_block_type_args',
	static function ( array $args, string $name ): array {
		if ( ! is_core_spacing_block( $name, $args ) ) {
			return $args;
		}
		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = array();
		}
		if ( ! isset( $args['attributes']['awtSpacing'] ) ) {
			$args['attributes']['awtSpacing'] = array(
				'type'    => 'string',
				'default' => core_spacing_default( $name ),
			);
		}
		return $args;
	},
	10,
	2
);

/**
 * Add a class to the first opening tag of a block's rendered HTML.
 *
 * @param string $content    Rendered block HTML.
 * @param string $class_name Class to add.
 */
function add_class_to_first_tag( string $content, string $class_name ): string {
	if ( ! preg_match( '/<[a-zA-Z][^>]*>/', $content, $m, PREG_OFFSET_CAPTURE ) ) {
		return $content;
	}
	$tag    = $m[0][0];
	$offset = (int) $m[0][1];
	if ( preg_match( '/\sclass="([^"]*)"/', $tag, $cm ) ) {
		$new_tag = str_replace( $cm[0], ' class="' . $cm[1] . ' ' . $class_name . '"', $tag );
	} else {
		$new_tag = preg_replace( '/(\s*\/?>)$/', ' class="' . $class_name . '"$1', $tag, 1 );
	}
	return substr_replace( $content, $new_tag, $offset, strlen( $tag ) );
}

/**
 * Emit `awt-spacing-NN` on a core block ONLY when the author picked a token.
 */
add_filter(
	'render_block',
	static function ( string $content, array $block ): string {
		$name = $block['blockName'] ?? '';
		if ( strpos( $name, 'core/' ) !== 0 || trim( $content ) === '' ) {
			return $content;
		}
		// The render_block filter gets RAW parsed attrs (registered defaults are NOT merged.
			// here), so fall back to the per-block default — that's how core/paragraph's
			// '05' reaches the front end when unchanged. Explicit '' (author chose
			// "None") is preserved as '' and emits nothing.
			$token = isset( $block['attrs']['awtSpacing'] ) ? (string) $block['attrs']['awtSpacing'] : core_spacing_default( $name );
		if ( $token === '' || ! preg_match( '/^(0[1-9]|1[0-3])$/', $token ) ) {
			return $content; // Opt-in: nothing chosen → leave the block untouched.
		}
		if ( in_array( $name, CORE_SPACING_DENY, true ) ) {
			return $content;
		}
		$type = \WP_Block_Type_Registry::get_instance()->get_registered( $name );
		if ( $type && ( ! empty( $type->parent ) || ! empty( $type->ancestor ) ) ) {
			return $content;
		}
		return add_class_to_first_tag( $content, 'awt-spacing-' . $token );
	},
	10,
	2
);

/**
 * Accessibility-panel attributes (§4 Part 2). Registered on EVERY AWT block
 * (including child / UI-shell blocks — an accessible name or lang is meaningful
 * everywhere, unlike bottom-margin spacing). The editor panel writes them; the
 * render_block filter below emits them onto the block's outer element.
 */
const A11Y_ATTRS = array( 'ariaLabel', 'ariaDescribedby', 'ariaLabelledby', 'awtRole', 'awtLang' );

add_filter(
	'register_block_type_args',
	static function ( array $args, string $name ): array {
		if ( strpos( $name, PREFIX ) !== 0 ) {
			return $args;
		}
		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = array();
		}
		foreach ( A11Y_ATTRS as $key ) {
			if ( ! isset( $args['attributes'][ $key ] ) ) {
				$args['attributes'][ $key ] = array(
					'type'    => 'string',
					'default' => '',
				);
			}
		}
		return $args;
	},
	10,
	2
);

/**
 * Emit the Accessibility-panel attributes onto the block's outer element. Each
 * is added only when set AND not already present on the first tag (so a block
 * whose render.php already outputs, say, aria-label is never double-written).
 */
add_filter(
	'render_block',
	static function ( string $content, array $block ): string {
		$name = $block['blockName'] ?? '';
		if ( strpos( $name, PREFIX ) !== 0 || trim( $content ) === '' ) {
			return $content;
		}
		$map   = array(
			'ariaLabel'       => 'aria-label',
			'ariaDescribedby' => 'aria-describedby',
			'ariaLabelledby'  => 'aria-labelledby',
			'awtRole'         => 'role',
			'awtLang'         => 'lang',
		);
		$attrs = $block['attrs'] ?? array();
		$add   = array();
		foreach ( $map as $attr_key => $html_attr ) {
			$v = isset( $attrs[ $attr_key ] ) ? trim( (string) $attrs[ $attr_key ] ) : '';
			if ( $v !== '' ) {
				$add[ $html_attr ] = $v;
			}
		}
		if ( ! $add ) {
			return $content;
		}
		if ( ! preg_match( '/<[a-zA-Z][^>]*>/', $content, $m, PREG_OFFSET_CAPTURE ) ) {
			return $content;
		}
		$tag     = $m[0][0];
		$offset  = (int) $m[0][1];
		$new_tag = $tag;
		foreach ( $add as $html_attr => $v ) {
			if ( preg_match( '/\s' . preg_quote( $html_attr, '/' ) . '=/i', $new_tag ) ) {
				continue; // Already on the tag — don't clobber render.php's value.
			}
			$new_tag = preg_replace( '/(\s*\/?>)$/', ' ' . $html_attr . '="' . esc_attr( $v ) . '"$1', $new_tag, 1 );
		}
		if ( $new_tag === $tag ) {
			return $content;
		}
		return substr_replace( $content, $new_tag, $offset, strlen( $tag ) );
	},
	11,
	2
);

/**
 * Element-language support for core text blocks. The editor adds an `awtLang`
 * attribute to core/paragraph, core/heading and core/list-item (see
 * accessibility-panel.js); mirror the registration here so the server parses it,
 * and emit it as a `lang` attribute on the block's outer tag.
 */
const LANG_CORE_BLOCKS = array( 'core/paragraph', 'core/heading', 'core/list-item' );

add_filter(
	'register_block_type_args',
	static function ( array $args, string $name ): array {
		if ( ! in_array( $name, LANG_CORE_BLOCKS, true ) ) {
			return $args;
		}
		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = array();
		}
		if ( ! isset( $args['attributes']['awtLang'] ) ) {
			$args['attributes']['awtLang'] = array(
				'type'    => 'string',
				'default' => '',
			);
		}
		return $args;
	},
	10,
	2
);

add_filter(
	'render_block',
	static function ( string $content, array $block ): string {
		$name = $block['blockName'] ?? '';
		if ( ! in_array( $name, LANG_CORE_BLOCKS, true ) || trim( $content ) === '' ) {
			return $content;
		}
		$lang = isset( $block['attrs']['awtLang'] ) ? trim( (string) $block['attrs']['awtLang'] ) : '';
		if ( $lang === '' ) {
			return $content;
		}
		if ( ! preg_match( '/<[a-zA-Z][^>]*>/', $content, $m, PREG_OFFSET_CAPTURE ) ) {
			return $content;
		}
		$tag = $m[0][0];
		if ( preg_match( '/\slang=/i', $tag ) ) {
			return $content; // Don't clobber an existing lang.
		}
		$new_tag = preg_replace( '/(\s*\/?>)$/', ' lang="' . esc_attr( $lang ) . '"$1', $tag, 1 );
		return substr_replace( $content, $new_tag, (int) $m[0][1], strlen( $tag ) );
	},
	11,
	2
);

/**
 * Normalize a spacing token to one of 01–13, falling back to the default.
 *
 * @param mixed $token Raw token value.
 */
function clamp_token( $token ): string {
	$token = (string) $token;
	return preg_match( '/^(0[1-9]|1[0-3])$/', $token ) ? $token : SPACING_DEFAULT;
}

/**
 * Inject the `awt-spacing-NN` class onto the rendered block's outer element.
 */
add_filter(
	'render_block',
	static function ( string $content, array $block ): string {
		$name = $block['blockName'] ?? '';
		if ( strpos( $name, PREFIX ) !== 0 || trim( $content ) === '' ) {
			return $content;
		}
		// Skip child/inline blocks (declared parent) and UI-shell blocks
		// (structural template-part layouts) — same scope as the attribute.
		$type = \WP_Block_Type_Registry::get_instance()->get_registered( $name );
		if ( $type && ( ! empty( $type->parent ) || $type->category === 'awt-ui-shell' ) ) {
			return $content;
		}

		// awt/section's "No gap below" switch wins over the spacing token:
		// the section sits flush against whatever follows it.
		if ( $name === 'awt/section' && ! empty( $block['attrs']['noGapBelow'] ) ) {
			$class = 'awt-spacing-none';
		} else {
			$token = clamp_token( $block['attrs']['awtSpacing'] ?? SPACING_DEFAULT );
			$class = 'awt-spacing-' . $token;
		}

		// Add the class to the FIRST opening tag of the rendered output.
		if ( ! preg_match( '/<[a-zA-Z][^>]*>/', $content, $m, PREG_OFFSET_CAPTURE ) ) {
			return $content;
		}
		$tag    = $m[0][0];
		$offset = (int) $m[0][1];

		if ( preg_match( '/\sclass="([^"]*)"/', $tag, $cm ) ) {
			$new_tag = str_replace( $cm[0], ' class="' . $cm[1] . ' ' . $class . '"', $tag );
		} else {
			// No class attribute on the first tag — add one before the close.
			$new_tag = preg_replace( '/(\s*\/?>)$/', ' class="' . $class . '"$1', $tag, 1 );
		}

		return substr_replace( $content, $new_tag, $offset, strlen( $tag ) );
	},
	10,
	2
);

/**
 * Enqueue the editor UI (Spacing panel + Carbon doc links).
 */
add_action(
	'enqueue_block_editor_assets',
	static function (): void {
		// The distribution zip ships only the build/assets/ mirror of this
		// file (scripts/mirror-runtime-into-build.js), so fall back to it.
		$rel = 'assets/global-block-controls.js';
		if ( ! file_exists( \AWT\Blocks\AWT_BLOCKS_DIR . '/' . $rel ) ) {
			$rel = 'build/assets/global-block-controls.js';
		}
		$path = \AWT\Blocks\AWT_BLOCKS_DIR . '/' . $rel;
		if ( ! file_exists( $path ) ) {
			return;
		}
		wp_enqueue_script(
			'awt-global-block-controls',
			plugins_url( $rel, \AWT\Blocks\AWT_BLOCKS_FILE ),
			array( 'wp-hooks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-compose', 'wp-i18n', 'wp-blocks' ),
			(string) filemtime( $path ),
			true
		);
		wp_set_script_translations( 'awt-global-block-controls', 'awt' );
	}
);
