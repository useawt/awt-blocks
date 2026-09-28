/**
 * A small inline block dropped straight on the page arrives in an Inline set.
 *
 * Buttons, tags, links, icons, modal openers and toggletips are inline boxes,
 * and a loose one sits at the page's padding edge instead of in the content
 * column, 176px left of the text on a 1440px screen (found on the sandbox,
 * 2026-09-28). The editor now puts a just-inserted one in a set. What these
 * tests hold is the part an author would feel if it went wrong: one undo
 * takes the whole insert away, a block already in a set or a row is not
 * wrapped again, and a page that already has loose blocks is not changed by
 * being opened.
 */

const { test, expect } = require( './fixtures' );

const tree = ( blocks ) =>
	blocks.map( ( b ) =>
		b.innerBlocks.length ? { [ b.name ]: tree( b.innerBlocks ) } : b.name
	);

test.describe( 'Loose inline blocks get an Inline set', () => {
	test( 'an Inline set takes a toggletip and still refuses a paragraph', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'awt/inline-set' } );
		const can = ( name ) =>
			page.evaluate( ( n ) => {
				const { select } = window.wp.data;
				const [ set ] = select( 'core/block-editor' ).getBlocks();
				return select( 'core/block-editor' ).canInsertBlockType(
					n,
					set.clientId
				);
			}, name );
		expect( await can( 'awt/toggletip' ) ).toBe( true );
		expect( await can( 'core/paragraph' ) ).toBe( false );
	} );

	test( 'a tag inserted on the page is wrapped, and one undo removes both', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'awt/tag',
			attributes: { text: 'New' },
		} );
		await expect
			.poll( async () => tree( await editor.getBlocks() ) )
			.toEqual( [ { 'awt/inline-set': [ 'awt/tag' ] } ] );

		// The tag keeps the selection, so the author carries on editing it.
		const selected = await page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
					?.name
		);
		expect( selected ).toBe( 'awt/tag' );

		await pageUtils.pressKeys( 'primary+z' );
		await expect
			.poll( async () => tree( await editor.getBlocks() ) )
			.toEqual( [] );
	} );

	test( 'the slash inserter wraps too', async ( { admin, editor, page } ) => {
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '/toggletip' );
		await expect(
			page.getByRole( 'option', { name: 'Toggletip', exact: true } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await expect
			.poll( async () => tree( await editor.getBlocks() ) )
			.toEqual( [ { 'awt/inline-set': [ 'awt/toggletip' ] } ] );
	} );

	test( 'several inserted together share one set', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await page.evaluate( () => {
			const { createBlock } = window.wp.blocks;
			window.wp.data
				.dispatch( 'core/block-editor' )
				.insertBlocks( [
					createBlock( 'awt/tag', { text: 'One' } ),
					createBlock( 'awt/tag', { text: 'Two' } ),
					createBlock( 'awt/tag', { text: 'Three' } ),
				] );
		} );
		await expect
			.poll( async () => tree( await editor.getBlocks() ) )
			.toEqual( [
				{ 'awt/inline-set': [ 'awt/tag', 'awt/tag', 'awt/tag' ] },
			] );
	} );

	test( 'a block inserted into a set or a row is not wrapped again', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'awt/inline-set' } );
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
		} );
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const { createBlock } = window.wp.blocks;
			const [ set, row ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).insertBlock(
				createBlock( 'awt/link', { text: 'In the set' } ),
				undefined,
				set.clientId
			);
			dispatch( 'core/block-editor' ).insertBlock(
				createBlock( 'awt/link', { text: 'In the row' } ),
				undefined,
				row.clientId
			);
		} );
		// Give a wrap the chance to happen before asserting it did not.
		await page.waitForTimeout( 500 );
		expect( tree( await editor.getBlocks() ) ).toEqual( [
			{ 'awt/inline-set': [ 'awt/button', 'awt/button', 'awt/link' ] },
			{ 'core/group': [ 'awt/link' ] },
		] );
	} );

	test( 'a page that already has a loose button is not changed by opening it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Loose button',
			content:
				'<!-- wp:awt/button {"text":"Loose"} /--><!-- wp:paragraph --><p>Text</p><!-- /wp:paragraph -->',
			status: 'publish',
		} );
		await admin.editPost( created.id );
		await editor.canvas.locator( '.wp-block-awt-button' ).first().waitFor();
		await page.waitForTimeout( 500 );
		expect( tree( await editor.getBlocks() ) ).toEqual( [
			'awt/button',
			'core/paragraph',
		] );
		expect(
			await page.evaluate( () =>
				window.wp.data.select( 'core/editor' ).isEditedPostDirty()
			)
		).toBe( false );
	} );
} );
