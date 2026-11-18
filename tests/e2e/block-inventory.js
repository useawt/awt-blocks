/**
 * The AWT blocks a test can insert into a post, read from build/ so a new block
 * is covered automatically. Shared by the editor smoke test and the text
 * selection test.
 */

const fs = require( 'fs' );
const path = require( 'path' );

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

module.exports = { insertableBlockNames, templateOnlyBlockNames };
