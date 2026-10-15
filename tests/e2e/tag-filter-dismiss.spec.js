/**
 * A filter tag's dismiss button removes the tag and moves focus on.
 *
 * The button had no script, so pressing it did nothing, and with several
 * filters every one was named just "Dismiss" (reported by the outside
 * accessibility review, 2026-10-15). Runs in WebKit too, where focus loss
 * sends Tab back to the top of the page. The buttons' names are checked in
 * tag-filter-names.spec.js.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/tag {"text":"Region: us-east","filter":true} /-->
<!-- wp:awt/tag {"text":"Status: open","filter":true} /-->
<!-- wp:paragraph --><p><a href="#after">A link after them</a></p><!-- /wp:paragraph -->
`;

test.describe( 'Filter tag dismiss', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'gate — filter tag dismiss',
			content: CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	test( 'dismissing removes the tag and moves focus on', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ pageId }` );
		const buttons = page.locator( 'main .cds--tag__close-icon' );
		await expect( buttons ).toHaveCount( 2 );

		const focused = () =>
			page.evaluate( () => {
				const el =
					document.querySelector( 'main' ).ownerDocument
						.activeElement;
				return el === el.ownerDocument.body
					? 'body'
					: (
							el.getAttribute( 'aria-label' ) || el.textContent
					  ).trim();
			} );

		// The first one, from the keyboard: the tag goes, and focus moves to
		// the next tag's button.
		await buttons.first().focus();
		await page.keyboard.press( 'Enter' );
		await expect( page.getByText( 'Region: us-east' ) ).toBeHidden();
		expect( await focused() ).toBe( 'Dismiss Status: open' );

		// The last one, by mouse: focus moves on to the link after them.
		await buttons.nth( 1 ).click();
		await expect( page.getByText( 'Status: open' ) ).toBeHidden();
		expect( await focused() ).toBe( 'A link after them' );
	} );
} );
