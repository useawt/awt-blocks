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

const COPIES = [
	// Shared runtime PHP, hard-required by awt-blocks.php.
	[ 'src/shared/render-helpers.php', 'build/shared/render-helpers.php' ],
	[ 'src/shared/current-url.php', 'build/shared/current-url.php' ],
	[ 'src/shared/faq-schema.php', 'build/shared/faq-schema.php' ],
	[ 'src/shared/global-controls.php', 'build/shared/global-controls.php' ],
	[ 'src/shared/template-chrome.php', 'build/shared/template-chrome.php' ],
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

process.stdout.write(
	`Mirrored ${ COPIES.length } runtime files into build/ for the distribution zip.\n`
);
