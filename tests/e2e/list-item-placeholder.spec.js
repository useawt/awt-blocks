/**
 * A new list item starts empty.
 *
 * `awt/list-item` shipped with `content` defaulting to the word "Item", so
 * every item an author added arrived with that word already typed into it and
 * had to be deleted before anything could be written — on every item, on
 * every list (reported from a live site, 2026-09-18). The block already had a
 * placeholder; a default value is real content and stands in front of one.
 *
 * The render snapshot had frozen the same word as correct output six times
 * over, so nothing in the suite objected. This asserts the attribute itself,
 * which is what an inserted block actually carries.
 */

const { test, expect } = require( './fixtures' );

test.describe( 'List item placeholder', () => {
	test( 'an inserted list item carries no text, and offers a placeholder', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'List item placeholder',
			content: `<!-- wp:awt/list --><!-- wp:awt/list-item {"content":"First item"} /--><!-- /wp:awt/list -->`,
			status: 'publish',
		} );

		await admin.editPost( created.id );
		await editor.canvas.locator( '.cds--list__item' ).first().waitFor();

		// What a freshly inserted item is made of.
		const fresh = await page.evaluate(
			() =>
				window.wp.blocks.createBlock( 'awt/list-item' ).attributes
					.content
		);
		expect( fresh, 'a new list item should start with no text' ).toBe( '' );

		// Add one through the editor, the way an author would.
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const list = select( 'core/block-editor' )
				.getBlocks()
				.find( ( b ) => b.name === 'awt/list' );
			dispatch( 'core/block-editor' ).insertBlock(
				window.wp.blocks.createBlock( 'awt/list-item' ),
				undefined,
				list.clientId
			);
		} );

		const texts = await page.evaluate( () => {
			const { select } = window.wp.data;
			const list = select( 'core/block-editor' )
				.getBlocks()
				.find( ( b ) => b.name === 'awt/list' );
			return list.innerBlocks.map( ( b ) => b.attributes.content );
		} );
		expect( texts, 'the item added should be the empty one' ).toEqual( [
			'First item',
			'',
		] );

		// And the author is told what the empty item is for.
		await expect(
			editor.canvas
				.locator( '.cds--list__item [data-rich-text-placeholder]' )
				.first(),
			'the empty item should show its placeholder'
		).toBeVisible();
	} );
} );
