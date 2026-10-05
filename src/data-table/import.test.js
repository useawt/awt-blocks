/**
 * Pasting data into a Data table.
 *
 * The cases are the ones real pastes contain: a spreadsheet copy (tabs), CSV
 * from a European locale (semicolons, because the comma is the decimal mark),
 * quoted values holding the separator or a line break, ragged rows, and text
 * that must stay text rather than become markup.
 */

const {
	detectDelimiter,
	parseDelimited,
	parseText,
	parseHtmlTable,
	parseMarkdownTable,
} = require( './import' );

const cells = ( table ) =>
	table.rows.map( ( r ) => table.headers.map( ( h ) => r[ h.key ] ) );

describe( 'detectDelimiter', () => {
	it( 'takes a tab when there is one: what a spreadsheet copies', () => {
		expect( detectDelimiter( 'Country\tScore, %' ) ).toBe( '\t' );
	} );

	it( 'takes semicolons over commas', () => {
		expect( detectDelimiter( 'Country;Score;Share' ) ).toBe( ';' );
	} );

	it( 'ignores separators inside quotes', () => {
		expect( detectDelimiter( '"Score; final",Country' ) ).toBe( ',' );
	} );

	it( 'reads the whole header row, even when a heading has a line break', () => {
		expect( detectDelimiter( '"Name\n(full)"\tAge\nAnna\t30' ) ).toBe(
			'\t'
		);
	} );

	it( 'finds no separator in a one-column header', () => {
		expect( detectDelimiter( 'Comment\nHello, world' ) ).toBe( '' );
	} );
} );

describe( 'parseDelimited', () => {
	it( 'makes the first row the header and the rest the rows', () => {
		const t = parseDelimited( 'Country,Reviews\nGermany,470\nPoland,427' );
		expect( t.headers.map( ( h ) => h.text ) ).toEqual( [
			'Country',
			'Reviews',
		] );
		expect( cells( t ) ).toEqual( [
			[ 'Germany', '470' ],
			[ 'Poland', '427' ],
		] );
	} );

	it( 'keeps the separator, a line break and a doubled quote inside quotes', () => {
		const t = parseDelimited(
			'Name,Note\n"Smith, J.","Said ""yes""\nthen left"'
		);
		expect( cells( t ) ).toEqual( [
			[ 'Smith, J.', 'Said "yes"<br>then left' ],
		] );
	} );

	it( 'reads semicolon CSV with decimal commas', () => {
		const t = parseDelimited( 'Year;Share\n2023;1,4\n2024;0,3' );
		expect( cells( t ) ).toEqual( [
			[ '2023', '1,4' ],
			[ '2024', '0,3' ],
		] );
	} );

	it( 'reads a spreadsheet copy and drops blank lines', () => {
		const t = parseDelimited( 'A\tB\r\n1\t2\r\n\r\n3\t4\r\n' );
		expect( cells( t ) ).toEqual( [
			[ '1', '2' ],
			[ '3', '4' ],
		] );
	} );

	it( 'fills a short row with empty cells, and keeps a long one whole', () => {
		const t = parseDelimited( 'A,B,C\n1\n1,2,3,4' );
		expect( cells( t ) ).toEqual( [
			[ '1', '', '', '' ],
			[ '1', '2', '3', '4' ],
		] );
	} );

	it( 'keeps markup as text', () => {
		const t = parseDelimited( 'A\n<b>bold</b> & <script>x</script>' );
		expect( cells( t ) ).toEqual( [
			[ '&lt;b&gt;bold&lt;/b&gt; &amp; &lt;script&gt;x&lt;/script&gt;' ],
		] );
	} );

	it( 'gives every column its own key', () => {
		const t = parseDelimited( 'Score,Score,\n1,2,3' );
		expect( t.headers.map( ( h ) => h.key ) ).toEqual( [
			'score',
			'score-2',
			'col3',
		] );
	} );

	it( 'returns nothing for empty text', () => {
		expect( parseDelimited( '  \n ' ) ).toBeNull();
	} );

	it( 'keeps a one-column paste whole, commas and all', () => {
		const t = parseDelimited( 'Comment\nHello, world' );
		expect( cells( t ) ).toEqual( [ [ 'Hello, world' ] ] );
	} );

	it( 'gives a longer row new columns instead of dropping its values', () => {
		const t = parseDelimited( 'Name,City\nSmith, John,Berlin' );
		expect( t.headers.map( ( h ) => h.text ) ).toEqual( [
			'Name',
			'City',
			'',
		] );
		expect( cells( t ) ).toEqual( [ [ 'Smith', 'John', 'Berlin' ] ] );
	} );

	it( 'reads a spreadsheet copy whose heading has a line break', () => {
		const t = parseDelimited( '"Name\n(full)"\tAge\nAnna\t30' );
		expect( t.headers.map( ( h ) => h.text ) ).toEqual( [
			'Name<br>(full)',
			'Age',
		] );
		expect( cells( t ) ).toEqual( [ [ 'Anna', '30' ] ] );
	} );
} );

describe( 'parseText', () => {
	it( 'reads rows of values separated by |', () => {
		const t = parseText( 'Name|Type\nDatabase|PostgreSQL' );
		expect( cells( t ) ).toEqual( [ [ 'Database', 'PostgreSQL' ] ] );
	} );

	it( 'makes no empty columns from a | at either end of a row', () => {
		const t = parseText( '| a | b |\n| 1 | 2 |' );
		expect( t.headers.map( ( h ) => h.text ) ).toEqual( [ 'a', 'b' ] );
		expect( cells( t ) ).toEqual( [ [ '1', '2' ] ] );
	} );
} );

describe( 'parseMarkdownTable', () => {
	it( 'needs the separator row', () => {
		expect( parseMarkdownTable( '| A |\n| 1 |' ) ).toBeNull();
	} );

	it( 'keeps inline formatting', () => {
		const t = parseMarkdownTable( '| A |\n|---|\n| **bold** |' );
		expect( cells( t ) ).toEqual( [ [ '<strong>bold</strong>' ] ] );
	} );

	it( 'keeps an escaped \\| in its cell', () => {
		const t = parseMarkdownTable( '| A | B |\n|---|---|\n| x \\| y | z |' );
		expect( cells( t ) ).toEqual( [ [ 'x | y', 'z' ] ] );
	} );
} );

describe( 'parseHtmlTable', () => {
	it( 'keeps the columns after a cell that spans two in place', () => {
		const t = parseHtmlTable(
			'<table><tr><th>A</th><th>B</th><th>C</th></tr><tr><td colspan="2">wide</td><td>c</td></tr></table>'
		);
		expect( cells( t ) ).toEqual( [ [ 'wide', '', 'c' ] ] );
	} );
} );
