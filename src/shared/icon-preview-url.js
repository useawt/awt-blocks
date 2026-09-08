/**
 * Where an icon's SVG sits in the bundle the plugin ships.
 *
 * Kept apart from the picker so it can be tested on its own: the picker pulls
 * in half of `@wordpress/components`, and this is arithmetic on a filename.
 */

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

/**
 * Record what the manifest says. Called by the picker when it loads.
 *
 * @param {Object} kinds token → 'sized' | 'glyph'.
 */
export function setIconTokenKinds( kinds ) {
	tokenKind = kinds || {};
}

/**
 * Where a token's SVG might sit in the bundle, best guess first.
 *
 * Two things about a token are unknown until the manifest arrives, and the
 * manifest is only fetched when the picker is first opened — so for an icon
 * already saved on a block, both were being guessed, and both guesses could
 * be wrong. The block then drew nothing while the page it was saved on
 * rendered the icon perfectly.
 *
 * **How it is spelled.** Carbon's own token names the bundle file
 * (`two-person-lift`, `arrow--right`), and older AWT content stored a
 * single-dash spelling of a double-dash icon (`arrow-right`). Every
 * single-dash token was being rewritten to double dashes, which is right for
 * the legacy ones and wrong for every genuinely single-dash icon —
 * `two-person-lift`, `carbon-for-aem`, `enable-step` and 409 others.
 *
 * **Where it lives.** Nine icons are size-independent (`caution`,
 * `circle-fill`, the severity marks) and sit in the bundle root with no size
 * directory. Asked for under a size, they are not there.
 *
 * So every possibility is offered and the one that exists wins. No icon is
 * bundled under two names, so there is nothing to pick between.
 *
 * @param {string} token Carbon icon token.
 * @param {Array}  sizes Sizes the icon is available in, from the manifest.
 * @return {string[]} Candidate URLs, best guess first.
 */
export function iconPreviewUrls( token, sizes ) {
	if ( ! manifestPluginUrl || ! token ) {
		return [];
	}
	const key = String( token ).toLowerCase();
	const base = `${ manifestPluginUrl }/build/shared/carbon-icons`;

	const known = tokenKind[ key ];
	const isGlyph = known === 'glyph' || ( sizes && sizes.includes( 'glyph' ) );
	const numeric = ( sizes || [] ).filter( ( s ) => typeof s === 'number' );
	const size = numeric.includes( 32 ) ? 32 : numeric[ 0 ] || 32;

	// Sized first: all but nine of the icons are there.
	let dirs = [ `${ base }/${ size }`, base ];
	if ( isGlyph ) {
		dirs = [ base ];
	} else if ( known ) {
		dirs = [ `${ base }/${ size }` ];
	}

	const names = [ key ];
	const legacy = key.replace( /(?<!-)-(?!-)/g, '--' );
	// A token the manifest knows is a real Carbon name and needs no second
	// guess. One it does not know may be legacy content — try that spelling too.
	if ( ! known && legacy !== key ) {
		names.push( legacy );
	}

	return dirs.flatMap( ( dir ) =>
		names.map( ( name ) => `${ dir }/${ name }.svg` )
	);
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
 * The whole `mask-image` value for a token — every candidate at once.
 *
 * A mask layer whose image fails to load contributes nothing, so listing both
 * spellings shows whichever one is really there. This is what block previews
 * use: they paint `currentColor` through the mask, so the icon takes the
 * colour of the text around it the way the published page does.
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
