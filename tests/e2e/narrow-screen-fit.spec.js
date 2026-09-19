/**
 * Nothing hangs off a 320px screen.
 *
 * 320px is the width WCAG 1.4.10 (Reflow) names, and two things were past it
 * on the site this was found on (2026-09-19):
 *
 * 1. The header row. Carbon's header assumes a short product name; a logo is
 *    a fixed-width image, so with the menu already in the drawer the row still
 *    measured 336px and the last global action sat off the side of the screen,
 *    unreachable. The logo now gives way — but only once the header is
 *    collapsed, which the second test guards: the row/drawer decision is made
 *    by measuring whether the row overflows, so a brand that could shrink at
 *    any time would remove that signal and leave the menu a row on a phone.
 *
 * 2. A button with a long label. Carbon reserves 4rem of trailing padding for
 *    an icon slot whether or not there is an icon, and caps the button at
 *    20rem — wider than a 320px screen minus the page's own padding — and
 *    nothing made it fit a narrower column.
 *
 * The logo is added here rather than configured through AWT Settings because
 * the defect is in the CSS that sizes the row, not in how the logo is chosen.
 * The markup mirrors render.php: an <img class="cds--header__logo"> inside the
 * brand link.
 */

const { test, expect } = require( './fixtures' );

// 10:1, so at the header's 1.5rem logo height it wants 240px and the theme's
// own 12rem cap holds it at 192 — still far more than a 320px row has left
// once the trigger and the actions have taken theirs.
const WIDE_LOGO =
	'data:image/svg+xml,' +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="24">' +
			'<rect width="240" height="24" fill="#0f62fe"/></svg>'
	);

// The theme caps a header logo at 12rem.
const CAPPED_LOGO = 192;

const addLogo = ( page ) =>
	page.evaluate( ( src ) => {
		const brand = document.querySelector( '.cds--header__name' );
		const img = document.createElement( 'img' );
		img.className = 'cds--header__logo';
		img.src = src;
		img.alt = '';
		brand.prepend( img );
		return new Promise( ( resolve ) => {
			if ( img.complete ) {
				resolve();
				return;
			}
			img.addEventListener( 'load', () => resolve() );
		} );
	}, WIDE_LOGO );

const headerFit = ( page ) =>
	page.evaluate( () => {
		const global = document.querySelector( '.cds--header__global' );
		const logo = document.querySelector( '.cds--header__logo' );
		return {
			collapsed: document.documentElement.classList.contains(
				'awt-header-collapsed'
			),
			globalRight: global.getBoundingClientRect().right,
			logoWidth: logo.getBoundingClientRect().width,
			viewport: document.documentElement.clientWidth,
		};
	} );

test.describe( 'A narrow screen', () => {
	test( 'keeps every header control on it', async ( { page } ) => {
		await page.setViewportSize( { width: 320, height: 700 } );
		await page.goto( '/' );
		await addLogo( page );
		await page.evaluate( () =>
			window.dispatchEvent( new Event( 'resize' ) )
		);

		await expect
			.poll( async () => ( await headerFit( page ) ).collapsed )
			.toBe( true );
		const fit = await headerFit( page );
		expect( fit.globalRight ).toBeLessThanOrEqual( fit.viewport + 1 );
		expect( fit.logoWidth ).toBeLessThan( CAPPED_LOGO );
	} );

	test( 'leaves the logo alone while the header is a row', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1440, height: 700 } );
		await page.goto( '/' );
		await addLogo( page );
		await page.evaluate( () =>
			window.dispatchEvent( new Event( 'resize' ) )
		);

		const fit = await headerFit( page );
		expect( fit.collapsed ).toBe( false );
		// Its full width: what the collapse measurement has to keep seeing.
		expect( fit.logoWidth ).toBe( CAPPED_LOGO );
	} );

	test( 'keeps a long button inside its column', async ( {
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'gate — a long button label',
			content:
				'<!-- wp:awt/button {"text":"Contact us to become a referrer","url":"https://example.com/"} /-->',
			status: 'publish',
		} );
		await page.setViewportSize( { width: 320, height: 700 } );
		await page.goto( `/?page_id=${ created.id }` );

		const measured = await page.evaluate( () => {
			const btn = document.querySelector( '.cds--btn' );
			const box = btn.getBoundingClientRect();
			const room = btn.parentElement.getBoundingClientRect();
			return {
				right: box.right,
				roomRight: room.right,
				pageOverflow:
					document.documentElement.scrollWidth -
					document.documentElement.clientWidth,
			};
		} );
		expect( measured.right ).toBeLessThanOrEqual( measured.roomRight + 1 );
		expect( measured.pageOverflow ).toBe( 0 );
	} );
} );
