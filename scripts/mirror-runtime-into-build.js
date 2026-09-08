#!/usr/bin/env node
/**
 * Mirror runtime files that live outside build/ into build/.
 *
 * The distribution zip (`wp-scripts plugin-zip`) does NOT read .distignore —
 * with no `files` field in package.json it packs the Plugin Handbook list:
 * build/, languages/, the root plugin PHP, readme/changelog/license. Nothing
 * under src/ or assets/ ships. These files are required (or enqueued) at
 * runtime, so without a mirror the shipped plugin fatals on activation.
 *
 * awt-blocks.php and global-controls.php prefer the src/ + assets/ originals
 * when present (working checkout — edits apply without a rebuild) and fall
 * back to these build/ copies in the shipped plugin.
 *
 * Runs as the last step of `npm run build`.
 */

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const ROOT = path.resolve( __dirname, '..' );

// Every shared PHP file, found rather than listed. The list used to be written
// out by hand, and two files added on 2026-09-06 were required by
// awt-blocks.php but never mirrored — the shipped zip fatalled on activation
// while every check passed, because a checkout has src/ and the zip does not.
const SHARED_PHP = fs
	.readdirSync( path.join( __dirname, '..', 'src', 'shared' ) )
	.filter( ( name ) => name.endsWith( '.php' ) )
	.map( ( name ) => [ `src/shared/${ name }`, `build/shared/${ name }` ] );

const COPIES = [
	...SHARED_PHP,
	// Editor-only styles for the IconPicker.
	[ 'src/shared/icon-picker.css', 'build/shared/icon-picker.css' ],
	// Editor UI: Spacing panel + Carbon doc links.
	[
		'assets/global-block-controls.js',
		'build/assets/global-block-controls.js',
	],
];

for ( const [ from, to ] of COPIES ) {
	const src = path.join( ROOT, from );
	const dest = path.join( ROOT, to );
	fs.mkdirSync( path.dirname( dest ), { recursive: true } );
	fs.copyFileSync( src, dest );
}

// Everything awt-blocks.php requires has to be in build/, or the shipped
// plugin dies on activation. Checked here rather than left to whoever notices.
const pluginPhp = fs.readFileSync(
	path.join( ROOT, 'awt-blocks.php' ),
	'utf8'
);
const required = [
	...pluginPhp.matchAll( /require_once \$awt_shared_dir \. '\/([^']+)'/g ),
].map( ( m ) => m[ 1 ] );
const missing = required.filter(
	( name ) => ! fs.existsSync( path.join( ROOT, 'build', 'shared', name ) )
);
if ( missing.length ) {
	console.error(
		`[mirror-runtime] awt-blocks.php requires build/shared/{${ missing.join(
			', '
		) }}, which the build did not produce. The distribution zip would fatal on activation.`
	);
	process.exit( 1 );
}

process.stdout.write(
	`Mirrored ${ COPIES.length } runtime files into build/ for the distribution zip.\n`
);
