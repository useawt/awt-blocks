/**
 * Icon previews have to point at a file that is really there.
 *
 * Two icons on a live page showed as blank gaps in the editor while the page
 * itself drew them: `carbon-for-aem` and `two-person-lift`. The preview URL
 * was guessing two things it could not know until the icon picker had been
 * opened at least once — how the token is spelled, and whether the icon has
 * size directories — and both guesses were wrong for a whole class of icons:
 * the 412 genuinely single-dash tokens, and the 9 size-independent ones.
 *
 * These cases run WITHOUT the manifest, which is the state a freshly opened
 * editor is in and the state the defect lived in.
 */

const MANIFEST_URL =
	'http://example.org/wp-content/plugins/awt-blocks/build/shared/icon-manifest.json';
const BASE =
	'http://example.org/wp-content/plugins/awt-blocks/build/shared/carbon-icons';

let iconPreviewUrls;
let iconMaskImage;

beforeAll( () => {
	window.awtBlocks = { iconManifestUrl: MANIFEST_URL };
	// The plugin URL is derived at module load, so the global has to be set first.
	( { iconPreviewUrls, iconMaskImage } = require( './icon-preview-url' ) );
} );

describe( 'icon preview URLs, before the manifest is loaded', () => {
	it( 'offers a genuinely single-dash icon under its own name', () => {
		expect( iconPreviewUrls( 'two-person-lift', [ 32 ] ) ).toContain(
			`${ BASE }/32/two-person-lift.svg`
		);
	} );

	it( 'still offers the double-dash spelling for legacy content', () => {
		expect( iconPreviewUrls( 'arrow-right', [ 32 ] ) ).toContain(
			`${ BASE }/32/arrow--right.svg`
		);
	} );

	it( 'offers a size-independent icon from the bundle root', () => {
		// `caution` and the other eight have no size directories, and a block
		// asks for its icons at 32 whatever they are.
		expect( iconPreviewUrls( 'caution', [ 32 ] ) ).toContain(
			`${ BASE }/caution.svg`
		);
	} );

	it( 'leaves a double-dash token alone', () => {
		const urls = iconPreviewUrls( 'arrow--right', [ 32 ] );
		expect( urls ).toContain( `${ BASE }/32/arrow--right.svg` );
		expect( urls.join( ' ' ) ).not.toContain( 'arrow----right' );
	} );

	it( 'is case-insensitive about the token', () => {
		expect( iconPreviewUrls( 'Two-Person-Lift', [ 32 ] ) ).toContain(
			`${ BASE }/32/two-person-lift.svg`
		);
	} );

	it( 'has nothing to offer for an empty token', () => {
		expect( iconPreviewUrls( '', [ 32 ] ) ).toEqual( [] );
	} );
} );

describe( 'one request per icon', () => {
	// Every candidate URL is a request, and every wrong one is a 404 in the
	// author's console. Each of these once produced one.
	it.each( [
		[ 'earth', '32/earth.svg' ],
		[ 'tools', '32/tools.svg' ],
		[ 'arrow--right', '32/arrow--right.svg' ],
		[ 'game--console', '32/game--console.svg' ],
		[ 'two-person-lift', '32/two-person-lift.svg' ],
		[ 'arrow-right', '32/arrow--right.svg' ],
		[ 'circle-fill', 'circle-fill.svg' ],
	] )( '%s resolves to exactly one file', ( token, file ) => {
		expect( iconPreviewUrls( token, [ 32 ] ) ).toEqual( [
			`${ BASE }/${ file }`,
		] );
	} );
} );

describe( 'the mask value blocks paint through', () => {
	it( 'points at the one file that exists', () => {
		expect( iconMaskImage( 'two-person-lift', [ 32 ] ) ).toBe(
			`url(${ BASE }/32/two-person-lift.svg)`
		);
	} );

	it( 'is `none` rather than a broken url() when there is no icon', () => {
		expect( iconMaskImage( '', [ 32 ] ) ).toBe( 'none' );
	} );
} );
