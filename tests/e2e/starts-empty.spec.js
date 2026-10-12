/**
 * Blocks added from the inserter start empty.
 *
 * They used to carry a word like "Button" or "Tag" as real text, so the
 * author had to delete it before typing their own (found 2026-10-12). Now
 * the word is a hint that typing replaces.
 *
 * The first test reads what the inserter will create for every block that
 * starts empty. The second does it the way an author does, with /tag, and
 * types.
 */

const { test, expect } = require( './fixtures' );

// Each block and the text attributes it starts without.
const STARTS_EMPTY = {
	'awt/tag': [ 'text' ],
	'awt/button': [ 'text' ],
	'awt/link': [ 'text' ],
	'awt/modal-opener': [ 'text' ],
	'awt/menu-button': [ 'label' ],
	'awt/tooltip': [ 'triggerText' ],
	'awt/notification': [ 'title' ],
	'awt/modal': [ 'heading' ],
	'awt/stat': [ 'value', 'heading' ],
	'awt/checkbox': [ 'label' ],
	'awt/text-input': [ 'label' ],
	'awt/toggle': [ 'label' ],
	'awt/text-area': [ 'label' ],
	'awt/select': [ 'label' ],
	'awt/dropdown': [ 'label' ],
	'awt/tile-group': [ 'label' ],
};

test( 'every block that starts empty is inserted with no text', async ( {
	admin,
	page,
} ) => {
	await admin.createNewPost();
	const found = await page.evaluate( ( blocks ) => {
		const items = window.wp.data
			.select( 'core/block-editor' )
			.getInserterItems();
		return Object.fromEntries(
			Object.entries( blocks ).map( ( [ name, keys ] ) => {
				const forBlock = items.filter( ( i ) => i.name === name );
				return [
					name,
					forBlock.map( ( i ) => ( {
						title: i.title,
						text: keys.map( ( k ) => i.initialAttributes?.[ k ] ),
					} ) ),
				];
			} )
		);
	}, STARTS_EMPTY );

	for ( const [ name, keys ] of Object.entries( STARTS_EMPTY ) ) {
		// One inserter entry, under the block's own name, with empty text.
		expect( found[ name ], name ).toHaveLength( 1 );
		expect( found[ name ][ 0 ].title, name ).toBeTruthy();
		expect( found[ name ][ 0 ].text, name ).toEqual( keys.map( () => '' ) );
	}
} );

test( 'a new tag shows a hint, and typing gives only what was typed', async ( {
	admin,
	editor,
	page,
} ) => {
	await admin.createNewPost();
	await editor.canvas
		.getByRole( 'button', { name: 'Add default block' } )
		.click();
	await page.keyboard.type( '/tag' );
	await expect(
		page.locator( '.components-autocomplete__result' ).first()
	).toHaveText( 'Tag' );
	await page.keyboard.press( 'Enter' );

	const label = editor.canvas.locator( '.wp-block-awt-tag .cds--tag__label' );
	await expect( label ).toHaveAttribute( 'aria-label', 'Tag label' );
	await expect( label ).toHaveText( '' );

	await page.keyboard.type( 'Beta' );
	await expect( label ).toHaveText( 'Beta' );
	expect(
		await page.evaluate( () => {
			const store = window.wp.data.select( 'core/block-editor' );
			const [ tag ] = store.getBlocksByName( 'awt/tag' );
			return store.getBlockAttributes( tag ).text;
		} )
	).toBe( 'Beta' );
} );

test( 'a new block puts the cursor in its text', async ( { admin, page } ) => {
	await admin.createNewPost();
	// The Checkbox, Toggle and Menu button previews came first in the Tab
	// order, so a new one put the cursor on the control and typing went
	// nowhere.
	for ( const name of Object.keys( STARTS_EMPTY ) ) {
		const typedInto = await page.evaluate( async ( blockName ) => {
			const { select, dispatch } = window.wp.data;
			const store = select( 'core/block-editor' );
			const item = store
				.getInserterItems()
				.find( ( i ) => i.name === blockName );
			const block = window.wp.blocks.createBlock(
				blockName,
				item.initialAttributes
			);
			dispatch( 'core/block-editor' ).insertBlocks(
				block,
				undefined,
				undefined,
				true,
				0
			);
			await new Promise( ( r ) => setTimeout( r, 300 ) );
			const doc = document.querySelector(
				'iframe[name="editor-canvas"]'
			).contentDocument;
			const active = doc.activeElement;
			// By type: a tag or button added outside a row is wrapped in an
			// Inline set, which gives it a new client ID.
			return active?.isContentEditable &&
				active.closest( '[data-type]' )?.dataset.type === blockName
				? 'its text'
				: active?.tagName;
		}, name );
		expect( typedInto, name ).toBe( 'its text' );
	}
} );

test( 'Enter in a tag starts the next tag, never a second line', async ( {
	admin,
	editor,
	page,
} ) => {
	await admin.createNewPost();
	await editor.canvas
		.getByRole( 'button', { name: 'Add default block' } )
		.click();
	await page.keyboard.type( '/tag' );
	await expect(
		page.locator( '.components-autocomplete__result' ).first()
	).toHaveText( 'Tag' );
	await page.keyboard.press( 'Enter' );

	const shape = () =>
		page.evaluate( () => {
			const store = window.wp.data.select( 'core/block-editor' );
			const show = ( ids ) =>
				ids.map( ( id ) => {
					const b = store.getBlock( id );
					const kids = store.getBlockOrder( id );
					return kids.length
						? `${ b.name }[${ show( kids ).join( ', ' ) }]`
						: `${ b.name } "${ b.attributes.text ?? '' }"`;
				} );
			return show( store.getBlockOrder() ).join( ' | ' );
		} );

	// Typed tags, one after another.
	await page.keyboard.type( 'Beta' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( 'New' );
	await page.keyboard.press( 'Shift+Enter' );
	await page.keyboard.press( 'Enter' );
	expect( await shape() ).toBe(
		'awt/inline-set[awt/tag "Beta", awt/tag "New", awt/tag ""]'
	);

	// Enter on the empty one leaves the row.
	await page.keyboard.press( 'Enter' );
	expect( await shape() ).toBe(
		'awt/inline-set[awt/tag "Beta", awt/tag "New"] | core/paragraph ""'
	);
} );
