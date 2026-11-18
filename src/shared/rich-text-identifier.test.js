/**
 * Every text box in an AWT block tells the editor which text it is.
 *
 * A RichText with no `identifier` holds the cursor without the editor knowing
 * it: the editor takes the whole block as selected, and Shift with any arrow
 * key then selects this block and the next one instead of a character, a word
 * or a line. Every AWT block with a text field but List item had it until
 * 2026-11-18, found by the owner while typing a Data table.
 *
 * WordPress's own blocks name the attribute the text is stored in
 * (`identifier="content"`); a block with one text per row or cell names the
 * place within the attribute (`rows.0.name`), as the core Table block does.
 */

const fs = require( 'fs' );
const path = require( 'path' );

const SRC = path.resolve( __dirname, '..' );

/**
 * The source of each RichText element in a file, from its opening `<RichText`
 * to the end of its props. `RichText.Content` only prints saved text and is
 * left out.
 *
 * @param {string} source A file's text.
 * @return {string[]} One string per RichText.
 */
function richTextElements( source ) {
	const found = [];
	const opening = /<RichText(?=[\s>])/g;
	let match;
	while ( ( match = opening.exec( source ) ) ) {
		let depth = 0;
		let end = match.index;
		for ( let i = match.index; i < source.length; i++ ) {
			const char = source[ i ];
			if ( char === '{' ) {
				depth++;
			} else if ( char === '}' ) {
				depth--;
			} else if ( char === '>' && depth === 0 ) {
				end = i;
				break;
			}
		}
		found.push( source.slice( match.index, end + 1 ) );
	}
	return found;
}

/**
 * Every JavaScript file under src/, tests left out.
 *
 * @param {string} dir Folder to read.
 * @return {string[]} Paths.
 */
function sourceFiles( dir ) {
	return fs
		.readdirSync( dir, { withFileTypes: true } )
		.flatMap( ( entry ) => {
			const full = path.join( dir, entry.name );
			if ( entry.isDirectory() ) {
				return sourceFiles( full );
			}
			return entry.name.endsWith( '.js' ) &&
				! entry.name.endsWith( '.test.js' )
				? [ full ]
				: [];
		} );
}

describe( 'AWT text boxes', () => {
	const elements = sourceFiles( SRC ).flatMap( ( file ) =>
		richTextElements( fs.readFileSync( file, 'utf8' ) ).map(
			( element ) => ( {
				file: path.relative( SRC, file ),
				element,
			} )
		)
	);

	it( 'are found', () => {
		expect( elements.length ).toBeGreaterThan( 40 );
	} );

	it( 'each carry an identifier', () => {
		const missing = elements
			.filter( ( { element } ) => ! /\sidentifier=/.test( element ) )
			.map( ( { file } ) => file );
		expect( missing ).toEqual( [] );
	} );
} );
