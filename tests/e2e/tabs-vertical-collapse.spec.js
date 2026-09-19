/**
 * Vertical tabs follow Carbon's own breakpoint behaviour.
 *
 * Carbon's `TabListVertical` watches `(max-width: 42rem)` — its `md`
 * breakpoint — and renders a plain contained `TabList` instead while that
 * matches. Above it, the tab strip and the panel are placed on Carbon's CSS
 * grid: `span 2` / `3 / -1` of an 8-column grid, becoming `span 4` / `5 / -1`
 * of a 16-column one at `lg`. Either way the strip is a quarter of the width.
 *
 * The block had neither. It kept a 12rem sidebar at every width, and the panel
 * column could not shrink below the width of its own text, so on a phone the
 * component ran past the viewport and the whole page scrolled sideways — 159px
 * of it at 375px on the site this was found on (2026-09-19). That is a Reflow
 * failure (WCAG 1.4.10), so the overflow assertion is the point of this file,
 * not a detail of it.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/tabs {"orientation":"vertical","ariaLabel":"Partnership options"} -->
<!-- wp:awt/tab {"label":"Referrer"} /-->
<!-- wp:awt/tab {"label":"Partner"} /-->
<!-- wp:awt/tab {"label":"Reseller"} /-->
<!-- wp:awt/tab {"label":"Infrastructure"} /-->
<!-- wp:awt/tab-panel -->
<!-- wp:heading --><h2 class="wp-block-heading">Refer Accessibility Cloud to your customers</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>Introduce prospective customers and earn sales commissions.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tab-panel -->
<!-- wp:awt/tab-panel -->
<!-- wp:paragraph --><p>Partner panel.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tab-panel -->
<!-- wp:awt/tab-panel -->
<!-- wp:paragraph --><p>Reseller panel.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tab-panel -->
<!-- wp:awt/tab-panel -->
<!-- wp:paragraph --><p>Infrastructure panel.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tab-panel -->
<!-- /wp:awt/tabs -->
`;

const ROOT = '.awt-tabs--vertical-source';

const read = ( page ) =>
	page.evaluate( ( root ) => {
		const tabs = document.querySelector( root );
		const strip = tabs.querySelector( ':scope > .awt-tabs__strip' );
		const list = tabs.querySelector( '.cds--tab--list' );
		const width = ( el ) => el.getBoundingClientRect().width;
		return {
			vertical: tabs.classList.contains( 'cds--tabs--vertical' ),
			contained: tabs.classList.contains( 'cds--tabs--contained' ),
			orientation: list.getAttribute( 'aria-orientation' ),
			stripShare: width( strip ) / width( tabs ),
			pageOverflow:
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
		};
	}, ROOT );

test.describe( 'Vertical tabs', () => {
	let url;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'gate — vertical tabs',
			content: CONTENT,
			status: 'publish',
		} );
		url = `/?page_id=${ created.id }`;
	} );

	// 673 and 1056 are the first width of each of Carbon's two vertical
	// layouts; 672 is the last width that still collapses, because Carbon's
	// query is `max-width: 42rem` and 42rem is 672px exactly.
	for ( const width of [ 673, 1056, 1440 ] ) {
		test( `are a quarter-width sidebar at ${ width }px`, async ( {
			page,
		} ) => {
			await page.setViewportSize( { width, height: 900 } );
			await page.goto( url );
			await page.locator( ROOT ).waitFor();
			const state = await read( page );
			expect( state.vertical ).toBe( true );
			expect( state.orientation ).toBe( 'vertical' );
			expect( state.stripShare ).toBeCloseTo( 0.25, 2 );
			expect( state.pageOverflow ).toBe( 0 );
		} );
	}

	for ( const width of [ 320, 375, 672 ] ) {
		test( `collapse to contained horizontal tabs at ${ width }px`, async ( {
			page,
		} ) => {
			await page.setViewportSize( { width, height: 900 } );
			await page.goto( url );
			await page.locator( ROOT ).waitFor();
			const state = await read( page );
			expect( state.vertical ).toBe( false );
			expect( state.contained ).toBe( true );
			expect( state.orientation ).toBe( 'horizontal' );
			expect( state.stripShare ).toBeCloseTo( 1, 2 );
		} );
	}

	test( 'follow the window as it is resized', async ( { page } ) => {
		await page.setViewportSize( { width: 1440, height: 900 } );
		await page.goto( url );
		await page.locator( ROOT ).waitFor();
		expect( ( await read( page ) ).vertical ).toBe( true );

		await page.setViewportSize( { width: 375, height: 900 } );
		await expect
			.poll( async () => ( await read( page ) ).orientation )
			.toBe( 'horizontal' );

		await page.setViewportSize( { width: 1440, height: 900 } );
		await expect
			.poll( async () => ( await read( page ) ).orientation )
			.toBe( 'vertical' );
	} );
} );
