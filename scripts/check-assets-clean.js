#!/usr/bin/env node
/**
 * Gate: nothing the browser downloads carries a comment.
 *
 *   npm run check:assets
 *
 * The sibling theme had 166 KB of notes about Carbon's cascade inside the
 * stylesheet it served, so they were on every AWT site and in every visitor's
 * View Source. The plugin's exposure was smaller — two editor files that were
 * copied into build/ rather than compiled — and the rule is the same either
 * way: comments are for whoever maintains this, and build/ is for the browser.
 *
 * Everything webpack emits is already stripped. This exists for the files that
 * reach build/ by another route, which is exactly where the two came from.
 *
 * It does not parse CSS or JavaScript: a `/*` inside a string is reported, and
 * a false positive costs a minute where a parser that is wrong the other way
 * costs the guarantee.
 */

'use strict';

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const ROOT = path.resolve( __dirname, '..' );
const DIR = path.join( ROOT, 'build' );
const EXTENSIONS = [ '.css', '.js', '.mjs' ];

/**
 * Every file under a directory, depth first.
 *
 * @param {string} dir Absolute path to walk.
 * @return {string[]} Absolute file paths.
 */
function walk( dir ) {
	const out = [];
	for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {
		const full = path.join( dir, entry.name );
		if ( entry.isDirectory() ) {
			out.push( ...walk( full ) );
		} else {
			out.push( full );
		}
	}
	return out;
}

/**
 * Where a comment starts in this text.
 *
 * Block openers count anywhere. Line comments count only at the start of a
 * line, because `//` is also every URL's authority separator and compiled
 * output is one long line — a leading `//` is the tell of a file that was
 * never compressed.
 *
 * @param {string} text File contents.
 * @return {number} 1-indexed line number, or -1 when the file is clean.
 */
function firstComment( text ) {
	const block = text.indexOf( '/*' );
	if ( block !== -1 ) {
		return text.slice( 0, block ).split( '\n' ).length;
	}
	const line = text.split( '\n' ).findIndex( ( l ) => /^\s*\/\//.test( l ) );
	return line === -1 ? -1 : line + 1;
}

if ( ! fs.existsSync( DIR ) ) {
	console.error( '✗ build/ does not exist — run npm run build first.' );
	process.exit( 1 );
}

const files = walk( DIR ).filter( ( f ) =>
	EXTENSIONS.includes( path.extname( f ) )
);
const offenders = [];

for ( const file of files ) {
	const line = firstComment( fs.readFileSync( file, 'utf8' ) );
	if ( line !== -1 ) {
		offenders.push( `${ path.relative( ROOT, file ) }:${ line }` );
	}
}

if ( offenders.length ) {
	console.error(
		`✗ ${ offenders.length } served file(s) carry a comment. Author them outside ` +
			`build/ and let npm run build compile them in:\n  ` +
			offenders.join( '\n  ' )
	);
	process.exit( 1 );
}

console.log(
	`✓ ${ files.length } served stylesheet(s)/script(s) carry no comments.`
);
