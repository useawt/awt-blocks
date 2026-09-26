/**
 * The List block's "Text (comma separated values)" data source.
 *
 * The parsing itself is unit-tested (src/shared/import-format.test.js); what
 * this covers is the wiring an author actually touches — the option is in the
 * picker, the paste field explains what the commas will do, and the Generate
 * button turns one pasted line into one list item per value.
 */

const { test, expect } = require( './fixtures' );

async function openDataPanel( page, editor ) {
	await editor.openDocumentSettingsSidebar();
	const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
	const dataPanel = sidebar.getByRole( 'button', { name: 'Data' } );
	if ( ( await dataPanel.getAttribute( 'aria-expanded' ) ) === 'false' ) {
		await dataPanel.click();
	}
	return sidebar;
}

test.describe( 'List: comma separated values', () => {
	test( 'one pasted line becomes one item per comma', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'List commas' } );
		await editor.insertBlock( { name: 'awt/list' } );

		const sidebar = await openDataPanel( page, editor );
		const source = sidebar.getByRole( 'combobox', { name: 'Data source' } );
		await source.selectOption( 'csv' );

		// The help text under the field has to describe the chosen source.
		await expect(
			sidebar.getByText(
				'Each comma or line break starts a new list item.',
				{
					exact: false,
				}
			)
		).toBeVisible();

		await sidebar
			.getByRole( 'textbox', { name: 'Paste content' } )
			.fill( 'Apples, Pears,  Plums,' );
		await sidebar
			.getByRole( 'button', { name: 'Generate list items' } )
			.click();

		const [ list ] = await editor.getBlocks();
		expect( list.name ).toBe( 'awt/list' );
		expect( list.innerBlocks.map( ( b ) => b.attributes.content ) ).toEqual(
			[ 'Apples', 'Pears', 'Plums' ]
		);
	} );

	test( 'the line-per-item source still splits on lines only', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'List lines' } );
		await editor.insertBlock( { name: 'awt/list' } );

		const sidebar = await openDataPanel( page, editor );
		await sidebar
			.getByRole( 'combobox', { name: 'Data source' } )
			.selectOption( 'text' );
		await sidebar
			.getByRole( 'textbox', { name: 'Paste content' } )
			.fill( 'Apples, Pears\nPlums' );
		await sidebar
			.getByRole( 'button', { name: 'Generate list items' } )
			.click();

		const [ list ] = await editor.getBlocks();
		expect( list.innerBlocks.map( ( b ) => b.attributes.content ) ).toEqual(
			[ 'Apples, Pears', 'Plums' ]
		);
	} );
} );
