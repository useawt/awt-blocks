/**
 * Items in a vertical Inline set keep their own width.
 *
 * The vertical set stretched its items across the row. Buttons never
 * stretched (Carbon sizes them to their content), but links, tags and icons
 * did: a link's box ran the whole row while its text stayed short, so its
 * focus ring outlined the row and a click anywhere on it followed the link
 * (found by the owner on useawt.com/accessibility/, 2026-10-14).
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `<!-- wp:awt/inline-set {"orientation":"vertical"} -->
<!-- wp:awt/link {"text":"Easy Surf","href":"/surf","size":"lg","iconName":"launch"} /-->
<!-- wp:awt/tag {"text":"Beta"} /-->
<!-- wp:awt/button {"text":"Primary action"} /-->
<!-- /wp:awt/inline-set -->`;

const widths = ( page ) =>
	page.evaluate( () => {
		const set = document.querySelector( '.awt-inline-set--vertical' );
		return {
			set: Math.round( set.getBoundingClientRect().width ),
			items: [
				...set.querySelectorAll( '.cds--link, .cds--tag, .cds--btn' ),
			].map( ( el ) => Math.round( el.getBoundingClientRect().width ) ),
		};
	} );

test( 'a vertical set keeps each item at its own width', async ( {
	page,
	admin,
	editor,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — vertical inline set',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );
	const onPage = await widths( page );
	expect( onPage.set ).toBeGreaterThan( 600 );
	expect( onPage.items ).toHaveLength( 3 );
	for ( const w of onPage.items ) {
		expect( w ).toBeLessThan( 300 );
	}
	// The link's box is its text and icon, so its focus ring is too.
	const link = page.getByRole( 'link', { name: /Easy Surf/ } );
	const box = await link.boundingBox();
	const content = await link.evaluate( ( el ) => {
		const range = document.createRange();
		range.selectNodeContents( el );
		return range.getBoundingClientRect().width;
	} );
	expect( Math.abs( box.width - content ) ).toBeLessThan( 2 );

	await admin.editPost( created.id );
	await expect(
		editor.canvas.locator( '.awt-inline-set--vertical' )
	).toBeVisible();
	const frame = page.frame( { name: 'editor-canvas' } );
	const inEditor = await widths( frame );
	for ( const w of inEditor.items ) {
		expect( w ).toBeLessThan( 300 );
	}
} );
