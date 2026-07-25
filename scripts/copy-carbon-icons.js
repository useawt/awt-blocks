#!/usr/bin/env node
/**
 * Copy the Carbon icon SVGs into build/shared/carbon-icons/.
 *
 * The server-side icon renderer (shared/render-helpers.php) reads Carbon
 * SVGs from disk. Development installs read them from node_modules, but an
 * installed copy of the plugin (deploy, distribution zip) ships without
 * node_modules — so the build bundles the SVGs the plugin can actually
 * offer: every icon in build/shared/icon-manifest.json, at every size
 * Carbon publishes for it (~1.2 MB total; the manifest already excludes
 * the namespaced sets that would 10× that).
 *
 * Runs as part of `npm run build:icons` AFTER generate-icon-manifest.js
 * (it reads the manifest that script writes).
 */

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const ROOT = path.resolve( __dirname, '..' );
const SVG_BASE = path.join( ROOT, 'node_modules', '@carbon', 'icons', 'svg' );
const MANIFEST = path.join( ROOT, 'build', 'shared', 'icon-manifest.json' );
const OUT_BASE = path.join( ROOT, 'build', 'shared', 'carbon-icons' );
const SIZES = [ 16, 20, 24, 32 ];

if ( ! fs.existsSync( SVG_BASE ) ) {
	console.error(
		`[copy-carbon-icons] @carbon/icons not installed at ${ SVG_BASE }`
	);
	process.exit( 1 );
}
if ( ! fs.existsSync( MANIFEST ) ) {
	console.error(
		`[copy-carbon-icons] manifest missing at ${ MANIFEST } — run generate-icon-manifest.js first`
	);
	process.exit( 1 );
}

const names = Object.keys(
	JSON.parse( fs.readFileSync( MANIFEST, 'utf8' ) ).iconsByName
);

// Rebuild from scratch so renamed/removed icons don't linger.
fs.rmSync( OUT_BASE, { recursive: true, force: true } );

let copied = 0;
const missing = [];
for ( const name of names ) {
	let found = false;
	for ( const size of SIZES ) {
		const src = path.join( SVG_BASE, String( size ), `${ name }.svg` );
		if ( ! fs.existsSync( src ) ) {
			continue;
		}
		const destDir = path.join( OUT_BASE, String( size ) );
		fs.mkdirSync( destDir, { recursive: true } );
		fs.copyFileSync( src, path.join( destDir, `${ name }.svg` ) );
		copied++;
		found = true;
	}
	// A few icons ship size-independent, directly in the svg root
	// (caution, circle-fill, …) — the renderer checks there too.
	if ( ! found ) {
		const src = path.join( SVG_BASE, `${ name }.svg` );
		if ( fs.existsSync( src ) ) {
			fs.mkdirSync( OUT_BASE, { recursive: true } );
			fs.copyFileSync( src, path.join( OUT_BASE, `${ name }.svg` ) );
			copied++;
			found = true;
		}
	}
	if ( ! found ) {
		missing.push( name );
	}
}

console.log(
	`[copy-carbon-icons] ${ copied } SVGs → build/shared/carbon-icons (${ names.length } manifest icons)`
);
if ( missing.length ) {
	console.warn(
		`[copy-carbon-icons] ${
			missing.length
		} manifest icon(s) have no SVG at any size: ${ missing.join( ', ' ) }`
	);
}
