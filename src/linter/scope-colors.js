/**
 * What each palette color and Carbon token looks like in each Carbon theme,
 * read from the editor canvas.
 *
 * The contrast preview and the linter judge a block in every theme a visitor
 * can see it in (`surfaces.js`). The values have to be the ones the page will
 * really show, and those are not in any one file: Carbon's tokens, the
 * theme's rule that points palette colors at them, the site's Custom CSS
 * (every AWT site recolors some tokens) and AWT Premium's brand colors all
 * play a part. The canvas already has all of them loaded, so this asks it: one
 * hidden element per theme (`.cds--white` … `.cds--g100`), one probe per color
 * inside, and the computed colors read back. Then the elements are removed.
 *
 * A token that is not defined comes back as the fallback marker and is left
 * out, so a theme without Carbon tokens gives no data and the checks keep
 * their old behaviour.
 */

const SCOPES = [ 'white', 'g10', 'g90', 'g100' ];

// Tokens the checks need besides the palette: the page's own surface and
// text, and the backgrounds AWT Section offers.
const TOKENS = [ 'background', 'text-primary', 'layer-01', 'layer-accent-01' ];

// Not a color any token has; a probe that comes back with it found nothing.
const MISSING = 'rgb(1, 2, 3)';

/**
 * The editor canvas document, once it has loaded.
 */
export function canvasDocument() {
	if ( typeof document === 'undefined' ) {
		return null;
	}
	const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
	if ( frame ) {
		try {
			const doc = frame.contentDocument;
			return doc && doc.readyState === 'complete' && doc.body
				? doc
				: null;
		} catch ( e ) {
			return null;
		}
	}
	// A canvas that is not in an iframe.
	return document.querySelector( '.editor-styles-wrapper' ) ? document : null;
}

/**
 * Probe the canvas.
 *
 * @param {Document} doc   The canvas document.
 * @param {string[]} slugs Palette slugs.
 * @return {Object|null} `{ palette: { scope: { slug: color } }, tokens: { scope: { token: color } } }`, or null when the canvas has no Carbon tokens.
 */
export function probeScopeColors( doc, slugs ) {
	const root = doc.querySelector( '.editor-styles-wrapper' ) || doc.body;
	const view = doc.defaultView;
	if ( ! root || ! view ) {
		return null;
	}

	const host = doc.createElement( 'div' );
	host.setAttribute( 'aria-hidden', 'true' );
	host.style.cssText =
		'position:absolute;inline-size:1px;block-size:1px;overflow:hidden;visibility:hidden;pointer-events:none;';

	const tokens = [ ...new Set( [ ...TOKENS, ...slugs ] ) ];
	const cells = [];
	for ( const scope of SCOPES ) {
		const zone = doc.createElement( 'div' );
		zone.className = `cds--${ scope }`;
		for ( const slug of slugs ) {
			const probe = doc.createElement( 'span' );
			probe.style.color = `var(--wp--preset--color--${ slug }, ${ MISSING })`;
			zone.appendChild( probe );
			cells.push( [ 'palette', scope, slug, probe ] );
		}
		for ( const token of tokens ) {
			const probe = doc.createElement( 'span' );
			probe.style.color = `var(--cds-${ token }, ${ MISSING })`;
			zone.appendChild( probe );
			cells.push( [ 'tokens', scope, token, probe ] );
		}
		host.appendChild( zone );
	}

	root.appendChild( host );
	const out = { palette: {}, tokens: {} };
	for ( const [ kind, scope, name, probe ] of cells ) {
		const value = view.getComputedStyle( probe ).color;
		if ( value && value !== MISSING ) {
			out[ kind ][ scope ] = out[ kind ][ scope ] || {};
			out[ kind ][ scope ][ name ] = value;
		}
	}
	host.remove();

	// No Carbon tokens, or the canvas styles are not in yet.
	const light = out.tokens.white && out.tokens.white.background;
	const dark = out.tokens.g100 && out.tokens.g100.background;
	if ( ! light || ! dark || light === dark ) {
		return null;
	}
	return out;
}

/**
 * The site's color schemes, from the theme: which Carbon theme is its light
 * one and its dark one, and which of the two visitors can see.
 *
 * @return {Object|null} `{ light, dark, visitor: string[] }`, or null without the AWT theme.
 */
export function editorSchemes() {
	const data =
		( typeof window !== 'undefined' && window.awtEditorData ) || {};
	const cs = data.colorScheme;
	if ( ! cs || ! cs.scopes ) {
		return null;
	}
	const light = cs.scopes.light || 'white';
	const dark = cs.scopes.dark || 'g100';
	const shown =
		Array.isArray( cs.schemes ) && cs.schemes.length
			? cs.schemes
			: [ 'light', 'dark' ];
	return {
		light,
		dark,
		visitor: shown.map( ( s ) => ( s === 'dark' ? dark : light ) ),
	};
}
