/**
 * Where an icon's SVG sits in the bundle the plugin ships.
 *
 * Kept apart from the picker so it can be tested on its own: the picker pulls
 * in half of `@wordpress/components`, and this is arithmetic on a filename.
 */

import tokenIndex from './icon-token-index.json';

// Derive the plugin base URL EAGERLY at module load. The current-icon thumb
// in the chip needs this URL to render before the picker grid is ever opened
// — previously this was set lazily inside loadManifest(), so an icon saved
// on a block showed no preview thumbnail until the user clicked the picker.
const manifestPluginUrl = ( () => {
	const url =
		( typeof window !== 'undefined' &&
			window.awtBlocks &&
			window.awtBlocks.iconManifestUrl ) ||
		'';
	return url
		? url.replace( /\/build\/shared\/icon-manifest\.json(\?.*)?$/, '' )
		: '';
} )();

/**
 * What the manifest says about each token, once it has been fetched.
 *
 * `sized` icons live under a size directory, `glyph` ones in the bundle
 * root. Empty until the picker is first opened, which is the state most of
 * this file exists to survive.
 */
let tokenKind = {};

const GLYPH = new Set( tokenIndex.glyph );
const SINGLE = new Set( tokenIndex.single );
const SINGLE_DASH = /(?<!-)-(?!-)/;

/**
 * Record what the manifest says. Called by the picker when it loads.
 *
 * @param {Object} kinds token → 'sized' | 'glyph'.
 */
export function setIconTokenKinds( kinds ) {
	tokenKind = kinds || {};
}

/**
 * Where a token's SVG sits in the bundle.
 *
 * Two things about a token decide the file, and both used to be unknown until
 * the manifest arrived, which is only fetched when the picker is first opened.
 * So every possibility was offered and the one that existed won. The browser
 * requests every candidate, though, and each wrong one is a 404 in the
 * console: authors saw a column of them while editing a page with icons.
 * `icon-token-index.json`, generated with the manifest and bundled here,
 * answers both questions up front, so exactly one URL is returned.
 *
 * **How it is spelled.** Carbon's own token names the bundle file
 * (`two-person-lift`, `arrow--right`), and older AWT content stored a
 * single-dash spelling of a double-dash icon (`arrow-right`). A single-dash
 * token that is not in the index's `single` list is that legacy spelling, and
 * is read as its double-dash form.
 *
 * **Where it lives.** Nine icons are size-independent (`caution`,
 * `circle-fill`, the severity marks) and sit in the bundle root. Every other
 * icon has a 32px file, so a size directory is always there.
 *
 * @param {string} token Carbon icon token.
 * @param {Array}  sizes Sizes the icon is available in, from the manifest.
 * @return {string[]} The icon's URL, or an empty list when there is no icon.
 */
export function iconPreviewUrls( token, sizes ) {
	if ( ! manifestPluginUrl || ! token ) {
		return [];
	}
	const base = `${ manifestPluginUrl }/build/shared/carbon-icons`;

	let name = String( token ).toLowerCase();
	if (
		SINGLE_DASH.test( name ) &&
		! SINGLE.has( name ) &&
		! tokenKind[ name ]
	) {
		name = name.replace( /(?<!-)-(?!-)/g, '--' );
	}

	const isGlyph =
		GLYPH.has( name ) ||
		tokenKind[ name ] === 'glyph' ||
		( sizes && sizes.includes( 'glyph' ) );
	if ( isGlyph ) {
		return [ `${ base }/${ name }.svg` ];
	}
	const numeric = ( sizes || [] ).filter( ( s ) => typeof s === 'number' );
	const size = numeric.includes( 32 ) ? 32 : numeric[ 0 ] || 32;
	return [ `${ base }/${ size }/${ name }.svg` ];
}

/**
 * The single best guess, for callers that can only take one URL.
 *
 * @param {string} token Carbon icon token.
 * @param {Array}  sizes Sizes the icon is available in, from the manifest.
 * @return {string} A URL, or an empty string when there is no icon.
 */
export function iconPreviewUrl( token, sizes ) {
	return iconPreviewUrls( token, sizes )[ 0 ] || '';
}

/**
 * The whole `mask-image` value for a token.
 *
 * This is what block previews use: they paint `currentColor` through the
 * mask, so the icon takes the colour of the text around it the way the
 * published page does.
 *
 * @param {string} token Carbon icon token.
 * @param {Array}  sizes Sizes the icon is available in, from the manifest.
 * @return {string} A CSS `mask-image` value.
 */
export function iconMaskImage( token, sizes ) {
	const urls = iconPreviewUrls( token, sizes );
	return urls.length
		? urls.map( ( url ) => `url(${ url })` ).join( ', ' )
		: 'none';
}
