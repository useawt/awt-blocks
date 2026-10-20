/**
 * Tab off the last item of the open mobile menu goes on in page order.
 *
 * It closed the menu and jumped to the first link in the main content,
 * skipping the header controls after the menu and the breadcrumb (reported by
 * the outside accessibility review, 2026-10-20). Now focus moves to the next
 * control after the menu, and the menu closes as focus leaves it. Shift+Tab
 * off the first item still returns to the menu button with the menu open.
 *
 * WebKit runs it with Option+Tab: by default Safari's Tab skips links.
 */

const { test, expect } = require( './fixtures' );

// By default Safari's Tab skips links; Option+Tab reaches them.
const tabKey = ( browserName ) =>
	browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

const describe = ( page ) =>
	page.evaluate( () => {
		// eslint-disable-next-line @wordpress/no-global-active-element
		const e = document.activeElement;
		return {
			name: ( e.getAttribute( 'aria-label' ) || e.textContent ).trim(),
			inMenu: !! e.closest( '.cds--header__nav' ),
			inHeader: !! e.closest( '.cds--header' ),
		};
	} );

/**
 * Press Tab until focus leaves the menu, at most 20 times.
 *
 * @param {Object} page Playwright page.
 * @param {string} tab  The key that moves focus forward.
 * @return {Promise<Object>} Where focus landed.
 */
const tabOutOfMenu = async ( page, tab ) => {
	let now = await describe( page );
	for ( let i = 0; i < 20 && now.inMenu; i++ ) {
		await page.keyboard.press( tab );
		now = await describe( page );
	}
	return now;
};

const menuOpen = ( page ) =>
	page.evaluate( () =>
		document
			.querySelector( '.cds--header__nav' )
			.classList.contains( 'awt-nav-open' )
	);

test.describe( 'Mobile menu Tab order', () => {
	// The gate site's short menu fits in a row down to about 420px.
	test.use( { viewport: { width: 400, height: 900 } } );

	test( 'Tab off the last item reaches the next header control', async ( {
		page,
		browserName,
	} ) => {
		const tab = tabKey( browserName );
		await page.goto( '/' );
		// The first visible control after the menu, in page order.
		const expected = await page.evaluate( () => {
			const nav = document.querySelector( '.cds--header__nav' );
			const all = [
				...document.querySelectorAll(
					'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
				),
			];
			const last = all.findLastIndex( ( e ) => nav.contains( e ) );
			const after = all
				.slice( last + 1 )
				.find( ( e ) => e.getClientRects().length );
			return (
				after.getAttribute( 'aria-label' ) || after.textContent
			).trim();
		} );

		// Opened from the keyboard: Safari does not focus a clicked button.
		await page.locator( '.awt-header-nav__trigger' ).focus();
		await page.keyboard.press( 'Enter' );
		expect( await menuOpen( page ) ).toBe( true );
		await page.keyboard.press( tab );
		const first = await describe( page );
		expect( first.inMenu ).toBe( true );

		// Shift+Tab off the first item goes back to the button, menu open.
		await page.keyboard.press( `Shift+${ tab }` );
		expect( ( await describe( page ) ).name ).toBe( 'Close menu' );
		expect( await menuOpen( page ) ).toBe( true );
		await page.keyboard.press( tab );

		expect( await tabOutOfMenu( page, tab ) ).toEqual( {
			name: expected,
			inMenu: false,
			inHeader: true,
		} );
		await expect.poll( () => menuOpen( page ) ).toBe( false );
		await expect(
			page.locator( '.awt-header-nav__trigger' )
		).toHaveAttribute( 'aria-expanded', 'false' );
	} );
} );
