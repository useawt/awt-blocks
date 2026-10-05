/**
 * Turning pasted text into a Data table: CSV (or values separated by tabs or
 * semicolons), an HTML table, a Markdown table, or rows separated by |.
 *
 * Every parser returns `{ headers, rows }` — the block's own attribute shape —
 * or null when the text is not that format. The first row is the header row.
 * Header and cell content is safe inline HTML: plain values are escaped, and
 * HTML or Markdown keeps only the inline formatting a cell allows.
 */

import {
	sanitizeInlineHtml,
	mdInline,
	escapeHtml,
} from '../shared/import-format';
import { slugifyKey, dedupeKeys } from './columns';

/**
 * Build the block's shape from a grid of cells.
 *
 * @param {string[][]} grid    Rows of cells; the first row is the header.
 * @param {Function}   toHtml  Turns one cell into safe inline HTML.
 * @param {Function}   toPlain Turns one cell into plain text, for the key.
 * @return {{headers: Array, rows: Array}|null} The table, or null when empty.
 */
function fromGrid( grid, toHtml, toPlain ) {
	if ( ! grid.length || ! grid[ 0 ].length ) {
		return null;
	}
	// A row longer than the header row gets columns with empty headings, so
	// no value is dropped.
	const width = Math.max( ...grid.map( ( cells ) => cells.length ) );
	const head = Array.from( { length: width }, ( _, i ) =>
		i < grid[ 0 ].length ? grid[ 0 ][ i ] : null
	);
	const headers = dedupeKeys(
		head.map( ( cell, i ) => ( {
			key: slugifyKey( cell === null ? '' : toPlain( cell ), i ),
			text: cell === null ? '' : toHtml( cell ),
		} ) )
	);
	const rows = grid.slice( 1 ).map( ( cells ) => {
		const row = {};
		headers.forEach( ( h, i ) => {
			row[ h.key ] = cells[ i ] !== undefined ? toHtml( cells[ i ] ) : '';
		} );
		return row;
	} );
	return { headers, rows };
}

// A line break inside a quoted value stays a line break in the cell.
const plainCell = ( s ) =>
	escapeHtml( String( s ).trim() ).replace( /\n/g, '<br>' );
const trimmed = ( s ) => String( s ).trim();

/**
 * Which character separates the values: a tab (what a spreadsheet copies),
 * a semicolon (CSV where the comma is the decimal mark), or a comma. Decided by
 * the header row, outside quotes, so a heading with a line break in it does
 * not end the row. A header row with none of them is one column: then a comma
 * in a value is part of the value.
 *
 * @param {string} text The pasted text, or just its header row.
 * @return {string} The separator, or '' for one column.
 */
export function detectDelimiter( text ) {
	const counts = { '\t': 0, ';': 0, ',': 0 };
	let quoted = false;
	for ( const ch of String( text || '' ) ) {
		if ( ch === '"' ) {
			quoted = ! quoted;
		} else if ( ! quoted && ch === '\n' ) {
			break;
		} else if ( ! quoted && ch in counts ) {
			counts[ ch ]++;
		}
	}
	if ( counts[ '\t' ] > 0 ) {
		return '\t';
	}
	if ( counts[ ';' ] === 0 && counts[ ',' ] === 0 ) {
		return '';
	}
	return counts[ ';' ] > counts[ ',' ] ? ';' : ',';
}

/**
 * Split delimited text into rows of cells, RFC 4180 style: a value in double
 * quotes may hold the separator, a line break, or a doubled quote.
 *
 * @param {string} raw       The pasted text.
 * @param {string} delimiter The separator; '' for one value per line.
 * @return {string[][]} Rows of cells, blank lines dropped.
 */
export function splitDelimited( raw, delimiter ) {
	const rows = [];
	let row = [];
	let cell = '';
	let quoted = false;
	const text = String( raw || '' ).replace( /\r\n?/g, '\n' );
	for ( let i = 0; i < text.length; i++ ) {
		const ch = text[ i ];
		if ( quoted ) {
			if ( ch === '"' && text[ i + 1 ] === '"' ) {
				cell += '"';
				i++;
			} else if ( ch === '"' ) {
				quoted = false;
			} else {
				cell += ch;
			}
		} else if ( ch === '"' && cell.trim() === '' ) {
			quoted = true;
			cell = '';
		} else if ( delimiter !== '' && ch === delimiter ) {
			row.push( cell );
			cell = '';
		} else if ( ch === '\n' ) {
			row.push( cell );
			rows.push( row );
			row = [];
			cell = '';
		} else {
			cell += ch;
		}
	}
	row.push( cell );
	rows.push( row );
	return rows.filter( ( r ) => r.some( ( c ) => c.trim() !== '' ) );
}

/**
 * CSV, or values separated by tabs or semicolons.
 *
 * @param {string} raw The pasted text.
 * @return {{headers: Array, rows: Array}|null} The table.
 */
export function parseDelimited( raw ) {
	const text = String( raw || '' ).trim();
	if ( ! text ) {
		return null;
	}
	const grid = splitDelimited(
		text,
		detectDelimiter( text.replace( /\r\n?/g, '\n' ) )
	);
	return fromGrid( grid, plainCell, trimmed );
}

/**
 * A row's cells, split on | but not on an escaped \|. A | at the start or
 * the end of the row frames it and makes no empty column.
 *
 * @param {string} line One row.
 * @return {string[]} Its cells.
 */
function splitPipes( line ) {
	return line
		.trim()
		.replace( /^\|/, '' )
		.replace( /(?<!\\)\|$/, '' )
		.split( /(?<!\\)\|/ )
		.map( ( cell ) => cell.replace( /\\\|/g, '|' ) );
}

/**
 * Rows of values separated by |, the header row first.
 *
 * @param {string} raw The pasted text.
 * @return {{headers: Array, rows: Array}|null} The table.
 */
export function parseText( raw ) {
	const grid = String( raw || '' )
		.split( /\r?\n/ )
		.filter( ( line ) => line.trim() !== '' )
		.map( splitPipes );
	return fromGrid( grid, plainCell, trimmed );
}

/**
 * An HTML `<table>`. The first row with `<th>` cells (or the first row) is
 * the header; the other rows become data.
 *
 * @param {string} raw The pasted HTML.
 * @return {{headers: Array, rows: Array}|null} The table.
 */
export function parseHtmlTable( raw ) {
	const doc = new window.DOMParser().parseFromString(
		raw || '',
		'text/html'
	);
	const table = doc.querySelector( 'table' );
	if ( ! table ) {
		return null;
	}
	const trEls = Array.from( table.querySelectorAll( 'tr' ) );
	if ( ! trEls.length ) {
		return null;
	}
	let headerIdx = trEls.findIndex( ( tr ) => tr.querySelector( 'th' ) );
	if ( headerIdx === -1 ) {
		headerIdx = 0;
	}
	const ordered = [
		trEls[ headerIdx ],
		...trEls.filter( ( _, i ) => i !== headerIdx ),
	];
	// A cell that spans columns keeps the columns after it in place: its
	// value goes in the first, and the others it covers are empty.
	const grid = ordered.map( ( tr ) =>
		Array.from( tr.children ).flatMap( ( cell ) => [
			cell,
			...Array.from(
				{
					length:
						Math.min(
							50,
							parseInt( cell.getAttribute( 'colspan' ), 10 ) || 1
						) - 1,
				},
				() => doc.createElement( 'td' )
			),
		] )
	);
	return fromGrid(
		grid,
		( c ) => sanitizeInlineHtml( c.innerHTML ),
		( c ) => ( c.textContent || '' ).trim()
	);
}

/**
 * A Markdown table: a header row, a |---|---| separator, then data rows.
 *
 * @param {string} raw The pasted Markdown.
 * @return {{headers: Array, rows: Array}|null} The table.
 */
export function parseMarkdownTable( raw ) {
	const lines = String( raw || '' )
		.split( /\r?\n/ )
		.map( ( l ) => l.trim() )
		.filter( Boolean );
	if ( lines.length < 2 ) {
		return null;
	}
	if (
		! /^[\s|:-]+$/.test( lines[ 1 ] ) ||
		lines[ 1 ].indexOf( '-' ) === -1
	) {
		return null;
	}
	const splitRow = ( l ) => splitPipes( l ).map( ( c ) => c.trim() );
	const grid = [
		splitRow( lines[ 0 ] ),
		...lines.slice( 2 ).map( splitRow ),
	];
	return fromGrid( grid, mdInline, trimmed );
}

/** The formats the import offers, in the order shown. */
export const IMPORT_FORMATS = {
	csv: parseDelimited,
	text: parseText,
	html: parseHtmlTable,
	markdown: parseMarkdownTable,
};
