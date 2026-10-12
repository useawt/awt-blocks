/**
 * A hero takes a tag.
 *
 * A short label like "New" above a hero's heading is common, but the hero's
 * list of blocks left the tag out, so typing /tag inside a hero offered
 * nothing and the editor gave no reason (found 2026-10-12).
 *
 * The test types /tag where an author would, after the hero's description,
 * and reads what the editor offers. The control: the hero still refuses a
 * feature grid, so the list is still a list.
 */

const { test, expect } = require( './fixtures' );

test( 'typing /tag inside a hero offers the Tag block', async ( {
	admin,
	editor,
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'Tag in a hero',
		content: `<!-- wp:awt/hero {"version":2} --><!-- wp:heading {"level":1} --><h1 class="wp-block-heading">Hero</h1><!-- /wp:heading --><!-- wp:paragraph --><p>Description</p><!-- /wp:paragraph --><!-- /wp:awt/hero -->`,
		status: 'publish',
	} );

	await admin.editPost( created.id );
	await editor.canvas.locator( '.awt-hero p' ).click();
	await page.keyboard.press( 'End' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( '/tag' );

	await expect(
		page.locator( '.components-autocomplete__result' ).first()
	).toHaveText( 'Tag' );

	const refused = await page.evaluate( () => {
		const store = window.wp.data.select( 'core/block-editor' );
		const [ hero ] = store.getBlocksByName( 'awt/hero' );
		return ! store.canInsertBlockType( 'awt/feature-grid', hero );
	} );
	expect( refused, 'the hero should still refuse a feature grid' ).toBe(
		true
	);
} );
