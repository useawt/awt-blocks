/**
 * A Select or Dropdown's options box keeps what is typed, where it is typed.
 *
 * The box was rebuilt from the saved options on every keystroke, and saving
 * drops spaces at the end of a label and empty lines. So typing "First
 * choice" over "Option 1" lost the space after "First", the box was
 * rewritten, the cursor went to the end of the field, and "choice" landed
 * there; Enter at the end of the last line did nothing (found 2026-10-12).
 */

const { test, expect } = require( './fixtures' );

for ( const name of [ 'awt/select', 'awt/dropdown' ] ) {
	test( `${ name }: typing in the options box stays at the cursor`, async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name, attributes: { label: 'Pick' } } );
		const box = page.getByLabel( 'Options (one per line: value|label)' );
		const saved = () =>
			page.evaluate( ( blockName ) => {
				const store = window.wp.data.select( 'core/block-editor' );
				const [ id ] = store.getBlocksByName( blockName );
				return store
					.getBlockAttributes( id )
					.options.map( ( o ) => `${ o.value }|${ o.label }` );
			}, name );

		// Select "Option 1" and type over it.
		await box.click();
		await box.evaluate( ( el ) => {
			const from = el.value.indexOf( 'Option 1' );
			el.setSelectionRange( from, from + 'Option 1'.length );
		} );
		await page.keyboard.type( 'First choice' );
		await expect( box ).toHaveValue(
			'option-1|First choice\noption-2|Option 2\noption-3|Option 3'
		);

		// A new line at the end, and a fourth option on it.
		await box.evaluate( ( el ) =>
			el.setSelectionRange( el.value.length, el.value.length )
		);
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'four|Four' );
		await expect( box ).toHaveValue(
			'option-1|First choice\noption-2|Option 2\noption-3|Option 3\nfour|Four'
		);
		expect( await saved() ).toEqual( [
			'option-1|First choice',
			'option-2|Option 2',
			'option-3|Option 3',
			'four|Four',
		] );
	} );
}
