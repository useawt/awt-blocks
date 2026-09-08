/**
 * A feature grid steps down to two columns before it runs out of room.
 *
 * The column count an author picks is the count on a wide screen. All three
 * counts used to be reached at Carbon's md (672px) and held from there up, so
 * a four-column grid was four columns on a 700px laptop window: 195px tiles,
 * headings broken over three lines, body text two or three words wide. Found
 * on a live site (2026-09-08).
 *
 * The assertion that matters is the second one — no tile narrower than a tile
 * can be read at — because that is the property, and a breakpoint is only how
 * it is currently reached.
 */

const { test, expect } = require( './fixtures' );

const tile = ( heading ) =>
	`<!-- wp:awt/tile --><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">${ heading }</h3><!-- /wp:heading --><!-- wp:paragraph --><p>Body copy, so the column width shows.</p><!-- /wp:paragraph --><!-- /wp:awt/tile -->`;

const CONTENT = `
<!-- wp:awt/feature-grid {"columns":4} -->${ tile( 'One' ) }${ tile(
	'Two'
) }${ tile( 'Three' ) }${ tile( 'Four' ) }<!-- /wp:awt/feature-grid -->
<!-- wp:awt/feature-grid {"columns":3} -->${ tile( 'A' ) }${ tile(
	'B'
) }${ tile( 'C' ) }<!-- /wp:awt/feature-grid -->
<!-- wp:awt/feature-grid {"columns":2} -->${ tile( 'X' ) }${ tile(
	'Y'
) }<!-- /wp:awt/feature-grid -->
`;

// Columns actually laid out, and the narrowest tile, for each grid.
const COLLECT = () => {
	const out = {};
	[ 2, 3, 4 ].forEach( ( n ) => {
		const grid = document.querySelector( `.awt-feature-grid--cols-${ n }` );
		if ( ! grid ) {
			return;
		}
		const columns = getComputedStyle( grid )
			.gridTemplateColumns.split( ' ' )
			.map( ( c ) => parseFloat( c ) );
		out[ n ] = {
			count: columns.length,
			narrowest: Math.round( Math.min( ...columns ) ),
		};
	} );
	return out;
};

// What each grid should be laid out as at a given viewport width. One column
// below md, two from there, and the author's count once its tiles have room.
const EXPECTED = [
	{ width: 1400, cols: { 2: 2, 3: 3, 4: 4 } },
	{ width: 1100, cols: { 2: 2, 3: 3, 4: 2 } },
	{ width: 900, cols: { 2: 2, 3: 2, 4: 2 } },
	{ width: 700, cols: { 2: 2, 3: 2, 4: 2 } },
	{ width: 600, cols: { 2: 1, 3: 1, 4: 1 } },
];

// Narrower than this and a tile stops being readable: the defect was 195px.
const READABLE = 240;

test.describe( 'Feature grid columns', () => {
	test( 'the grid steps down instead of holding four narrow columns', async ( {
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Feature grid columns',
			content: CONTENT,
			status: 'publish',
		} );

		const wrong = [];
		for ( const { width, cols } of EXPECTED ) {
			await page.setViewportSize( { width, height: 900 } );
			await page.goto( `/?page_id=${ created.id }` );
			const laid = await page.evaluate( COLLECT );

			for ( const [ n, expected ] of Object.entries( cols ) ) {
				if ( laid[ n ].count !== expected ) {
					wrong.push(
						`${ width }px: a ${ n }-column grid laid out ${ laid[ n ].count } columns, expected ${ expected }`
					);
				}
				if ( laid[ n ].narrowest < READABLE ) {
					wrong.push(
						`${ width }px: a ${ n }-column grid has ${ laid[ n ].narrowest }px tiles, under the ${ READABLE }px a tile needs`
					);
				}
			}
		}

		expect( wrong, wrong.join( '\n  ' ) ).toHaveLength( 0 );
	} );
} );
