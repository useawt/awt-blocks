#!/usr/bin/env node
/**
 * Hoist the CSS the blocks repeat into shared stylesheets.
 *
 * Runs after webpack, as part of `npm run build`.
 *
 * Why this exists. Every block's style.scss `@use`s the Carbon partials it
 * needs, and Sass emits each partial's dependencies along with it. Carbon's
 * button is a dependency of nine other components, so eleven blocks shipped
 * the same 66 KB of button CSS — `button`, `inline-set`, `modal-opener` and
 * `pricing-tile` emitted byte-identical files. Measured on useawt.com in
 * September 2026: 66 KB of the home page's 157 KB of block CSS was a literal
 * duplicate, and 202 KB of /features/'s 322 KB. Across all 31 stylesheets,
 * 72% of the text was repeated.
 *
 * What makes it safe to move. Sass emits modules in dependency order, so a
 * shared dependency comes out FIRST and identically in every stylesheet that
 * has it — the button stylesheet is a literal prefix of the other ten. This
 * script only ever lifts a common *prefix*, never a rule from the middle, and
 * the lifted file is loaded before the stylesheet it came from. Every rule
 * therefore keeps its position relative to every other rule, which is what the
 * cascade resolves ties by. A rule moved out of order would be a silent
 * restyling; a prefix cannot be.
 *
 * It re-derives the split from the actual output on every build, so a Carbon
 * upgrade that changes the dependency graph is followed rather than guessed —
 * and the assertion at the end proves, per block, that layers + remainder
 * still reassemble byte for byte into what webpack emitted.
 *
 * The shared files are NOT given a `path`, so they stay separate requests
 * rather than being inlined into every page by the theme's inline budget.
 * Shared CSS is exactly the CSS worth caching across pages.
 */

'use strict';

const crypto = require( 'node:crypto' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const ROOT = path.resolve( __dirname, '..' );
const BUILD = path.join( ROOT, 'build' );
const SHARED_DIR = path.join( BUILD, 'shared-css' );

/**
 * How much has to have accumulated before it is worth its own request.
 *
 * Splitting costs a round trip, so a 200-byte shared prefix is a loss. Such a
 * prefix is not skipped, though — skipping it and lifting something deeper
 * would put the two in the wrong order. It is carried down instead and written
 * at the head of whichever layer is eventually worth writing.
 */
const MIN_LAYER_BYTES = 2048;

/**
 * Split a minified stylesheet into its top-level rules.
 *
 * Brace counting, not a parser: the input is Sass's own compressed output, so
 * strings and comments that could carry an unbalanced brace are not in it.
 *
 * @param {string} css Stylesheet text.
 * @return {string[]} Rules, in source order, which rejoin to the input.
 */
function splitRules( css ) {
	const out = [];
	let depth = 0;
	let buf = '';
	for ( const ch of css ) {
		buf += ch;
		if ( ch === '{' ) {
			depth++;
		} else if ( ch === '}' ) {
			depth--;
			if ( depth === 0 ) {
				out.push( buf );
				buf = '';
			}
		}
	}
	if ( buf.trim() ) {
		out.push( buf );
	}
	return out;
}

/**
 * How many leading rules every one of these sequences shares.
 *
 * @param {string[][]} lists Rule sequences.
 * @return {number} Length of the common prefix.
 */
function commonPrefix( lists ) {
	const limit = Math.min( ...lists.map( ( l ) => l.length ) );
	let i = 0;
	while ( i < limit && lists.every( ( l ) => l[ i ] === lists[ 0 ][ i ] ) ) {
		i++;
	}
	return i;
}

// --- Read what webpack emitted ----------------------------------------------

const blocks = fs
	.readdirSync( BUILD, { withFileTypes: true } )
	.filter( ( e ) => e.isDirectory() )
	.map( ( e ) => e.name )
	.filter( ( name ) =>
		fs.existsSync( path.join( BUILD, name, 'style-index.css' ) )
	)
	.sort();

const sheets = new Map();
for ( const name of blocks ) {
	const file = path.join( BUILD, name, 'style-index.css' );
	const rtlFile = path.join( BUILD, name, 'style-index-rtl.css' );
	const ltr = splitRules( fs.readFileSync( file, 'utf8' ) );
	const rtl = fs.existsSync( rtlFile )
		? splitRules( fs.readFileSync( rtlFile, 'utf8' ) )
		: null;
	if ( rtl && rtl.length !== ltr.length ) {
		console.error(
			`✗ ${ name }: the right-to-left stylesheet has ${ rtl.length } rules against ${ ltr.length }. ` +
				'The split works by rule position, so the two have to line up.'
		);
		process.exit( 1 );
	}
	sheets.set( name, { ltr, rtl } );
}

// --- Work out the shared prefixes -------------------------------------------

/** @type {Map<string, {ltr: string[], rtl: string[]|null}>} */
const layers = new Map();
/** @type {Map<string, {chain: string[], from: number}>} */
const chains = new Map();

/**
 * Lift the CSS this group of blocks shares into layer files, outermost first.
 *
 * `at` is the first rule not yet written to a layer and `pos` is how far the
 * comparison has got. They differ while a shared prefix too small to be worth
 * a request is being carried along: it stays in the running layer rather than
 * being skipped, because a skipped prefix would end up after rules it used to
 * precede.
 *
 * @param {Array<{name: string, at: number, pos: number}>} members Blocks, and
 *                                                                 where each
 *                                                                 stands.
 * @param {string[]}                                       chain   Layer ids
 *                                                                 assigned so
 *                                                                 far.
 */
function lift( members, chain ) {
	if ( members.length < 2 ) {
		for ( const m of members ) {
			chains.set( m.name, { chain, from: m.at } );
		}
		return;
	}

	const shared = commonPrefix(
		members.map( ( m ) => sheets.get( m.name ).ltr.slice( m.pos ) )
	);
	const first = members[ 0 ];
	const end = first.pos + shared;
	const candidate = sheets.get( first.name ).ltr.slice( first.at, end );

	if ( candidate.join( '' ).length >= MIN_LAYER_BYTES ) {
		const id = crypto
			.createHash( 'sha1' )
			.update( candidate.join( '' ) )
			.digest( 'hex' )
			.slice( 0, 12 );
		if ( ! layers.has( id ) ) {
			const rtlSheet = sheets.get( first.name ).rtl;
			layers.set( id, {
				ltr: candidate,
				rtl: rtlSheet ? rtlSheet.slice( first.at, end ) : null,
			} );
		}
		chain = [ ...chain, id ];
		members = members.map( ( m ) => ( {
			name: m.name,
			at: end,
			pos: end,
		} ) );
	} else {
		members = members.map( ( m ) => ( {
			name: m.name,
			at: m.at,
			pos: end,
		} ) );
	}

	// Split what is left by the next rule and recurse into each group.
	const buckets = new Map();
	for ( const m of members ) {
		const next = sheets.get( m.name ).ltr[ m.pos ];
		if ( next === undefined ) {
			chains.set( m.name, { chain, from: m.at } );
			continue;
		}
		if ( ! buckets.has( next ) ) {
			buckets.set( next, [] );
		}
		buckets.get( next ).push( m );
	}
	for ( const group of buckets.values() ) {
		lift( group, chain );
	}
}

lift(
	blocks.map( ( name ) => ( { name, at: 0, pos: 0 } ) ),
	[]
);

// --- Write, and prove it reassembles ----------------------------------------

fs.rmSync( SHARED_DIR, { recursive: true, force: true } );
fs.mkdirSync( SHARED_DIR, { recursive: true } );

for ( const [ id, layer ] of layers ) {
	fs.writeFileSync(
		path.join( SHARED_DIR, `carbon-${ id }.css` ),
		layer.ltr.join( '' )
	);
	if ( layer.rtl ) {
		fs.writeFileSync(
			path.join( SHARED_DIR, `carbon-${ id }-rtl.css` ),
			layer.rtl.join( '' )
		);
	}
}

let before = 0;
let after = 0;
const manifest = {};

for ( const name of blocks ) {
	const sheet = sheets.get( name );
	const { chain, from: lifted } = chains.get( name ) ?? {
		chain: [],
		from: 0,
	};

	// The whole point, checked rather than trusted.
	const rebuilt =
		chain.map( ( id ) => layers.get( id ).ltr.join( '' ) ).join( '' ) +
		sheet.ltr.slice( lifted ).join( '' );
	if ( rebuilt !== sheet.ltr.join( '' ) ) {
		console.error(
			`✗ ${ name }: the shared files plus what is left do not reassemble into the stylesheet webpack emitted.`
		);
		process.exit( 1 );
	}

	before += sheet.ltr.join( '' ).length;

	const writeRemainder = ( rules, file ) => {
		if ( rules.length ) {
			fs.writeFileSync( file, rules.join( '' ) );
		} else if ( fs.existsSync( file ) ) {
			fs.rmSync( file );
		}
	};
	const remainder = sheet.ltr.slice( lifted );
	writeRemainder( remainder, path.join( BUILD, name, 'style-index.css' ) );
	if ( sheet.rtl ) {
		writeRemainder(
			sheet.rtl.slice( lifted ),
			path.join( BUILD, name, 'style-index-rtl.css' )
		);
	}
	after += remainder.join( '' ).length;

	// Tell WordPress to load the shared files before the block's own, by
	// listing them ahead of it. Core takes a plain string in this array as an
	// already-registered handle (blocks.php, register_block_style_handle).
	const metaFile = path.join( BUILD, name, 'block.json' );
	const meta = JSON.parse( fs.readFileSync( metaFile, 'utf8' ) );
	const handles = chain.map( ( id ) => `awt-carbon-${ id }` );
	if ( handles.length ) {
		meta.style = remainder.length
			? [ ...handles, 'file:./style-index.css' ]
			: handles;
		fs.writeFileSync( metaFile, JSON.stringify( meta, null, '\t' ) + '\n' );
	}
	manifest[ name ] = handles;
}

const sharedBytes = [ ...layers.values() ].reduce(
	( n, l ) => n + l.ltr.join( '' ).length,
	0
);

fs.writeFileSync(
	path.join( SHARED_DIR, 'manifest.php' ),
	'<?php\n' +
		'// Generated by scripts/split-shared-css.js. Do not edit.\n' +
		'return ' +
		JSON.stringify(
			[ ...layers.keys() ].map( ( id ) => `carbon-${ id }` ),
			null,
			'\t'
		)
			.replace( /\[/g, 'array(' )
			.replace( /\]/g, ')' )
			.replace( /"/g, "'" ) +
		';\n'
);

process.stdout.write(
	`Shared CSS: ${ layers.size } file(s), ${ sharedBytes } B, lifted out of ${ blocks.length } block stylesheets — ` +
		`${ before } B → ${ sharedBytes + after } B (${ Math.round(
			( 100 * ( before - sharedBytes - after ) ) / before
		) }% less).\n`
);
