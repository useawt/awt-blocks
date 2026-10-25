/**
 * Front-end render test: a page composed of representative AWT blocks
 * renders on the tests site with the expected Carbon markup, working
 * interactivity (accordion toggle), and no console errors.
 *
 * Self-contained: the page is created through the REST API at test time, so
 * this needs no seeded content.
 */

const { test, expect } = require( './fixtures' );

const PAGE_CONTENT = `
<!-- wp:awt/section -->
<!-- wp:awt/stat {"value":"98%","heading":"Automated checks passed","level":"3"} /-->
<!-- wp:awt/button {"text":"Get started","href":"#main"} /-->
<!-- wp:awt/tag {"text":"Stable","type":"green"} /-->
<!-- wp:awt/list -->
<!-- wp:awt/list-item {"content":"First item"} /-->
<!-- wp:awt/list-item {"content":"Second item"} /-->
<!-- /wp:awt/list -->
<!-- wp:awt/accordion -->
<!-- wp:awt/accordion-item {"title":"What is AWT?"} -->
<!-- wp:paragraph --><p>An accessibility-first theme.</p><!-- /wp:paragraph -->
<!-- /wp:awt/accordion-item -->
<!-- /wp:awt/accordion -->
<!-- wp:awt/faq-item {"question":"Does it work without JavaScript?"} -->
<!-- wp:paragraph --><p>Yes.</p><!-- /wp:paragraph -->
<!-- /wp:awt/faq-item -->
<!-- /wp:awt/section -->
`;

// The arrow's angle in degrees: 90 points down (closed), -90 up (open).
const arrowAngle = ( item ) =>
	item.locator( '.cds--accordion__arrow' ).evaluate( ( el ) => {
		const m = new DOMMatrix( getComputedStyle( el ).transform );
		return Math.round( ( Math.atan2( m.b, m.a ) * 180 ) / Math.PI );
	} );

// The arrow turns when its section opens. Carbon's rule for that needs the
// button directly inside the item; ours sits in a heading, and the arrow once
// stopped turning with nothing failing.
async function expectArrowsToTurn( page ) {
	for ( const item of [
		page.locator( '.cds--accordion__item:not(.awt-faq-item)' ).first(),
		page.locator( '.awt-faq-item' ).first(),
	] ) {
		await expect.poll( () => arrowAngle( item ) ).toBe( 90 );
		await item.locator( '.cds--accordion__heading' ).click();
		await expect.poll( () => arrowAngle( item ) ).toBe( -90 );
	}
}

test.describe( 'AWT blocks render on the front end', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		// Theme + plugin activation happens in env:prepare-tests (wp-cli),
		// which `npm run test:e2e` runs first.
		const created = await requestUtils.createPage( {
			title: 'Front-end smoke',
			content: PAGE_CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	test( 'representative blocks emit Carbon markup and interactivity works', async ( {
		page,
	} ) => {
		const consoleErrors = [];
		page.on( 'console', ( msg ) => {
			if ( msg.type() === 'error' ) {
				consoleErrors.push( msg.text() );
			}
		} );

		await page.goto( `/?page_id=${ pageId }` );

		// Server-rendered Carbon structures.
		await expect( page.locator( '.awt-stat' ) ).toBeVisible();
		await expect(
			page.locator( '.awt-stat h3.awt-stat__heading' )
		).toContainText( 'Automated checks passed' );
		await expect( page.locator( '.cds--btn' ).first() ).toContainText(
			'Get started'
		);
		await expect( page.locator( '.cds--tag' ).first() ).toContainText(
			'Stable'
		);
		await expect( page.locator( '.cds--list--unordered li' ) ).toHaveCount(
			2
		);

		await expectArrowsToTurn( page );

		// Interactivity API behavior: the accordion opens on click.
		const accordionBtn = page.locator( '.cds--accordion__heading' ).first();
		await expect( accordionBtn ).toBeVisible();
		const expandedBefore =
			await accordionBtn.getAttribute( 'aria-expanded' );
		await accordionBtn.click();
		await expect( accordionBtn ).toHaveAttribute(
			'aria-expanded',
			expandedBefore === 'true' ? 'false' : 'true'
		);

		expect(
			consoleErrors.filter(
				( t ) => ! t.includes( 'Failed to load resource' )
			)
		).toEqual( [] );
	} );

	test( 'arrows point and turn the same way on a right-to-left site', async ( {
		page,
	} ) => {
		// What WordPress does on a right-to-left site: each shared block
		// stylesheet is swapped for its -rtl twin, and the theme's stays as is.
		let swapped = 0;
		await page.route( '**/build/shared-css/carbon-*.css*', ( route ) => {
			swapped++;
			return route.continue( {
				url: route
					.request()
					.url()
					.replace( /\.css(\?|$)/, '-rtl.css$1' ),
			} );
		} );
		await page.goto( `/?page_id=${ pageId }` );
		await page.evaluate( () => ( document.documentElement.dir = 'rtl' ) );
		expect( swapped ).toBeGreaterThan( 0 );

		await expectArrowsToTurn( page );
	} );
} );
