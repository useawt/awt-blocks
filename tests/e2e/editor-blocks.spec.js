/**
 * Editor smoke test: every AWT block can be inserted into a fresh post
 * without crashing (no block error boundary, no console errors).
 *
 * Block inventory comes from the block.json files in build/ — the same set
 * the plugin registers — so a new block is covered automatically.
 */

const fs = require( 'fs' );
const path = require( 'path' );
const { test, expect } = require( './fixtures' );

/**
 * Blocks the plugin deliberately removes from the inserter while a specific
 * content post is being edited — which is exactly what this test does.
 *
 * Read straight out of `shared/template-chrome.php` rather than hardcoded, so
 * the test cannot drift from the runtime gate: adding a block to that list
 * silently stops it being insertable in a post, and a test that still expected
 * it would fail with nothing more informative than an off-by-one block count.
 *
 * @return {string[]} Block names excluded from the post-content inserter.
 */
function templateOnlyBlockNames() {
	const src = fs.readFileSync(
		path.resolve( __dirname, '../../src/shared/template-chrome.php' ),
		'utf8'
	);
	const list = src.match(
		/const\s+TEMPLATE_ONLY_BLOCKS\s*=\s*array\(([^)]*)\)/
	);
	if ( ! list ) {
		throw new Error(
			'Could not read TEMPLATE_ONLY_BLOCKS from shared/template-chrome.php'
		);
	}
	return [ ...list[ 1 ].matchAll( /'([^']+)'/g ) ].map( ( m ) => m[ 1 ] );
}

/**
 * Top-level insertable AWT blocks: skip child blocks that require a specific
 * parent (accordion-item inside accordion, tab inside tabs, …) — those render
 * via their parents' innerBlocks templates, which ARE inserted here — and skip
 * template-only chrome, which the plugin bars from the post-content inserter.
 *
 * @return {string[]} Block names.
 */
function insertableBlockNames() {
	const buildDir = path.resolve( __dirname, '../../build' );
	const templateOnly = templateOnlyBlockNames();
	return fs
		.readdirSync( buildDir )
		.map( ( dir ) => path.join( buildDir, dir, 'block.json' ) )
		.filter( ( p ) => fs.existsSync( p ) )
		.map( ( p ) => JSON.parse( fs.readFileSync( p, 'utf8' ) ) )
		.filter( ( meta ) => ! meta.parent || meta.parent.length === 0 )
		.map( ( meta ) => meta.name )
		.filter( ( name ) => ! templateOnly.includes( name ) )
		.sort();
}

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
