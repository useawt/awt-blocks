<?php
/**
 * Plugin Name:       AWT Blocks
 * Plugin URI:        https://accessiblewordpresstheme.com
 * Description:       58 accessible blocks built on the Carbon Design System, with an accessibility checker inside the editor. Made to pair with the AWT theme.
 * Version:           2026.01.0-stage1
 * Requires at least: 6.6
 * Requires PHP:      8.1
 * Author:            AWT
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       awt
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const AWT_BLOCKS_VERSION = '2026.01.0-stage1';
const AWT_BLOCKS_FILE    = __FILE__;
const AWT_BLOCKS_DIR     = __DIR__;

// Shared runtime PHP. A working checkout loads these straight from src/shared/
// (edits apply without a rebuild). The distribution zip built by `wp-scripts
// plugin-zip` ships only the Plugin Handbook file list — build/, languages/,
// root PHP + readme — so `npm run build` mirrors these files into build/shared/
// (scripts/mirror-runtime-into-build.js) and the shipped plugin loads the
// mirror instead.
$awt_shared_dir = file_exists( __DIR__ . '/src/shared/render-helpers.php' )
	? __DIR__ . '/src/shared'
	: __DIR__ . '/build/shared';
require_once $awt_shared_dir . '/render-helpers.php';
require_once $awt_shared_dir . '/current-url.php';
require_once $awt_shared_dir . '/faq-schema.php';
require_once $awt_shared_dir . '/global-controls.php';
require_once $awt_shared_dir . '/template-chrome.php';
unset( $awt_shared_dir );

/**
 * Stage 1 block registration list.
 *
 * The 14 Stage 0 blocks carry over unchanged (deprecation policy: never delete a
 * schema). Stage 1 adds the UI shell family (§1) plus the foundational
 * awt/section and awt/icon blocks (§2).
 *
 * Block deprecation policy (Stage 0+):
 *   1. Every block's `registerBlockType` call carries a `deprecated` array.
 *   2. An entry, once added, is NEVER removed.
 *   3. Block-level schema changes do not bump the product version.
 *   4. New attributes get a `default` whose rendered output matches the
 *      pre-existing-attribute behavior (Stage 1 attribute-evolution contract).
 */
const AWT_BLOCKS = array(
	// Stage 0 carry-over.
	'button',
	'link',
	'list',
	'list-item',
	'breadcrumb',
	'breadcrumb-item',
	'checkbox',
	'radio-button-group',
	'radio-button',
	'text-input',
	'toggle',
	'form',
	'menu-button',
	'tooltip',

	// Stage 1 — UI shell family (§1).
	'skip-link',
	'header-brand',
	'header-nav',
	'header-nav-item',
	'header-menu',
	'header-global',
	'header-action',
	'color-scheme-toggle',
	'side-nav',
	'side-nav-section',
	'side-nav-link',
	'side-nav-divider',
	'footer-section',
	'footer-link',

	// Stage 1 — section + icon foundation (§2).
	'section',
	'icon',
	'inline-set',

	// Stage 1 — marketing/section blocks (§2, slice 2).
	'tile',
	'tag',
	'notification',
	'accordion',
	'accordion-item',
	'hero',
	'feature-grid',
	'stat',
	'testimonial',
	'pricing-tile',
	'faq-item',
	'toggletip',
	'password-input',
	'text-area',

	// Stage 1 — interactive + data-display slice.
	'pagination',
	'select',
	'dropdown',
	'content-switcher',
	'content-switcher-item',
	'content-switcher-panel',
	'tabs',
	'tab',
	'tab-panel',
	'modal',
	'modal-opener',
	'code-snippet',
	'data-table',
);

/**
 * Register the 7 AWT subcategories per phase-1 spec §2.
 *
 * Stage 0's umbrella `awt` category is replaced by these seven; existing Stage 0
 * blocks have their `category` field migrated to the matching subcategory in
 * src/<block>/block.json. Registered via `block_categories_all` so they appear
 * in the inserter.
 */
/**
 * Expose the URL of the generated icon manifest to editor JS via the
 * `awtBlocks` global. The IconPicker fetches this URL lazily on first open so
 * the 400+KB JSON doesn't ship with the initial editor bundle.
 */
add_action(
	'enqueue_block_editor_assets',
	static function (): void {
		$manifest_path = __DIR__ . '/build/shared/icon-manifest.json';
		$url           = file_exists( $manifest_path )
			? plugins_url( 'build/shared/icon-manifest.json', __FILE__ )
			: '';
		wp_add_inline_script(
			'wp-blocks',
			sprintf(
				'window.awtBlocks = window.awtBlocks || {}; window.awtBlocks.iconManifestUrl = %s;',
				wp_json_encode( $url )
			),
			'before'
		);

		// IconPicker editor-only styles. The picker is rendered in inspector
		// sidebars where horizontal space is constrained; this stylesheet
		// styles the chip-style current-icon trigger and the dropdown grid.
		// The distribution zip ships only the build/shared/ mirror of this
		// file (see the shared-runtime requires above), so fall back to it.
		$icon_picker_rel = file_exists( __DIR__ . '/src/shared/icon-picker.css' )
			? 'src/shared/icon-picker.css'
			: 'build/shared/icon-picker.css';
		$icon_picker_css = __DIR__ . '/' . $icon_picker_rel;
		if ( file_exists( $icon_picker_css ) ) {
			wp_enqueue_style(
				'awt-icon-picker',
				plugins_url( $icon_picker_rel, __FILE__ ),
				array(),
				(string) filemtime( $icon_picker_css )
			);
		}

		// Plugin-wide editor bundle (src/index.js → build/index.js): the §4
		// accessibility linter and, later, the Accessibility panel + palette
		// contrast checking. Dependencies + version come from the build's
		// generated .asset.php. This is the only editor-wide bundle; per-block
		// bundles are registered from their own block.json.
		$editor_asset = __DIR__ . '/build/index.asset.php';
		$editor_js    = __DIR__ . '/build/index.js';
		if ( file_exists( $editor_asset ) && file_exists( $editor_js ) ) {
			$asset = require $editor_asset;
			wp_enqueue_script(
				'awt-editor',
				plugins_url( 'build/index.js', __FILE__ ),
				$asset['dependencies'],
				$asset['version'],
				true
			);
			wp_set_script_translations( 'awt-editor', 'awt' );

			// Bridge the EFFECTIVE document language the front end emits via
			// language_attributes() (get_bloginfo('language'), e.g. "en-US").
			// The linter's document-lang check uses this rather than the editor
			// canvas iframe, which doesn't replicate language_attributes() and
			// would otherwise produce a false "language not set" on every page.
			wp_localize_script(
				'awt-editor',
				'awtEditorData',
				array( 'documentLang' => get_bloginfo( 'language' ) )
			);

			$editor_css = __DIR__ . '/build/index.css';
			if ( file_exists( $editor_css ) ) {
				wp_enqueue_style(
					'awt-editor',
					plugins_url( 'build/index.css', __FILE__ ),
					array(),
					$asset['version']
				);
			}
		}
	}
);

/**
 * Inject the linter's canvas edge-marker CSS into the block-editor iframe.
 * Styles enqueued via enqueue_block_editor_assets land in the main frame only;
 * the flagged-block class added by the canvas-marker HOC lives inside the
 * iframed canvas, so its CSS must travel through the editor settings' styles.
 */
add_filter(
	'block_editor_settings_all',
	static function ( array $settings ): array {
		$css                  = '.awt-a11y-flagged{position:relative}'
			. '.awt-a11y-flagged::after{content:"";position:absolute;inset-block:0;inset-inline-start:-4px;width:3px;border-radius:2px;pointer-events:none}'
			. '.awt-a11y-flagged--error::after{background:#da1e28}'
			. '.awt-a11y-flagged--warning::after{background:#8a6d00}'
			. '.awt-a11y-flagged--info::after{background:#0043ce}';
		$settings['styles']   = $settings['styles'] ?? array();
		$settings['styles'][] = array( 'css' => $css );
		return $settings;
	}
);

add_filter(
	'block_categories_all',
	static function ( array $categories ): array {
		$awt_subcategories = array(
			array(
				'slug'  => 'awt-ui-shell',
				'title' => __( 'AWT — UI shell', 'awt' ),
				'icon'  => null,
			),
			array(
				'slug'  => 'awt-navigation',
				'title' => __( 'AWT — Navigation', 'awt' ),
				'icon'  => null,
			),
			array(
				'slug'  => 'awt-forms',
				'title' => __( 'AWT — Forms', 'awt' ),
				'icon'  => null,
			),
			array(
				'slug'  => 'awt-content',
				'title' => __( 'AWT — Content', 'awt' ),
				'icon'  => null,
			),
			array(
				'slug'  => 'awt-feedback',
				'title' => __( 'AWT — Feedback', 'awt' ),
				'icon'  => null,
			),
			array(
				'slug'  => 'awt-data-display',
				'title' => __( 'AWT — Data display', 'awt' ),
				'icon'  => null,
			),
			array(
				'slug'  => 'awt-section',
				'title' => __( 'AWT — Sections', 'awt' ),
				'icon'  => null,
			),
		);
		return array_merge( $awt_subcategories, $categories );
	}
);

/**
 * Register every block from its built block.json.
 *
 * Each block's source lives in src/<slug>/ and is mirrored into build/<slug>/ by
 *
 * @wordpress/scripts. Until npm run build runs we register from src/ directly so
 * a fresh checkout boots; once build/ exists, that wins because it carries the
 * compiled edit.js.
 */
add_action(
	'init',
	static function (): void {
		foreach ( AWT_BLOCKS as $slug ) {
			$built_dir = __DIR__ . '/build/' . $slug;
			$src_dir   = __DIR__ . '/src/' . $slug;
			$dir       = file_exists( $built_dir . '/block.json' )
				? $built_dir
				: ( file_exists( $src_dir . '/block.json' ) ? $src_dir : null );
			if ( $dir !== null ) {
				register_block_type_from_metadata( $dir );
			}
		}
	}
);
