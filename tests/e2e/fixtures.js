/**
 * Shared Playwright fixtures: WordPress admin/editor/request utilities from
 * the wordpress/e2e-test-utils-playwright package, wired to the wp-env
 * tests site.
 *
 * `editor.insertBlock` is wrapped so it waits for the block type to exist
 * before inserting. See the comment on waitForBlockType() — without that wait,
 * inserting too early does not fail cleanly, it overflows the stack.
 */

const {
	test: base,
	expect,
} = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Wait until a block type is registered in the editor page.
 *
 * `createBlock( name )` falls back to `createBlock( 'core/missing' )` for an
 * unknown name — and `core/missing` is itself registered by editor scripts, so
 * during the load window neither exists and the fallback calls itself forever:
 * "RangeError: Maximum call stack size exceeded", raised from WordPress code
 * with nothing in the message about the real cause. Inserting a block straight
 * after `createNewPost()` is therefore a race, not a safe default.
 *
 * It surfaced on 2026-08-01 as a one-in-N failure of the WooCommerce
 * compatibility spec, where the window is widest — WooCommerce loads a lot of
 * editor JS ahead of ours — but the same race sat unnoticed in the block smoke
 * test, which is a required check.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          name Block name, e.g. `awt/button`.
 */
async function waitForBlockType( page, name ) {
	try {
		await page.waitForFunction(
			( blockName ) => !! window.wp?.blocks?.getBlockType( blockName ),
			name,
			{ timeout: 15_000 }
		);
	} catch {
		throw new Error(
			`Block type "${ name }" was never registered in the editor. ` +
				`Inserting it would recurse forever inside createBlock(), so the ` +
				`wait failed instead. Either the editor never finished loading, or ` +
				`the block really is not registered — check the plugin build and ` +
				`the browser console.`
		);
	}
}

const test = base.extend( {
	// Wrapped at the fixture rather than at each call site: a new spec gets the
	// guarantee without having to know this race exists, which is exactly how
	// it went unnoticed the first time.
	editor: async ( { editor, page }, use ) => {
		const insertBlock = editor.insertBlock.bind( editor );
		editor.insertBlock = async ( block, options ) => {
			await waitForBlockType( page, block.name );
			return insertBlock( block, options );
		};
		await use( editor );
	},
} );

module.exports = { test, expect };
