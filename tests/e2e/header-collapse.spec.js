/**
 * The header collapses when the menu does not fit, not at a width.
 *
 * Carbon swaps the navigation for a hamburger below 66rem — the width its own
 * short menu needs. A longer menu overflows well above that: on the site this
 * was found on, nine items wrapped and the sign-in button was cut off by the
 * edge of the screen at 1100px. A two-item menu, meanwhile, was being hidden
 * behind a hamburger at 1000px with room to spare.
 *
 * So the question is not "does it collapse at width X" but "does what is on
 * screen fit". Both directions are tested: a menu that fits stays a row where
 * the old breakpoint would have hidden it, and a menu made too long for its
 * space collapses without being told a width.
 *
 * This drives the site's own header rather than a page of blocks, because the
 * header is a template part and that is where the defect lived.
 */

const { test, expect } = require( './fixtures' );

const collapsed = ( page ) =>
	page.evaluate( () =>
		document.documentElement.classList.contains( 'awt-header-collapsed' )
	);

const overflowing = ( page ) =>
	page.evaluate( () => {
		const header = document.querySelector( '.cds--header' );
		return header.scrollWidth > header.clientWidth + 1;
	} );

/**
 * Add long items to the menu, as an author with a lot to link to would.
 *
 * @param {Object} page Playwright page.
 * @return {Promise<void>} Once the menu has grown.
 */
const lengthenMenu = ( page ) =>
	page.evaluate( () => {
		const bar = document.querySelector( '.cds--header__menu-bar' );
		const model = bar.querySelector( 'li' );
		[
			'Features and capabilities',
			'Editions and pricing',
			'Partnership programme',
			'Learn accessibility',
			'Free resources',
			'Documentation and guides',
			'Support and contact',
		].forEach( ( label ) => {
			const item = model.cloneNode( true );
			const link = item.querySelector( 'a' ) || item;
			link.textContent = label;
			bar.appendChild( item );
		} );
		window.dispatchEvent( new Event( 'resize' ) );
	} );

/**
 * Pad the header in to a narrower row, the way the "Header width" setting does
 * when the header is contained to the site's content width.
 *
 * @param {Object} page   Playwright page.
 * @param {number} gutter Pixels taken off each side.
 * @return {Promise<void>} Once the row has been measured again.
 */
const containHeader = ( page, gutter ) =>
	page.evaluate( ( px ) => {
		const style = document.createElement( 'style' );
		style.textContent = `.cds--header{padding-inline:${ px }px !important}`;
		document.head.appendChild( style );
		window.dispatchEvent( new Event( 'resize' ) );
	}, gutter );

test.describe( 'Header collapse', () => {
	test( 'a menu that fits stays a row where a breakpoint would have hidden it', async ( {
		page,
	} ) => {
		// Comfortably below Carbon's 66rem, where the old rule collapsed every
		// header regardless of how little was in it.
		await page.setViewportSize( { width: 900, height: 700 } );
		await page.goto( '/' );
		await expect( page.locator( '.cds--header' ) ).toBeVisible();

		await expect.poll( () => collapsed( page ) ).toBe( false );
		expect( await overflowing( page ) ).toBe( false );
	} );

	test( 'a menu too long for the space collapses, with no width involved', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 900, height: 700 } );
		await page.goto( '/' );
		await expect.poll( () => collapsed( page ) ).toBe( false );

		await lengthenMenu( page );

		await expect.poll( () => collapsed( page ) ).toBe( true );
		expect( await overflowing( page ) ).toBe( false );
	} );

	test( 'it follows the window as it is resized', async ( { page } ) => {
		await page.setViewportSize( { width: 900, height: 700 } );
		await page.goto( '/' );
		await expect.poll( () => collapsed( page ) ).toBe( false );

		// Narrow enough that even this short menu stops fitting.
		await page.setViewportSize( { width: 375, height: 700 } );
		await expect.poll( () => collapsed( page ) ).toBe( true );

		await page.setViewportSize( { width: 900, height: 700 } );
		await expect.poll( () => collapsed( page ) ).toBe( false );
	} );

	// A contained header is padded in to the content width, and the row has to
	// be measured against the width it actually has. `scrollWidth` on a box
	// that overflows visibly counts only what escapes the PADDING box, so the
	// menu spilled into the gutter it was meant to stay out of and nothing
	// collapsed. The measurement is taken under `overflow: hidden` for that.
	test( 'a contained header collapses when the row outgrows the contained width', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1200, height: 700 } );
		await page.goto( '/' );
		await expect.poll( () => collapsed( page ) ).toBe( false );

		// Still roomy: a gutter this size leaves the menu space to sit in.
		await containHeader( page, 100 );
		await expect.poll( () => collapsed( page ) ).toBe( false );

		// A 400px gutter each side leaves 400px of row, which it cannot fit.
		await containHeader( page, 400 );
		await expect.poll( () => collapsed( page ) ).toBe( true );
	} );

	// Deciding whether the menu fits means taking the collapsed class off,
	// reading the width and putting it back. That made the drawer a visible
	// row for an instant and then animated it out again — on every resize,
	// which on a phone is every scroll, because hiding the URL bar changes the
	// window height. The menu opened and closed continuously while scrolling.
	test( 'resizing does not animate the drawer', async ( { page } ) => {
		await page.setViewportSize( { width: 375, height: 700 } );
		await page.goto( '/' );
		await expect.poll( () => collapsed( page ) ).toBe( true );

		await page.evaluate( () => {
			window.__drawerAnimations = 0;
			document
				.querySelector( '.cds--header__nav' )
				.addEventListener( 'transitionrun', () => {
					window.__drawerAnimations += 1;
				} );
		} );

		// Height only: what a phone reports while the URL bar hides.
		for ( const height of [ 640, 700, 640, 700 ] ) {
			await page.setViewportSize( { width: 375, height } );
		}
		// And a real width change, which does have to be measured.
		for ( const width of [ 420, 375, 420 ] ) {
			await page.setViewportSize( { width, height: 700 } );
		}
		await expect.poll( () => collapsed( page ) ).toBe( true );

		expect( await page.evaluate( () => window.__drawerAnimations ) ).toBe(
			0
		);
	} );

	// The pair to the test above: the drawer has to still slide. Suppressing
	// the animation everywhere would pass that one and lose the component.
	test( 'the drawer still animates when it is opened', async ( { page } ) => {
		await page.setViewportSize( { width: 375, height: 700 } );
		await page.goto( '/' );
		await expect.poll( () => collapsed( page ) ).toBe( true );

		await page.evaluate( () => {
			window.__drawerAnimations = [];
			document
				.querySelector( '.cds--header__nav' )
				.addEventListener( 'transitionrun', ( event ) => {
					window.__drawerAnimations.push( event.propertyName );
				} );
		} );

		await page.locator( '.awt-header-nav__trigger' ).click();
		await expect( page.locator( '.cds--header__nav' ) ).toHaveClass(
			/awt-nav-open/
		);

		await expect
			.poll( () => page.evaluate( () => window.__drawerAnimations ) )
			.toContain( 'transform' );
	} );

	test( 'widening with the drawer open puts the row back and closes it', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 375, height: 700 } );
		await page.goto( '/' );
		await expect.poll( () => collapsed( page ) ).toBe( true );

		const trigger = page.locator( '.awt-header-nav__trigger' );
		await trigger.click();
		await expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );

		await page.setViewportSize( { width: 900, height: 700 } );
		await expect.poll( () => collapsed( page ) ).toBe( false );
		// A drawer left open would strand the panel with nothing to close it.
		await expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
	} );
} );
