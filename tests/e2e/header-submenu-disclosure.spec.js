/**
 * A header submenu's title is a disclosure, not a menu button.
 *
 * Carbon gives the title `aria-haspopup="menu"`, but the panel it opens is a
 * list of links reached with Tab. Announcing a menu promised arrow keys that
 * did nothing, and some screen readers change mode for a menu (reported by
 * the outside accessibility review, 2026-10-14). AWT leaves `aria-haspopup`
 * out and names the panel with `aria-controls`; everything else, including
 * what the keys do, is unchanged and checked here.
 *
 * Runs in WebKit too: VoiceOver and Safari are where the report came from.
 */

const { test, expect } = require( './fixtures' );

const submenu = ( page ) => page.locator( '.cds--header__submenu' ).first();
const title = ( page ) => submenu( page ).locator( '.cds--header__menu-title' );
const panel = ( page ) => submenu( page ).locator( 'ul.cds--header__menu' );

async function checkMarkup( page ) {
	const t = title( page );
	await expect( t ).toHaveAttribute( 'role', 'button' );
	await expect( t ).not.toHaveAttribute( 'aria-haspopup', /.*/ );
	const controls = await t.getAttribute( 'aria-controls' );
	expect( controls ).toMatch( /^awt-submenu-\d+$/ );
	// It names this submenu's own panel, and the id is used once.
	await expect( panel( page ) ).toHaveAttribute( 'id', controls );
	await expect( page.locator( `[id="${ controls }"]` ) ).toHaveCount( 1 );
}

test.describe( 'Header submenu title, desktop', () => {
	test.use( { viewport: { width: 1400, height: 900 } } );

	test( 'is a disclosure that the keys and the mouse work', async ( {
		page,
		browserName,
	} ) => {
		// Safari's Tab skips links unless Option is held (its default
		// setting), so the walk through the panel's links uses Option+Tab.
		const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
		await page.goto( '/' );
		await expect( title( page ) ).toBeVisible();
		await checkMarkup( page );
		const t = title( page );

		// Enter opens and closes, Space opens, Escape closes and keeps focus.
		await t.focus();
		await expect( t ).toHaveAttribute( 'aria-expanded', 'false' );
		await page.keyboard.press( 'Enter' );
		await expect( t ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( panel( page ) ).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await expect( t ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( panel( page ) ).toBeHidden();
		await page.keyboard.press( 'Space' );
		await expect( t ).toHaveAttribute( 'aria-expanded', 'true' );
		await page.keyboard.press( 'Escape' );
		await expect( t ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( t ).toBeFocused();

		// Tab goes into the panel's links, and out of it closes the panel.
		await page.keyboard.press( 'Enter' );
		const links = panel( page ).locator( 'a' );
		const count = await links.count();
		expect( count ).toBeGreaterThan( 0 );
		for ( let i = 0; i < count; i++ ) {
			await page.keyboard.press( tab );
			await expect( links.nth( i ) ).toBeFocused();
		}
		await page.keyboard.press( tab );
		await expect( t ).toHaveAttribute( 'aria-expanded', 'false' );

		// A click opens and closes it.
		await t.click();
		await expect( t ).toHaveAttribute( 'aria-expanded', 'true' );
		await t.click();
		await expect( t ).toHaveAttribute( 'aria-expanded', 'false' );
	} );
} );

test.describe( 'Header submenu title, mobile menu', () => {
	test.use( { viewport: { width: 375, height: 812 } } );

	test( 'opens as part of the menu the same way', async ( { page } ) => {
		await page.goto( '/' );
		await page.getByRole( 'button', { name: 'Open menu' } ).click();
		await expect( title( page ) ).toBeVisible();
		await checkMarkup( page );
		const t = title( page );
		await t.focus();
		await page.keyboard.press( 'Enter' );
		await expect( t ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( panel( page ) ).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await expect( t ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( panel( page ) ).toBeHidden();
	} );
} );
