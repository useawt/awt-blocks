/**
 * Comma-separated text is the second plain-text source the List block offers.
 *
 * The cases that matter are the ones a pasted spreadsheet cell or a hand-typed
 * line actually contains: spaces around the commas, a trailing comma, and line
 * breaks mixed in with them.
 */

const { splitCommaSeparated } = require( './import-format' );

describe( 'splitCommaSeparated', () => {
	it( 'starts a new value at every comma', () => {
		expect( splitCommaSeparated( 'Apples,Pears,Plums' ) ).toEqual( [
			'Apples',
			'Pears',
			'Plums',
		] );
	} );

	it( 'trims the space authors type after a comma', () => {
		expect( splitCommaSeparated( 'Apples, Pears ,  Plums' ) ).toEqual( [
			'Apples',
			'Pears',
			'Plums',
		] );
	} );

	it( 'drops empty values, so a trailing comma adds no item', () => {
		expect( splitCommaSeparated( 'Apples, Pears,' ) ).toEqual( [
			'Apples',
			'Pears',
		] );
		expect( splitCommaSeparated( 'Apples,,Pears' ) ).toEqual( [
			'Apples',
			'Pears',
		] );
	} );

	it( 'splits on line breaks too, so no item carries one', () => {
		expect( splitCommaSeparated( 'Apples, Pears\r\nPlums, Figs' ) ).toEqual(
			[ 'Apples', 'Pears', 'Plums', 'Figs' ]
		);
	} );

	it( 'returns nothing for empty or missing input', () => {
		expect( splitCommaSeparated( '' ) ).toEqual( [] );
		expect( splitCommaSeparated( '   ' ) ).toEqual( [] );
		expect( splitCommaSeparated( undefined ) ).toEqual( [] );
	} );

	it( 'keeps a value that has no comma in it as one item', () => {
		expect( splitCommaSeparated( 'Apples and pears' ) ).toEqual( [
			'Apples and pears',
		] );
	} );
} );
