/**
 * A toast lays out as Carbon's does, at every width and in the editor:
 * title, subtitle and caption stacked, the close button in the top corner.
 *
 * The toast shared the inline notification's wrapping row. The subtitle sat
 * beside the title, the close button dropped to a row of its own, and once
 * the toast widened to 22rem at Carbon's max breakpoint (99rem) the caption
 * moved up beside the title. The editor canvas is narrower than the window,
 * so it never showed that (found by the owner, 2026-10-14).
 */

const { test, expect } = require( './fixtures' );

const CONTENT =
	'<!-- wp:awt/notification {"kind":"error","title":"Connection lost","subtitle":"Retrying.","caption":"Just now","variant":"toast"} /-->';

const layout = ( scope ) =>
	scope.evaluate( () => {
		const toast = document.querySelector( '.cds--toast-notification' );
		const box = ( sel ) => {
			const r = toast.querySelector( sel ).getBoundingClientRect();
			return {
				top: r.top,
				bottom: r.bottom,
				left: r.left,
				right: r.right,
			};
		};
		return {
			top: toast.getBoundingClientRect().top,
			title: box( '.cds--toast-notification__title' ),
			subtitle: box( '.cds--toast-notification__subtitle' ),
			caption: box( '.cds--toast-notification__caption' ),
			close: box( '.cds--toast-notification__close-button' ),
		};
	} );

// What is out of place, in words; empty when the toast stacks like Carbon's.
const departures = ( l ) => {
	const found = [];
	if ( l.subtitle.top < l.title.top + 17 ) {
		found.push( 'subtitle beside the title' );
	}
	if ( l.caption.top < l.subtitle.bottom ) {
		found.push( 'caption beside the title' );
	}
	if ( Math.abs( l.caption.left - l.title.left ) >= 1 ) {
		found.push( 'caption not under the title' );
	}
	if ( Math.abs( l.close.top - l.top ) >= 1 ) {
		found.push( 'close button not in the top corner' );
	}
	if ( l.close.left <= l.subtitle.right ) {
		found.push( 'close button over the text' );
	}
	return found;
};

test.describe( 'Toast notification layout', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'gate — toast layout',
			content: CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	for ( const width of [ 1728, 1280, 375 ] ) {
		test( `stacks like Carbon at ${ width }px`, async ( { page } ) => {
			await page.setViewportSize( { width, height: 900 } );
			await page.goto( `/?page_id=${ pageId }` );
			expect( departures( await layout( page ) ) ).toEqual( [] );
		} );
	}

	test( 'stacks the same way in the editor', async ( {
		page,
		admin,
		editor,
	} ) => {
		await page.setViewportSize( { width: 1728, height: 1000 } );
		await admin.editPost( pageId );
		await expect(
			editor.canvas.locator( '.cds--toast-notification' )
		).toBeVisible();
		expect(
			departures(
				await layout( page.frame( { name: 'editor-canvas' } ) )
			)
		).toEqual( [] );
	} );
} );
