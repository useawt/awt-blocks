/**
 * A button's Size control changes the button's size.
 *
 * Carbon v11 does not size a button from `cds--btn--{size}`. The height comes
 * from `--cds-layout-size-height`, and the only thing that sets it is the
 * `cds--layout--size-{size}` utility class. `awt/button` knew that and its
 * render says so in a comment; `awt/modal-opener` and `awt/menu-button` did
 * not, so their Size control rewrote the markup and changed nothing on screen
 * — reported on a live site, on buttons set to Small that stayed at Carbon's
 * `lg` default of 48px (2026-09-09).
 *
 * Class parity could not catch it: both renderings emitted the same wrong
 * class list. What was missing was an assertion about the rendered size, on
 * the page AND in the canvas, which is what this file is.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/button {"text":"Button small","size":"sm"} /-->
<!-- wp:awt/button {"text":"Button large","size":"lg"} /-->
<!-- wp:awt/modal-opener {"text":"Opener small","size":"sm","modalId":"size-modal"} /-->
<!-- wp:awt/modal-opener {"text":"Opener large","size":"lg","modalId":"size-modal"} /-->
<!-- wp:awt/menu-button {"label":"Menu small","size":"sm"} /-->
<!-- wp:awt/menu-button {"label":"Menu large","size":"lg"} /-->
<!-- wp:awt/modal {"id":"size-modal","heading":"Not the subject"} -->
<!-- wp:paragraph --><p>Body.</p><!-- /wp:paragraph -->
<!-- /wp:awt/modal -->
`;

// Height of the button whose label starts with the given text.
const HEIGHTS = () => {
	const out = {};
	document.querySelectorAll( '.cds--btn' ).forEach( ( el ) => {
		const label = el.textContent.trim();
		if ( /^(Button|Opener|Menu) (small|large)$/.test( label ) ) {
			out[ label ] = Math.round( el.getBoundingClientRect().height );
		}
	} );
	return out;
};

const PAIRS = [ 'Button', 'Opener', 'Menu' ];

test.describe( 'Button sizes', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'Button sizes',
			content: CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	test( 'small is smaller than large, on the page', async ( { page } ) => {
		await page.goto( `/?page_id=${ pageId }` );
		const heights = await page.evaluate( HEIGHTS );

		for ( const block of PAIRS ) {
			expect(
				heights[ `${ block } small` ],
				`${ block }: small should be shorter than large, got ${ JSON.stringify(
					heights
				) }`
			).toBeLessThan( heights[ `${ block } large` ] );
		}
	} );

	test( 'and the canvas shows the same sizes as the page', async ( {
		admin,
		editor,
		page,
	} ) => {
		await page.goto( `/?page_id=${ pageId }` );
		const onPage = await page.evaluate( HEIGHTS );

		await admin.editPost( pageId );
		await expect(
			editor.canvas.locator( '.cds--btn' ).first()
		).toBeVisible();
		const inEditor = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body, collect ) => {
				// eslint-disable-next-line no-eval
				return eval( `(${ collect })` )();
			}, HEIGHTS.toString() );

		for ( const block of PAIRS ) {
			for ( const size of [ 'small', 'large' ] ) {
				const key = `${ block } ${ size }`;
				expect( inEditor[ key ], `${ key } in the canvas` ).toBe(
					onPage[ key ]
				);
			}
		}
	} );
} );
