/**
 * Editor smoke test: every AWT block can be inserted into a fresh post
 * without crashing (no block error boundary, no console errors).
 *
 * Block inventory comes from the block.json files in build/ — the same set
 * the plugin registers — so a new block is covered automatically.
 */

const { test, expect } = require( './fixtures' );
const { insertableBlockNames } = require( './block-inventory' );

test.describe( 'AWT blocks insert cleanly in the editor', () => {
	test( 'every top-level block inserts without an error boundary', async ( {
		admin,
		editor,
		page,
	} ) => {
		const names = insertableBlockNames();
		expect( names.length ).toBeGreaterThan( 30 );

		const consoleErrors = [];
		page.on( 'console', ( msg ) => {
			if ( msg.type() === 'error' ) {
				consoleErrors.push( msg.text() );
			}
		} );

		await admin.createNewPost( { title: 'Block smoke' } );

		for ( const name of names ) {
			await editor.insertBlock( { name } );
		}

		// No block crashed into an error boundary.
		const canvas = editor.canvas;
		await expect( canvas.locator( '.block-editor-warning' ) ).toHaveCount(
			0
		);

		// Every inserted block is present in the block list.
		const inserted = await editor.getBlocks();
		expect( inserted.length ).toBe( names.length );

		// React error boundaries and crashed stores land in the console.
		const fatal = consoleErrors.filter(
			( t ) =>
				! t.includes( 'Failed to load resource' ) && // 404s for optional assets aren't block crashes.
				! t.includes( 'preloading' )
		);
		expect( fatal ).toEqual( [] );
	} );
} );
