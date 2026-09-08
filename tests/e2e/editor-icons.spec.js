/**
 * Every icon the canvas draws points at a file that is really there.
 *
 * Block previews paint `currentColor` through the icon's SVG as a CSS mask.
 * A mask whose image 404s draws nothing at all — no console error, no broken
 * image, just a gap where the icon should be — so a wrong URL is invisible to
 * every other gate and looks to an author like the icon does not exist. Two
 * on a live page did: `carbon-for-aem` and `two-person-lift`, both perfectly
 * fine on the page itself.
 *
 * The fixture carries one instance of each shape that can go wrong, because
 * that is the part the old gates were missing rather than the assertion: the
 * showcase happens to use only double-dash names, so every check passed while
 * 412 single-dash icons and 9 size-independent ones were broken.
 */

const { test, expect } = require( './fixtures' );

// Ordinary content plus the awkward shapes. `caution` has no size directory;
// `arrow-right` is the legacy spelling of a double-dash icon; the three in the
// middle are real Carbon names that happen to carry single dashes.
const CONTENT = `
<!-- wp:awt/icon {"iconName":"arrow--right","size":32} /-->
<!-- wp:awt/icon {"iconName":"two-person-lift","size":32} /-->
<!-- wp:awt/icon {"iconName":"carbon-for-aem","size":32} /-->
<!-- wp:awt/icon {"iconName":"enable-step","size":32} /-->
<!-- wp:awt/icon {"iconName":"caution","size":32} /-->
<!-- wp:awt/icon {"iconName":"arrow-right","size":32} /-->
<!-- wp:awt/button {"text":"B","iconName":"download"} /-->
<!-- wp:awt/link {"text":"L","href":"#x","iconName":"launch"} /-->
<!-- wp:awt/code-snippet {"code":"npm i","variant":"single"} /-->
`;

// Every mask URL the canvas is asking for, one entry per masked element.
const COLLECT = () => {
	const out = [];
	document.querySelectorAll( '*' ).forEach( ( el ) => {
		const mask = getComputedStyle( el ).maskImage;
		if ( ! mask || ! mask.includes( 'carbon-icons' ) ) {
			return;
		}
		out.push(
			[ ...mask.matchAll( /url\("?([^")]+)"?\)/g ) ].map(
				( m ) => m[ 1 ]
			)
		);
	} );
	return out;
};

test.describe( 'Editor icons', () => {
	test( 'every icon in the canvas resolves to a bundled file', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Editor icons',
			content: CONTENT,
			status: 'publish',
		} );

		// The page side first: if these are not real icons the canvas has
		// nothing to be measured against.
		await page.goto( `/?page_id=${ created.id }` );
		const drawn = await page.locator( '.wp-block-awt-icon svg' ).count();
		expect( drawn, 'the page should draw all six icons' ).toBe( 6 );

		await admin.editPost( created.id );
		await expect(
			editor.canvas.locator( '.wp-block-awt-icon' ).first()
		).toBeVisible();

		const masked = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body, collect ) => {
				// eslint-disable-next-line no-eval
				return eval( `(${ collect })` )();
			}, COLLECT.toString() );

		// A sweep that finds nothing must not pass for that reason.
		expect(
			masked.length,
			'the canvas should be masking icons'
		).toBeGreaterThanOrEqual( 8 );

		const broken = [];
		for ( const urls of masked ) {
			const codes = [];
			for ( const url of urls ) {
				const response = await page.request.get( url );
				codes.push( response.status() );
			}
			if ( ! codes.includes( 200 ) ) {
				broken.push(
					`${ urls.join( ' , ' ) } → ${ codes.join( '/' ) }`
				);
			}
		}

		expect(
			broken,
			`the canvas asks for icons that are not in the bundle:\n  ${ broken.join(
				'\n  '
			) }`
		).toHaveLength( 0 );
	} );
} );
