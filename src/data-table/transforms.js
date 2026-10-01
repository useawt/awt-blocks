/**
 * Transforms between the Data table block and WordPress's own Table block.
 *
 * The Table block keeps header, body and footer rows; the Data table has one
 * row of column headings and data rows. Coming in, the first header row (or
 * the first row, when the table has none) becomes the headings and every other
 * row, footer included, becomes data, so no cell is lost. A row wider than the
 * headings gets a heading per extra column for you to name. Cells keep links,
 * bold, italic and inline code, the same set the Data table shows. Merged
 * cells, alignment and colours have no counterpart and are left behind.
 *
 * The Table block's "Stripes" style and the Data table's zebra rows are the
 * same idea, so each turns into the other.
 */

import { __, sprintf } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { escapeHtml, sanitizeInlineHtml } from '../shared/import-format';
import { slugifyKey, plainText, dedupeKeys } from './columns';

const STRIPES = 'is-style-stripes';

const cellsOf = ( row ) =>
	( row?.cells ?? [] ).map( ( c ) => String( c?.content ?? '' ) );

// className without the Stripes style, and whether it was there.
function splitStripes( className ) {
	const classes = String( className ?? '' )
		.split( /\s+/ )
		.filter( Boolean );
	return {
		zebra: classes.includes( STRIPES ),
		className: classes.filter( ( c ) => c !== STRIPES ).join( ' ' ),
	};
}

function fromCoreTable( attributes ) {
	const head = attributes.head ?? [];
	const body = attributes.body ?? [];
	const foot = attributes.foot ?? [];
	const headingRow = head.length ? head[ 0 ] : body[ 0 ];
	const dataRows = [
		...head.slice( 1 ),
		...( head.length ? body : body.slice( 1 ) ),
		...foot,
	].map( cellsOf );

	const headingCells = cellsOf( headingRow );
	const width = Math.max(
		headingCells.length,
		...dataRows.map( ( r ) => r.length )
	);
	const headers = dedupeKeys(
		Array.from( { length: width }, ( _, i ) => {
			const text =
				i < headingCells.length
					? sanitizeInlineHtml( headingCells[ i ] )
					: escapeHtml(
							/* translators: %d: column number */
							sprintf( __( 'Column %d', 'awt-blocks' ), i + 1 )
					  );
			return { key: slugifyKey( plainText( text ), i ), text };
		} )
	);
	const rows = dataRows.map( ( cells ) => {
		const row = {};
		headers.forEach( ( h, i ) => {
			row[ h.key ] = sanitizeInlineHtml( cells[ i ] ?? '' );
		} );
		return row;
	} );

	const { zebra, className } = splitStripes( attributes.className );
	return createBlock( 'awt/data-table', {
		...( attributes.anchor ? { anchor: attributes.anchor } : {} ),
		...( className ? { className } : {} ),
		headers,
		rows,
		zebra,
		caption: plainText( String( attributes.caption ?? '' ) ),
	} );
}

function toCoreTable( attributes ) {
	const headers = attributes.headers ?? [];
	const cell = ( content, tag ) => ( { content, tag } );
	const { className } = splitStripes( attributes.className );
	const classes = [ className, attributes.zebra ? STRIPES : '' ]
		.filter( Boolean )
		.join( ' ' );
	return createBlock( 'core/table', {
		...( attributes.anchor ? { anchor: attributes.anchor } : {} ),
		...( classes ? { className: classes } : {} ),
		head: [ { cells: headers.map( ( h ) => cell( h.text ?? '', 'th' ) ) } ],
		body: ( attributes.rows ?? [] ).map( ( r ) => ( {
			cells: headers.map( ( h ) =>
				cell( String( r?.[ h.key ] ?? '' ), 'td' )
			),
		} ) ),
		caption: escapeHtml( attributes.caption ?? '' ),
	} );
}

export default {
	from: [
		{
			type: 'block',
			blocks: [ 'core/table' ],
			transform: fromCoreTable,
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/table' ],
			transform: toCoreTable,
		},
	],
};
