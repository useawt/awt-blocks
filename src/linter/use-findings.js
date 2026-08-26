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
import { store as blockEditorStore } from '@wordpress/block-editor';
import { runChecks, blockBg } from './checks';

// Site language bridged from PHP get_bloginfo('language'); the page-level
// override (awt_theme_page_lang meta) wins when set. Not read from the canvas iframe
// (which is empty even when the published page declares a lang).
function siteDocumentLang() {
	const data =
		( typeof window !== 'undefined' && window.awtEditorData ) || {};
	return data.documentLang;
}

export function useFindings() {
	const { blocks, colors, effectiveBg, documentLang } = useSelect(
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

			// Effective background per block: its own, else the nearest ancestor's.
			// getBlockParents(id, true) is ordered nearest-first.
			const bg = {};
			const ownBgCache = {};
			const ownBg = ( id, b ) => {
				if ( ! ( id in ownBgCache ) ) {
					ownBgCache[ id ] = blockBg( b, colorMap );
				}
				return ownBgCache[ id ];
			};
			list.forEach( ( b ) => {
				let resolved = ownBg( b.clientId, b );
				if ( ! resolved ) {
					const parents = be.getBlockParents( b.clientId, true );
					for ( const pid of parents ) {
						const pbg = ownBg( pid, be.getBlock( pid ) || {} );
						if ( pbg ) {
							resolved = pbg;
							break;
						}
					}
				}
				if ( resolved ) {
					bg[ b.clientId ] = resolved;
				}
			} );

			return {
				blocks: list,
				colors: colorMap,
				effectiveBg: bg,
				documentLang: effectiveLang,
			};
		},
		[]
	);

	return useMemo(
		() =>
			runChecks( blocks, {
				flat: true,
				colors,
				effectiveBg,
				documentLang,
			} ),
		[ blocks, colors, effectiveBg, documentLang ]
	);
}
