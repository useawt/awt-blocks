/**
 * Pagination fits a 320px screen.
 *
 * Every page item was a fixed 3rem square and the list did not wrap, so nine
 * items needed 432px. Centred on a 320px screen (a 1280px window at 400%
 * zoom) they ran from -56px to 376px: Previous off the left edge where no
 * scrolling reaches, Next off the right, and the page scrolled sideways
 * (reported by the outside accessibility review, 2026-10-14; WCAG 1.4.10).
 * In little room the items now take Carbon's small 2rem height and share the
 * width, never below the 24px target minimum. Wide screens keep 3rem.
 */

const { test, expect } = require( './fixtures' );

const measure = ( page ) =>
	page.evaluate( () => {
		const doc = document.documentElement;
		const items = [
			...document.querySelectorAll(
				'.wp-block-awt-pagination .cds--pagination-nav__page'
			),
		].map( ( a ) => a.getBoundingClientRect() );
		return {
			pageOverflow: doc.scrollWidth - doc.clientWidth,
			left: Math.min( ...items.map( ( r ) => r.left ) ),
			right: Math.max( ...items.map( ( r ) => r.right ) ),
			rows: new Set( items.map( ( r ) => Math.round( r.top ) ) ).size,
			narrowest: Math.min( ...items.map( ( r ) => r.width ) ),
			shortest: Math.min( ...items.map( ( r ) => r.height ) ),
			widest: Math.max( ...items.map( ( r ) => r.width ) ),
			count: items.length,
		};
	} );

test.describe( 'Pagination', () => {
	let url;

	test.beforeAll( async ( { requestUtils } ) => {
		// Twelve pages on page 4: Previous, 1, …, 3, 4, 5, …, 12, Next.
		const created = await requestUtils.createPage( {
			title: 'gate — pagination width',
			content:
				'<!-- wp:awt/pagination {"totalPages":12,"currentPage":4} /-->',
			status: 'publish',
		} );
		url = `/?page_id=${ created.id }`;
	} );

	for ( const width of [ 320, 375 ] ) {
		test( `fits on one line at ${ width }px`, async ( { page } ) => {
			await page.setViewportSize( { width, height: 800 } );
			await page.goto( url );
			const m = await measure( page );
			expect( m.count ).toBe( 9 );
			expect( m.pageOverflow ).toBe( 0 );
			expect( m.left ).toBeGreaterThanOrEqual( 0 );
			expect( m.right ).toBeLessThanOrEqual( width );
			expect( m.rows ).toBe( 1 );
			expect( m.narrowest ).toBeGreaterThanOrEqual( 24 );
			expect( m.shortest ).toBeGreaterThanOrEqual( 24 );
		} );
	}

	test( 'keeps Carbon’s 3rem squares where there is room', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1280, height: 800 } );
		await page.goto( url );
		const m = await measure( page );
		expect( m.narrowest ).toBe( 48 );
		expect( m.shortest ).toBe( 48 );
		expect( m.rows ).toBe( 1 );
	} );
} );
