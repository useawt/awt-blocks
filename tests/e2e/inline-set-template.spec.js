/**
 * A fresh Inline set arrives with two labelled buttons.
 *
 * Its starter template set `label` on each button, and the button block's
 * attribute is `text` — so the labels were dropped and an author inserting an
 * Inline set got two buttons both reading "Button" (found 2026-09-09). An
 * unknown attribute is not an error anywhere in the block API, so nothing
 * reported it; only reading the block back does.
 */

const { test, expect } = require( './fixtures' );

test.describe( 'Inline set starter template', () => {
	test( 'the two buttons keep the labels the template gives them', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'awt/inline-set' } );

		const [ set ] = await editor.getBlocks();
		const labels = set.innerBlocks.map( ( b ) => b.attributes.text );

		expect( labels ).toEqual( [ 'Primary action', 'Secondary action' ] );
	} );
} );
