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
		// Say what the page actually looked like. Without this the failure is
		// "block missing" and every explanation stays a guess: a page that
		// redirected somewhere else, an editor that never booted, and a block
		// script that threw all produce the same symptom.
		const state = await page
			.evaluate( () => ( {
				url: window.location.href,
				title: document.title,
				hasWp: typeof window.wp !== 'undefined',
				hasBlocksApi: !! window.wp?.blocks?.getBlockTypes,
				registered: window.wp?.blocks?.getBlockTypes?.().length ?? null,
				awtRegistered:
					window.wp?.blocks
						?.getBlockTypes?.()
						.filter( ( b ) => b.name.startsWith( 'awt/' ) )
						.length ?? null,
				editorMounted: !! document.querySelector(
					'.block-editor, .edit-post-visual-editor, #editor'
				),
				bodyClass: document.body?.className?.slice( 0, 200 ),
			} ) )
			.catch( ( error ) => ( { evaluateFailed: String( error ) } ) );

		throw new Error(
			`Block type "${ name }" was never registered in the editor within 15s. ` +
				`Inserting it would recurse forever inside createBlock(), so the ` +
				`wait failed instead.\nPage state: ${ JSON.stringify(
					state,
					null,
					2
				) }`
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
