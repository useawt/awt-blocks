/**
 * Without JavaScript the content switcher shows its first panel, and its first
 * segment is selected and reachable with Tab.
 *
 * Selection was left to the page script, so with scripts blocked, failed or
 * slow every panel was hidden and no segment could be reached (reported by the
 * outside accessibility review, 2026-10-21). The server now renders it.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:paragraph --><p><a href="#before">A link before it</a></p><!-- /wp:paragraph -->
<!-- wp:awt/content-switcher -->
<!-- wp:awt/content-switcher-item {"label":"List","value":"list"} /-->
<!-- wp:awt/content-switcher-item {"label":"Grid","value":"grid"} /-->
<!-- wp:awt/content-switcher-panel --><!-- wp:paragraph --><p>The list view.</p><!-- /wp:paragraph --><!-- /wp:awt/content-switcher-panel -->
<!-- wp:awt/content-switcher-panel --><!-- wp:paragraph --><p>The grid view.</p><!-- /wp:paragraph --><!-- /wp:awt/content-switcher-panel -->
<!-- /wp:awt/content-switcher -->
`;

test( 'works before any script runs', async ( {
	browser,
	baseURL,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — content switcher without JavaScript',
		content: CONTENT,
		status: 'publish',
	} );
	const context = await browser.newContext( {
		javaScriptEnabled: false,
		baseURL,
	} );
	const page = await context.newPage();
	await page.goto( `/?page_id=${ created.id }` );

	const list = page.locator( 'main [role="tab"]', { hasText: 'List' } );
	await expect( list ).toHaveAttribute( 'aria-selected', 'true' );
	await expect( page.getByText( 'The list view.' ) ).toBeVisible();
	await expect( page.getByText( 'The grid view.' ) ).toBeHidden();

	await page.locator( 'main a[href="#before"]' ).focus();
	await page.keyboard.press( 'Tab' );
	await expect( list ).toBeFocused();
	await context.close();
} );
