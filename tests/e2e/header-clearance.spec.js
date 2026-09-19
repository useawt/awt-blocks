/**
 * The admin bar does not push the first line of content further down.
 *
 * The clearance below the fixed header had an admin-bar variant that added the
 * bar's height to the base value. That counted the bar twice — WordPress
 * already pushes the document down with `html { margin-top }`, and the header
 * moves down with it — so a logged-in viewer saw the breadcrumb sitting 32px
 * (46px on a narrow screen) lower than the same site's hero eyebrow, while a
 * logged-out visitor saw the two line up. Found on a live site, 2026-09-09, by
 * the only people who ever see it: the authors.
 *
 * Measured from the header's own bottom edge rather than from the top of the
 * page, because that is the distance a reader sees, and it is the one the
 * admin bar must not change.
 *
 * The last test covers the other half of the same relationship. At 782px and
 * below WordPress makes the admin bar `position: absolute`, so it scrolls away
 * — and the fixed header, holding an offset for a bar that is no longer there,
 * floated below the top of the screen with page content in the gap.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `<!-- wp:paragraph --><p>Body copy under the trail.</p><!-- /wp:paragraph -->`;

// Distance from the bottom of the fixed header to the top of the trail.
const GAP = () => {
	const header = document.querySelector( '.cds--header' );
	const nav = document.querySelector( '.awt-breadcrumb-region nav' );
	if ( ! header || ! nav ) {
		return null;
	}
	return Math.round(
		nav.getBoundingClientRect().top - header.getBoundingClientRect().bottom
	);
};

// Where the header's top edge sits, and where the admin bar's bottom edge is.
const EDGES = () => {
	const bar = document.getElementById( 'wpadminbar' );
	const header = document.querySelector( '.cds--header' );
	return {
		barBottom: Math.round( bar.getBoundingClientRect().bottom ),
		headerTop: Math.round( header.getBoundingClientRect().top ),
	};
};

test.describe( 'Header clearance', () => {
	// Both sides of WP core's own admin-bar breakpoint: the bar is 46px tall
	// at 782px and below, 32px above it, and each used to be added twice.
	for ( const width of [ 1440, 700 ] ) {
		test( `the admin bar leaves the trail where it is at ${ width }px`, async ( {
			page,
			browser,
			requestUtils,
		} ) => {
			const created = await requestUtils.createPage( {
				title: `Header clearance ${ width }`,
				content: CONTENT,
				status: 'publish',
			} );
			const url = `/?page_id=${ created.id }`;

			// The test's own context is logged in, so the front end carries
			// the admin bar.
			await page.setViewportSize( { width, height: 900 } );
			await page.goto( url );
			await expect(
				page.locator( '#wpadminbar' ),
				'the logged-in view should have an admin bar to measure'
			).toBeVisible();
			const withBar = await page.evaluate( GAP );

			const anonymous = await browser.newContext( {
				viewport: { width, height: 900 },
			} );
			const visitor = await anonymous.newPage();
			await visitor.goto( new URL( url, page.url() ).href );
			const withoutBar = await visitor.evaluate( GAP );
			await anonymous.close();

			expect( withBar ).not.toBeNull();
			expect( withBar ).toBe( withoutBar );
		} );
	}

	// 375px is below WP core's 600px line, where the bar turns `absolute` and
	// scrolls away; 1440px is above it, where the bar is fixed and nothing
	// should move at all. 600px, not the better-known 782px — that one is the
	// bar's height. Measured against core's own stylesheet rather than
	// remembered, after a first version of this test picked 700px and watched
	// a bar that never moved.
	for ( const [ width, scrolls ] of [
		[ 375, true ],
		[ 1440, false ],
	] ) {
		test( `the header follows the admin bar at ${ width }px`, async ( {
			page,
			requestUtils,
		} ) => {
			const created = await requestUtils.createPage( {
				title: `Header follows the bar ${ width }`,
				content: `${ CONTENT }<!-- wp:spacer {"height":"2000px"} --><div style="height:2000px" aria-hidden="true" class="wp-block-spacer"></div><!-- /wp:spacer -->`,
				status: 'publish',
			} );
			await page.setViewportSize( { width, height: 700 } );
			await page.goto( `/?page_id=${ created.id }` );
			await expect( page.locator( '#wpadminbar' ) ).toBeVisible();

			// At rest the header starts exactly where the bar ends.
			const atRest = await page.evaluate( EDGES );
			expect( atRest.headerTop ).toBe( atRest.barBottom );

			await page.evaluate( () => window.scrollTo( 0, 800 ) );
			await expect
				.poll( async () => ( await page.evaluate( EDGES ) ).headerTop )
				.toBe( scrolls ? 0 : atRest.barBottom );

			// And back: the header returns under the bar, not over it.
			await page.evaluate( () => window.scrollTo( 0, 0 ) );
			await expect
				.poll( async () => ( await page.evaluate( EDGES ) ).headerTop )
				.toBe( atRest.barBottom );
		} );
	}
} );
