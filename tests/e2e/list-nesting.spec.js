/**
 * Indenting a list item, the way the editor's own list does it.
 *
 * AWT could already render a nested list — `awt/list` inside `awt/list-item`
 * is what `render.php` emits and what the HTML and Markdown importers build —
 * but there was no way to make one by hand. These cover the two things that
 * matter: that the keys and buttons people already know do what they do in
 * WordPress, and that what comes out is an AWT sub-list rather than a plain
 * one (Carbon needs `cds--list--nested` for the markers and the indent).
 */

const { test, expect } = require( './fixtures' );

const THREE_ITEMS = `<!-- wp:awt/list {"type":"unordered"} -->
<!-- wp:awt/list-item {"content":"One"} /-->
<!-- wp:awt/list-item {"content":"Two"} /-->
<!-- wp:awt/list-item {"content":"Three"} /-->
<!-- /wp:awt/list -->`;

/**
 * Open a page holding the three-item list and wait for it to render.
 *
 * @param {Object} admin        Admin utilities.
 * @param {Object} editor       Editor utilities.
 * @param {Object} requestUtils REST utilities.
 * @param {string} title        Page title, unique per test.
 * @param {string} status       Post status to create it with.
 * @return {Promise<Object>} The created page.
 */
async function openList(
	admin,
	editor,
	requestUtils,
	title,
	status = 'publish'
) {
	const created = await requestUtils.createPage( {
		title,
		content: THREE_ITEMS,
		status,
	} );
	await admin.editPost( created.id );
	await editor.canvas.locator( '.cds--list__item' ).first().waitFor();
	return created;
}

/**
 * Put the caret at the very start of the item with this text.
 *
 * Focused rather than clicked: once an item is selected the block toolbar
 * floats over the item above it, and a click on that item is intercepted by
 * the toolbar instead. Focus does not care what is drawn on top.
 *
 * @param {Object} editor Editor utilities.
 * @param {Object} page   The Playwright page.
 * @param {string} text   The item's text.
 */
async function caretAtStartOf( editor, page, text ) {
	const editable = editor.canvas
		.locator( '.cds--list__item span[contenteditable]', { hasText: text } )
		.first();
	await editable.waitFor();
	await editable.focus();
	await page.keyboard.press( 'Home' );
}

/**
 * The list tree as [ item text, [ nested item texts ] ] pairs.
 *
 * @param {Object} editor Editor utilities.
 * @return {Promise<Array>} One pair per top-level item.
 */
async function shape( editor ) {
	const [ list ] = await editor.getBlocks();
	return list.innerBlocks.map( ( item ) => [
		item.attributes.content,
		( item.innerBlocks[ 0 ]?.innerBlocks ?? [] ).map(
			( sub ) => sub.attributes.content
		),
	] );
}

test.describe( 'List nesting', () => {
	test( 'Tab at the start of an item nests it under the one above', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openList( admin, editor, requestUtils, 'List nesting tab' );
		await caretAtStartOf( editor, page, 'Two' );
		await page.keyboard.press( 'Tab' );

		expect( await shape( editor ) ).toEqual( [
			[ 'One', [ 'Two' ] ],
			[ 'Three', [] ],
		] );
	} );

	test( 'the sub-list it creates is an AWT sub-list', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openList( admin, editor, requestUtils, 'List nesting attrs' );
		await caretAtStartOf( editor, page, 'Two' );
		await page.keyboard.press( 'Tab' );

		const [ list ] = await editor.getBlocks();
		const subList = list.innerBlocks[ 0 ].innerBlocks[ 0 ];
		expect( subList.name ).toBe( 'awt/list' );
		// Carbon styles a sub-list from this attribute; without it the markers
		// and the indent are those of a top-level list.
		expect( subList.attributes.nested ).toBe( true );
		expect( subList.attributes.type ).toBe( 'unordered' );
	} );

	test( 'Shift+Tab puts it back', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openList( admin, editor, requestUtils, 'List nesting shift tab' );
		await caretAtStartOf( editor, page, 'Two' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Shift+Tab' );

		expect( await shape( editor ) ).toEqual( [
			[ 'One', [] ],
			[ 'Two', [] ],
			[ 'Three', [] ],
		] );
	} );

	test( 'the first item cannot be indented, and a top-level item cannot be outdented', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openList( admin, editor, requestUtils, 'List nesting limits' );
		await caretAtStartOf( editor, page, 'One' );

		await expect(
			page.getByRole( 'button', { name: 'Indent' } )
		).toBeDisabled();
		await expect(
			page.getByRole( 'button', { name: 'Outdent' } )
		).toBeDisabled();

		await page.keyboard.press( 'Tab' );
		expect( await shape( editor ) ).toEqual( [
			[ 'One', [] ],
			[ 'Two', [] ],
			[ 'Three', [] ],
		] );
	} );

	test( 'the toolbar buttons do the same as the keys', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openList( admin, editor, requestUtils, 'List nesting toolbar' );
		await caretAtStartOf( editor, page, 'Two' );

		await page.getByRole( 'button', { name: 'Indent' } ).click();
		expect( await shape( editor ) ).toEqual( [
			[ 'One', [ 'Two' ] ],
			[ 'Three', [] ],
		] );

		await page.getByRole( 'button', { name: 'Outdent' } ).click();
		expect( await shape( editor ) ).toEqual( [
			[ 'One', [] ],
			[ 'Two', [] ],
			[ 'Three', [] ],
		] );
	} );

	test( 'items below an outdented one follow it, keeping their own depth', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openList( admin, editor, requestUtils, 'List nesting following' );
		// One > (Two, Three)
		await caretAtStartOf( editor, page, 'Two' );
		await page.keyboard.press( 'Tab' );
		await caretAtStartOf( editor, page, 'Three' );
		await page.keyboard.press( 'Tab' );
		expect( await shape( editor ) ).toEqual( [
			[ 'One', [ 'Two', 'Three' ] ],
		] );

		// Outdenting Two must take Three with it, under Two — not leave it
		// behind at a depth that no longer means anything.
		await caretAtStartOf( editor, page, 'Two' );
		await page.keyboard.press( 'Shift+Tab' );
		expect( await shape( editor ) ).toEqual( [
			[ 'One', [] ],
			[ 'Two', [ 'Three' ] ],
		] );
	} );

	test( 'a sub-list is indented by the same 36px Carbon indents one by', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// Carbon's UnorderedList → Nested story, measured 2026-09-20: the
		// sub-list's text sits 36px right of its parent's — 32px of indent
		// plus the 4px Carbon puts on a sub-list's items. Ours indented by 60
		// until the theme stopped adding its own marker padding on top.
		const created = await requestUtils.createPage( {
			title: 'List nesting indent',
			content: `<!-- wp:awt/list -->
<!-- wp:awt/list-item {"content":"Parent"} -->
<!-- wp:awt/list {"nested":true} -->
<!-- wp:awt/list-item {"content":"Child"} -->
<!-- wp:awt/list {"nested":true} -->
<!-- wp:awt/list-item {"content":"Grandchild"} /-->
<!-- /wp:awt/list -->
<!-- /wp:awt/list-item -->
<!-- /wp:awt/list -->
<!-- /wp:awt/list-item -->
<!-- /wp:awt/list -->`,
			status: 'publish',
		} );

		const steps = async ( scope ) =>
			scope.evaluate( () => {
				const textLeft = ( el ) => {
					const range = document.createRange();
					range.selectNodeContents( el );
					return Math.round( range.getBoundingClientRect().left );
				};
				const level = ( depth ) =>
					textLeft(
						document.querySelectorAll( '.cds--list__item' )[ depth ]
					);
				return [ level( 1 ) - level( 0 ), level( 2 ) - level( 1 ) ];
			} );

		await page.goto( created.link );
		expect( await steps( page ), 'on the page' ).toEqual( [ 36, 36 ] );

		// The editor has to agree, or authors lay out against the wrong indent.
		await admin.editPost( created.id );
		await editor.canvas.locator( '.cds--list__item' ).first().waitFor();
		expect(
			await steps( editor.canvas.locator( 'body' ) ),
			'in the editor'
		).toEqual( [ 36, 36 ] );
	} );

	test( 'the page renders the sub-list inside the item', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const created = await openList(
			admin,
			editor,
			requestUtils,
			'List nesting front end',
			'draft'
		);
		await caretAtStartOf( editor, page, 'Two' );
		await page.keyboard.press( 'Tab' );
		await editor.publishPost();

		await page.goto( created.link );
		const nested = page.locator(
			'li.cds--list__item > ul.cds--list--nested'
		);
		await expect( nested ).toHaveCount( 1 );
		await expect( nested.locator( '> li' ) ).toHaveText( [ 'Two' ] );
	} );
} );
