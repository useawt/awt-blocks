/**
 * A click or tap on a desktop dropdown item reaches the link.
 *
 * Safari does not focus a link when it is pressed. The dropdown closes when
 * focus leaves it, and Safari's press blurred the title with nowhere for focus
 * to go, so the dropdown hid itself between the press and the click. The click
 * then landed on whatever was underneath and no menu item on accessibilitycloud.com
 * could be followed. Chrome focuses the link, so it never showed there.
 *
 * This spec also runs in the `webkit` project for that reason. Leaving focus
 * with the keyboard must still close the dropdown, which is checked here too.
 */

const { test, expect } = require( './fixtures' );

const title = ( page ) => page.locator( '.cds--header__menu-title' ).first();
const firstItem = ( page ) =>
	page.locator( '.cds--header__submenu' ).first().locator( 'ul a' ).first();

// Record the click on the item instead of following it, so the check does not
// depend on where the link goes.
const watchItem = ( page ) =>
	firstItem( page ).evaluate( ( a ) => {
		window.awtItemClicked = false;
		a.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			window.awtItemClicked = true;
		} );
	} );

test.describe( 'Header dropdown items', () => {
	test.use( { viewport: { width: 1400, height: 900 } } );

	test.beforeEach( async ( { page } ) => {
		await page.goto( '/' );
		await expect( title( page ) ).toBeVisible();
		await watchItem( page );
	} );

	test( 'a mouse click on an item reaches the link', async ( { page } ) => {
		await title( page ).click();
		await expect( title( page ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		await firstItem( page ).click();
		expect( await page.evaluate( () => window.awtItemClicked ) ).toBe(
			true
		);
	} );

	test( 'Shift+Tab off the title closes the dropdown', async ( { page } ) => {
		await title( page ).focus();
		await page.keyboard.press( 'Enter' );
		await expect( title( page ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		await page.keyboard.press( 'Shift+Tab' );
		await expect( title( page ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	} );
} );

test.describe( 'Header dropdown items on a wide touch screen', () => {
	test.use( { viewport: { width: 1366, height: 1024 }, hasTouch: true } );

	test( 'a tap on an item reaches the link', async ( { page } ) => {
		await page.goto( '/' );
		await expect( title( page ) ).toBeVisible();
		await watchItem( page );
		await title( page ).tap();
		await expect( title( page ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		await firstItem( page ).tap();
		expect( await page.evaluate( () => window.awtItemClicked ) ).toBe(
			true
		);
	} );
} );
