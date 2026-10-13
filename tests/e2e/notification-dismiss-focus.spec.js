/**
 * Closing a notification moves focus to the next control after it.
 *
 * Hiding the notification took its close button, and focus with it, so
 * focus fell to the page. Chrome happened to continue Tab from about the
 * right place, which hid the problem there; Safari went back to the top of
 * the page, and screen readers lost their place in every browser (reported
 * by the outside accessibility review, 2026-10-13). This file also runs in
 * WebKit for that reason.
 */

const { test, expect } = require( './fixtures' );

const note = ( title ) =>
	`<!-- wp:awt/notification {"title":"${ title }","kind":"info"} /-->`;

const CONTENT = `
${ note( 'First' ) }
${ note( 'Second' ) }
<!-- wp:paragraph --><p>Text after the notifications.</p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p><a href="#after">A link after them</a></p><!-- /wp:paragraph -->
`;

test( 'closing a notification moves focus to the next control', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — notification focus',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );

	const focused = () =>
		page.evaluate( () => {
			const el =
				document.querySelector( 'main' ).ownerDocument.activeElement;
			if ( el === el.ownerDocument.body ) {
				return 'body';
			}
			return ( el.getAttribute( 'aria-label' ) || el.textContent ).trim();
		} );
	const closes = page.getByRole( 'button', { name: 'Close notification' } );

	// The first one's close button, from the keyboard.
	await closes.first().focus();
	await page.keyboard.press( 'Enter' );
	await expect( page.getByText( 'First' ) ).toBeHidden();
	// The next control is the second notification's close button.
	expect( await focused() ).toBe( 'Close notification' );
	await expect( closes ).toHaveCount( 1 );

	// Closing the last one moves on to the link after them, past the
	// paragraph, which takes no focus.
	await page.keyboard.press( 'Enter' );
	await expect( page.getByText( 'Second' ) ).toBeHidden();
	expect( await focused() ).toBe( 'A link after them' );
} );
