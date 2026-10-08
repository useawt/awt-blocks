/**
 * useFindings — reactive accessibility findings for the whole edited document.
 *
 * Uses getClientIdsWithDescendants() (NOT getBlocks()+innerBlocks): in the
 * default page rendering mode ("template-locked"), getBlocks() returns only the
 * template and the page content sits in core/post-content as *controlled* inner
 * blocks. getClientIdsWithDescendants() returns every block — template parts,
 * post title, AND the controlled page content — each with its real clientId, so
 * findings line up with the blocks the per-block surfaces render.
 */

import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { runChecks, ALL_CHECKS, SEVERITY } from './checks';
import { LINTER_STORE } from './store';
import { editorSchemes } from './scope-colors';

/**
 * The checks to run. `awt.linterChecks` lets another plugin add checks for its
 * own blocks: each takes the flat block list and the run context and returns
 * findings, `{ clientId, checkId, severity, title, description }`, where
 * `severity` is one of `SEVERITY` (passed as the second argument) and
 * `checkId` is a string of the plugin's own, so it never collides with the
 * numbered checks here.
 *
 * Read on every run, so a check added after the editor loaded is picked up.
 */
function checks() {
	const filtered = applyFilters( 'awt.linterChecks', ALL_CHECKS, SEVERITY );
	return Array.isArray( filtered ) ? filtered : ALL_CHECKS;
}

// Site language bridged from PHP get_bloginfo('language'); the page-level
// override (awt_theme_page_lang meta) wins when set. Not read from the canvas iframe
// (which is empty even when the published page declares a lang).
function siteDocumentLang() {
	const data =
		( typeof window !== 'undefined' && window.awtEditorData ) || {};
	return data.documentLang;
}

export function useFindings() {
	// Read on its own: the selector below must not touch the linter store,
	// which this hook writes to, or every write would run it again.
	const scopeColors = useSelect(
		( select ) => select( LINTER_STORE ).getScopeColors(),
		[]
	);
	const { blocks, colors, ancestors, documentLang } = useSelect(
		( select ) => {
			const be = select( blockEditorStore );
			const settings = be.getSettings();

			// Effective document language for the linter: per-page override
			// (awt_theme_page_lang) → site language bridge. Reactive as the author sets it.
			const editor = select( 'core/editor' );
			const meta =
				editor && editor.getEditedPostAttribute
					? editor.getEditedPostAttribute( 'meta' )
					: null;
			const pageLang =
				meta && meta.awt_theme_page_lang
					? String( meta.awt_theme_page_lang ).trim()
					: '';
			const effectiveLang = pageLang || siteDocumentLang();

			const colorMap = {};
			( settings.colors || [] ).forEach( ( c ) => {
				if ( c && c.slug && c.color ) {
					colorMap[ c.slug ] = c.color;
				}
			} );

			const ids = be.getClientIdsWithDescendants();
			const list = ids
				.map( ( id ) => be.getBlock( id ) )
				.filter( Boolean );

			// Ancestors per block, nearest first (getBlockParents(id, true)),
			// so the contrast checks can find the surface and the theme each
			// block sits in.
			const parents = {};
			list.forEach( ( b ) => {
				parents[ b.clientId ] = be
					.getBlockParents( b.clientId, true )
					.map( ( pid ) => be.getBlock( pid ) )
					.filter( Boolean );
			} );

			return {
				blocks: list,
				colors: colorMap,
				ancestors: parents,
				documentLang: effectiveLang,
			};
		},
		[]
	);

	return useMemo(
		() =>
			runChecks(
				blocks,
				{
					flat: true,
					colors,
					ancestors,
					scopeColors,
					schemes: editorSchemes(),
					documentLang,
				},
				checks()
			),
		[ blocks, colors, ancestors, scopeColors, documentLang ]
	);
}
