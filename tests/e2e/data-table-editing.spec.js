/**
 * Typing a Data table in the canvas, and importing one.
 *
 * The cells are typed where they show, like WordPress's own Table block. The
 * block toolbar adds and removes rows and columns, from the cell you are in,
 * and imports pasted CSV (commas, semicolons or a spreadsheet's tabs). Each
 * test saves and reads the published page, so what was typed is what shows.
 *
 * Other code can fill a Data table or a List from somewhere else (the
 * `awt.dataSourceNote` filter, used by AWT Premium's live data). The canvas
 * then shows the block as it is, with the filter's note, not for typing.
 */

const { test, expect } = require( './fixtures' );

/**
 * The first Data table's columns and rows, as plain data.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<{headings: string[], rows: string[][]}>} The table.
 */
async function table( page ) {
	return page.evaluate( () => {
		const block = window.wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.find( ( b ) => b.name === 'awt/data-table' );
		const { headers, rows } = block.attributes;
		return {
			headings: headers.map( ( h ) => String( h.text ) ),
			rows: rows.map( ( r ) =>
				headers.map( ( h ) => String( r[ h.key ] ) )
			),
		};
	} );
}

/**
 * Save the post and return its front-end HTML.
 *
 * @param {Object}                          editor Editor utilities.
 * @param {import('@playwright/test').Page} page
 * @return {Promise<string>} The rendered page.
 */
async function savedPage( editor, page ) {
	await editor.publishPost();
	const link = await page.evaluate( () =>
		window.wp.data.select( 'core/editor' ).getPermalink()
	);
	const response = await page.request.get( link );
	expect( response.status() ).toBe( 200 );
	return response.text();
}

test.describe( 'Data table editing', () => {
	test( 'cells are typed in the canvas; rows and columns come from the toolbar', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'Typed table' } );
		await editor.insertBlock( {
			name: 'awt/data-table',
			attributes: {
				headers: [
					{ key: 'country', text: 'Country' },
					{ key: 'reviews', text: 'Reviews' },
				],
				rows: [ { country: 'Germany', reviews: '470' } ],
			},
		} );

		// Each cell is a named text field: its column and its row. The field
		// sits inside the cell, so the cell stays a table cell for screen
		// readers, and a click on the cell's padding reaches the field.
		const cell = editor.canvas.getByRole( 'textbox', {
			name: 'Reviews, row 1',
		} );
		await expect(
			editor.canvas.getByRole( 'cell' ).filter( { has: cell } )
		).toHaveCount( 1 );
		const box = await cell.locator( '..' ).boundingBox();
		await editor.canvas
			.getByRole( 'cell' )
			.filter( { has: cell } )
			.click( { position: { x: box.width - 4, y: 4 } } );
		await expect( cell ).toBeFocused();
		await cell.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '0' );

		// A row after this one, then a column after this one.
		await editor.clickBlockToolbarButton( 'Rows and columns' );
		await page
			.getByRole( 'menuitem', { name: 'Insert row after' } )
			.click();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Country, row 2' } )
			.fill( 'Poland' );
		await editor.canvas
			.getByRole( 'textbox', { name: 'Reviews, row 2' } )
			.fill( '427' );
		await editor.clickBlockToolbarButton( 'Rows and columns' );
		await page
			.getByRole( 'menuitem', { name: 'Insert column after' } )
			.click();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Column 3 heading' } )
			.fill( 'Passed' );

		expect( await table( page ) ).toEqual( {
			headings: [ 'Country', 'Reviews', 'Passed' ],
			rows: [
				[ 'Germany', '4700', '' ],
				[ 'Poland', '427', '' ],
			],
		} );

		// And out again: the second row, from one of its cells.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Country, row 2' } )
			.click();
		await editor.clickBlockToolbarButton( 'Rows and columns' );
		await page.getByRole( 'menuitem', { name: 'Delete row' } ).click();
		expect( ( await table( page ) ).rows ).toEqual( [
			[ 'Germany', '4700', '' ],
		] );

		const html = await savedPage( editor, page );
		expect( html ).toContain(
			'<span class="cds--table-header-label">Passed</span>'
		);
		expect( html ).toContain( '>4700</td>' );
	} );

	test( 'semicolon CSV imports from the toolbar, quotes and decimal commas kept', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'Imported table' } );
		await editor.insertBlock( { name: 'awt/data-table' } );

		await editor.clickBlockToolbarButton( 'Import data' );
		const dialog = page.getByRole( 'dialog', { name: 'Import data' } );
		await dialog
			.getByRole( 'textbox', { name: 'Paste the data' } )
			.fill( 'Year;Share;"Note; first"\n2023;1,4;"Peak"\n2024;0,3;' );
		await dialog
			.getByRole( 'button', { name: 'Replace the table' } )
			.click();
		await expect( dialog ).toBeHidden();

		expect( await table( page ) ).toEqual( {
			headings: [ 'Year', 'Share', 'Note; first' ],
			rows: [
				[ '2023', '1,4', 'Peak' ],
				[ '2024', '0,3', '' ],
			],
		} );

		const html = await savedPage( editor, page );
		expect( html ).toContain( '>1,4</td>' );
	} );

	test( 'a paste that is not a table says so and changes nothing', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'Bad paste' } );
		await editor.insertBlock( { name: 'awt/data-table' } );
		const before = await table( page );

		await editor.clickBlockToolbarButton( 'Import data' );
		const dialog = page.getByRole( 'dialog', { name: 'Import data' } );
		await dialog
			.getByRole( 'combobox', { name: 'Format' } )
			.selectOption( 'markdown' );
		await dialog
			.getByRole( 'textbox', { name: 'Paste the data' } )
			.fill( 'just a line' );
		await dialog
			.getByRole( 'button', { name: 'Replace the table' } )
			.click();

		await expect(
			dialog.getByText( 'doesn’t look like a Markdown table' )
		).toBeVisible();
		expect( await table( page ) ).toEqual( before );
	} );

	test( 'a table or list filled from elsewhere shows its note, cannot be typed in, and its links stay in the editor', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'Filled elsewhere' } );
		await page.evaluate( () =>
			window.wp.hooks.addFilter(
				'awt.dataSourceNote',
				'awt-test/filled',
				( note, attributes ) =>
					attributes?.dataSource?.kind === 'test'
						? 'Filled by a test.'
						: note
			)
		);
		await editor.insertBlock( {
			name: 'awt/data-table',
			attributes: {
				dataSource: { kind: 'test' },
				headers: [ { key: 'a', text: 'Name' } ],
				rows: [ { a: 'A row' } ],
			},
		} );
		await editor.insertBlock( {
			name: 'awt/list',
			attributes: { dataSource: { kind: 'test' } },
			innerBlocks: [
				{
					name: 'awt/list-item',
					attributes: {
						content:
							'<a href="https://example.com/">Linked item</a>',
					},
				},
			],
		} );

		const filledTable = editor.canvas.locator( '.wp-block-awt-data-table' );
		await expect(
			filledTable.getByText( 'Filled by a test.' )
		).toBeVisible();
		await expect( filledTable.getByText( 'A row' ) ).toBeVisible();
		await expect(
			filledTable.locator( '[contenteditable="true"]' )
		).toHaveCount( 0 );

		const filledList = editor.canvas.locator( '.wp-block-awt-list' );
		await expect(
			filledList.getByText( 'Filled by a test.' )
		).toBeVisible();
		await expect(
			filledList.locator( '[contenteditable="true"]' )
		).toHaveCount( 0 );

		await filledList.getByRole( 'link', { name: 'Linked item' } ).click();
		await expect(
			page
				.locator( '.components-snackbar' )
				.filter( { hasText: 'Links do not open in the editor.' } )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'link', { name: 'Linked item' } )
		).toBeVisible();
	} );
} );
