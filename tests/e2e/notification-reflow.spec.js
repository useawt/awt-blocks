/**
 * Notifications fit the space they sit in, down to 280px.
 *
 * Carbon fixes an inline notification at 18rem (288px) on small screens and
 * a toast at 18rem, which a Section's padding leaves no room for at 320px:
 * the notification stuck out past the content, and at 280px the page
 * scrolled sideways with the close button cut off (reported by the outside
 * accessibility review, 2026-10-15). Where there is room they keep Carbon's
 * widths, checked at 1280px.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/section -->
<!-- wp:awt/notification {"kind":"warning","title":"The events feed changes on 1 October","subtitle":"Update your links."} /-->
<!-- wp:awt/notification {"kind":"error","title":"Connection lost","subtitle":"Retrying.","caption":"Just now","variant":"toast"} /-->
<!-- /wp:awt/section -->
`;

const measure = ( page ) =>
	page.evaluate( () => {
		const view = document.documentElement.clientWidth;
		const items = [
			...document.querySelectorAll(
				'main .cds--inline-notification, main .cds--toast-notification'
			),
		].map( ( n ) => {
			const box = n.getBoundingClientRect();
			const close = n
				.querySelector( '[class*="close-button"]' )
				.getBoundingClientRect();
			return {
				kind: n.classList.contains( 'cds--toast-notification' )
					? 'toast'
					: 'inline',
				width: Math.round( box.width ),
				past: Math.round(
					box.right - n.parentElement.getBoundingClientRect().right
				),
				closeOff: Math.round( Math.max( 0, close.right - view ) ),
			};
		} );
		return {
			sideways: document.documentElement.scrollWidth > view,
			items,
		};
	} );

test.describe( 'Notification reflow', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'gate — notification reflow',
			content: CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	for ( const width of [ 320, 280 ] ) {
		test( `fits its container at ${ width }px`, async ( { page } ) => {
			await page.setViewportSize( { width, height: 900 } );
			await page.goto( `/?page_id=${ pageId }` );
			const { sideways, items } = await measure( page );
			expect( items.map( ( i ) => i.kind ) ).toEqual( [
				'inline',
				'toast',
			] );
			expect( sideways ).toBe( false );
			expect(
				items.map( ( { kind, past, closeOff } ) => ( {
					kind,
					past: Math.max( 0, past ),
					closeOff,
				} ) )
			).toEqual( [
				{ kind: 'inline', past: 0, closeOff: 0 },
				{ kind: 'toast', past: 0, closeOff: 0 },
			] );
		} );
	}

	test( 'keeps Carbon widths where there is room', async ( { page } ) => {
		await page.setViewportSize( { width: 1280, height: 900 } );
		await page.goto( `/?page_id=${ pageId }` );
		const { items } = await measure( page );
		// Carbon: an inline notification up to 46rem from 66rem wide, a
		// toast 18rem.
		expect( items[ 0 ].width ).toBeGreaterThan( 288 );
		expect( items[ 0 ].width ).toBeLessThanOrEqual( 736 );
		expect( items[ 1 ].width ).toBe( 288 );
	} );
} );
