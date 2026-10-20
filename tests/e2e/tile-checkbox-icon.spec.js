/**
 * An independent selectable tile shows an empty checkbox until selected.
 *
 * It showed the same filled checkmark in both states, only its colour
 * changing (1.6:1 in dark mode), so an unselected tile looked selected
 * (reported by the outside accessibility review, 2026-10-20). Like Carbon's
 * SelectableTile it now shows an empty square, swapped for a checked one on
 * selection and back again.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/tile {"variant":"selectable"} -->
<!-- wp:paragraph --><p>Toggle me</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->
`;

// The end of each icon's first path: Carbon's Checkbox (an empty square) and
// CheckboxCheckedFilled (a square with a tick cut out).
const EMPTY = 'M6,26V6H26V26Z';
const CHECKED = 'l1.5918,1.5772Z';

const icon = ( tile ) =>
	tile.evaluate( ( e ) => {
		const d = e
			.querySelector( '.cds--tile__checkmark svg path' )
			.getAttribute( 'd' );
		return { checked: e.getAttribute( 'aria-checked' ), d };
	} );

test( 'the icon shows whether the tile is selected', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — tile checkbox icon',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );
	const tile = page.locator( 'main [role="checkbox"]' );

	let now = await icon( tile );
	expect( now.checked ).toBe( 'false' );
	expect( now.d.endsWith( EMPTY ) ).toBe( true );

	await tile.click();
	now = await icon( tile );
	expect( now.checked ).toBe( 'true' );
	expect( now.d.endsWith( CHECKED ) ).toBe( true );

	await page.keyboard.press( 'Space' );
	now = await icon( tile );
	expect( now.checked ).toBe( 'false' );
	expect( now.d.endsWith( EMPTY ) ).toBe( true );
} );
