import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ToggleControl,
	TextareaControl,
	Button,
} from '@wordpress/components';
import { iconPreviewUrl } from '../shared/icon-picker';
import { sanitizeInlineHtml, mdInline } from '../shared/import-format';
import PremiumNotice from '../shared/premium-notice';

// Free tier supplies static/inline sources (text, HTML, Markdown). The dynamic
// live-data sources (JSON, REST, WP_Query) are AWT Premium and are surfaced via
// the shared PremiumNotice box below the picker — not as dead disabled options.
const DATA_SOURCE_OPTIONS = [
	{ label: __( 'Text', 'awt-blocks' ), value: 'text' },
	{ label: __( 'HTML', 'awt-blocks' ), value: 'html' },
	{ label: __( 'Markdown', 'awt-blocks' ), value: 'markdown' },
];

// Make a stable column key from a header label (falls back to col1, col2 …).
function slugifyKey( text, i ) {
	const s = String( text )
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-+|-+$/g, '' );
	return s || `col${ i + 1 }`;
}

// De-duplicate column keys in place (Carbon needs one key per column).
function dedupeKeys( headers ) {
	const seen = {};
	headers.forEach( ( h ) => {
		let k = h.key;
		while ( seen[ k ] ) {
			k = `${ k }-2`;
		}
		seen[ k ] = true;
		h.key = k;
	} );
	return headers;
}

// Parse a pasted HTML <table> into { headers, rows }. The first row with <th>
// cells (or the first row) is the header; remaining rows become data.
function parseHtmlTable( raw ) {
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
	// Column keys come from the plain text; the visible label + cell values keep
	// allowlisted inline formatting (links, bold, italic, code, images).
	const cellPlain = ( c ) => ( c.textContent || '' ).trim();
	const cellHtml = ( c ) => sanitizeInlineHtml( c.innerHTML );
	let headerIdx = trEls.findIndex( ( tr ) => tr.querySelector( 'th' ) );
	if ( headerIdx === -1 ) {
		headerIdx = 0;
	}
	const headers = dedupeKeys(
		Array.from( trEls[ headerIdx ].children ).map( ( c, i ) => ( {
			key: slugifyKey( cellPlain( c ), i ),
			text: cellHtml( c ),
		} ) )
	);
	const rows = trEls
		.filter( ( _, i ) => i !== headerIdx )
		.map( ( tr ) => {
			const cells = Array.from( tr.children );
			const row = {};
			headers.forEach( ( h, i ) => {
				row[ h.key ] = cells[ i ] ? cellHtml( cells[ i ] ) : '';
			} );
			return row;
		} );
	return { headers, rows };
}

// Parse a pasted Markdown table (header row, a |---|---| separator, then data).
function parseMarkdownTable( raw ) {
	const lines = ( raw || '' )
		.split( /\r?\n/ )
		.map( ( l ) => l.trim() )
		.filter( Boolean );
	if ( lines.length < 2 ) {
		return null;
	}
	const splitRow = ( l ) =>
		l
			.replace( /^\|/, '' )
			.replace( /\|$/, '' )
			.split( '|' )
			.map( ( c ) => c.trim() );
	if (
		! /^[\s|:-]+$/.test( lines[ 1 ] ) ||
		lines[ 1 ].indexOf( '-' ) === -1
	) {
		return null; // second line must be the --- separator row
	}
	// Keys from the plain header text; label + cells through the inline-Markdown
	// converter (links, bold, italic, code, images → safe HTML).
	const headers = dedupeKeys(
		splitRow( lines[ 0 ] ).map( ( t, i ) => ( {
			key: slugifyKey( t, i ),
			text: mdInline( t ),
		} ) )
	);
	const rows = lines.slice( 2 ).map( ( l ) => {
		const cells = splitRow( l );
		const row = {};
		headers.forEach( ( h, i ) => {
			row[ h.key ] = cells[ i ] ? mdInline( cells[ i ] ) : '';
		} );
		return row;
	} );
	return { headers, rows };
}

// Boolean cell renderer — mirrors render.php which emits a Carbon checkmark
// SVG for truthy values and an em-dash for everything else. Without this, the
// editor previewed pricing-comparison rows as raw "true"/"yes" strings
// instead of the icon. Truthy set matches render.php exactly.
const TRUTHY = new Set( [ '1', 'true', 'yes', '✓', 'y', 'on' ] );
const isTruthy = ( v ) =>
	v === true || TRUTHY.has( String( v ).trim().toLowerCase() );

const CheckmarkIcon = () => (
	<span
		aria-hidden="true"
		style={ {
			display: 'inline-block',
			width: '1rem',
			height: '1rem',
			background: 'var(--cds-support-success, #24a148)',
			WebkitMaskImage: `url(${ iconPreviewUrl( 'checkmark', [ 32 ] ) })`,
			maskImage: `url(${ iconPreviewUrl( 'checkmark', [ 32 ] ) })`,
			WebkitMaskRepeat: 'no-repeat',
			maskRepeat: 'no-repeat',
			WebkitMaskPosition: 'center',
			maskPosition: 'center',
			WebkitMaskSize: 'contain',
			maskSize: 'contain',
		} }
	/>
);

const BooleanCell = ( { value } ) => {
	const yes = isTruthy( value );
	return (
		<td className="awt-data-table__cell--boolean">
			<span className="cds--visually-hidden">
				{ yes
					? __( 'Included', 'awt-blocks' )
					: __( 'Not included', 'awt-blocks' ) }
			</span>
			{ yes ? (
				<CheckmarkIcon />
			) : (
				<span
					className="awt-data-table__not-included"
					aria-hidden="true"
				>
					—
				</span>
			) }
		</td>
	);
};

function parseHeaders( raw ) {
	return raw
		.split( '\n' )
		.map( ( line ) => {
			const [ key, ...rest ] = line.split( '|' );
			const text = rest.length > 0 ? rest.join( '|' ).trim() : key.trim();
			return key.trim() ? { key: key.trim(), text } : null;
		} )
		.filter( Boolean );
}

function stringifyHeaders( hs ) {
	return ( hs || [] ).map( ( h ) => `${ h.key }|${ h.text }` ).join( '\n' );
}

function parseRows( raw, headers ) {
	const keys = ( headers || [] ).map( ( h ) => h.key );
	return raw
		.split( '\n' )
		.map( ( line ) => {
			if ( ! line.trim() ) {
				return null;
			}
			const cols = line.split( '|' ).map( ( c ) => c.trim() );
			const row = {};
			keys.forEach( ( k, i ) => {
				row[ k ] = cols[ i ] || '';
			} );
			return row;
		} )
		.filter( Boolean );
}

function stringifyRows( rows, headers ) {
	const keys = ( headers || [] ).map( ( h ) => h.key );
	return ( rows || [] )
		.map( ( r ) => keys.map( ( k ) => r[ k ] || '' ).join( '|' ) )
		.join( '\n' );
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		headers,
		rows,
		size,
		zebra,
		useStaticWidth,
		stickyHeader,
		sortable,
		defaultSortKey,
		defaultSortDirection,
		caption,
	} = attributes;

	// Data source picker (editor-only UI state). Text shows the inline
	// Headers/Rows editors; HTML/Markdown show a paste-and-generate importer.
	const [ dataSource, setDataSource ] = useState( 'text' );
	const [ importText, setImportText ] = useState( '' );

	// Raw text buffers for the Headers/Rows fields. Editing the attribute
	// arrays directly on every keystroke (parse → stringify round-trip) stripped
	// trailing spaces and empty lines as you typed, so you literally couldn't
	// type a space at the end of a label or press Enter to start a new row.
	// Holding the raw string in local state and parsing into attributes in
	// parallel keeps the textarea exactly as typed.
	const [ headerText, setHeaderText ] = useState( () =>
		stringifyHeaders( headers )
	);
	const [ rowText, setRowText ] = useState( () =>
		stringifyRows( rows, headers )
	);

	const onHeaderTextChange = ( v ) => {
		setHeaderText( v );
		const newHeaders = parseHeaders( v );
		// Re-key the rows against the new header set so columns stay aligned.
		setAttributes( {
			headers: newHeaders,
			rows: parseRows( rowText, newHeaders ),
		} );
	};
	const onRowTextChange = ( v ) => {
		setRowText( v );
		setAttributes( { rows: parseRows( v, headers ) } );
	};

	const applyImport = () => {
		const parsed =
			dataSource === 'html'
				? parseHtmlTable( importText )
				: parseMarkdownTable( importText );
		if ( ! parsed || ! parsed.headers.length ) {
			// eslint-disable-next-line no-alert
			window.alert(
				dataSource === 'html'
					? __( 'No <table> found in the pasted HTML.', 'awt-blocks' )
					: __(
							'That doesn’t look like a Markdown table. Include a header row and a |---|---| separator row.',
							'awt-blocks'
					  )
			);
			return;
		}
		if ( rows.length ) {
			// eslint-disable-next-line no-alert -- native confirm is the editor-standard guard for destructive replaces (core uses it too)
			const ok = window.confirm(
				__(
					'Replace the current table data with the pasted content?',
					'awt-blocks'
				)
			);
			if ( ! ok ) {
				return;
			}
		}
		setAttributes( { headers: parsed.headers, rows: parsed.rows } );
		setHeaderText( stringifyHeaders( parsed.headers ) );
		setRowText( stringifyRows( parsed.rows, parsed.headers ) );
		setImportText( '' );
		setDataSource( 'text' ); // drop back to the inline editors to show the result
	};
	// Mirror render.php class grammar: the SIZE / ZEBRA / STATIC / SORTABLE
	// modifiers belong on the <table>, not the .cds--data-table-container.
	// The container only ever carries the optional --sticky-header modifier.
	// Editor was putting size on the container, so Carbon's per-row height
	// rules (which key off .cds--data-table--xs / --sm / --md / etc. on
	// the table) never matched in the editor preview.
	// Deliberate difference from render.php: the front end gives this container
	// tabindex="0" so a keyboard user can scroll a table wider than its box
	// (WCAG 2.1.1). The editor preview does not, because a tab stop on the block
	// wrapper competes with the editor's own block-selection focus handling, and
	// the requirement is about the published page. Do not "restore parity" here
	// without checking block selection still works.
	const blockProps = useBlockProps( {
		className: `cds--data-table-container${
			stickyHeader ? ' cds--data-table-container--sticky-header' : ''
		}`,
	} );
	// sticky-header lives on the CONTAINER class (blockProps above), not the
	// table — Carbon's table-level sticky rules break plain-table layout.
	const tableClasses = [
		'cds--data-table',
		`cds--data-table--${ size }`,
		zebra ? 'cds--data-table--zebra' : '',
		useStaticWidth ? 'cds--data-table--static' : '',
		sortable ? 'cds--data-table--sort' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Data table', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Caption (accessible)', 'awt-blocks' ) }
						value={ caption }
						onChange={ ( v ) => setAttributes( { caption: v } ) }
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ [ 'xs', 'sm', 'md', 'lg', 'xl' ].map(
							( v ) => ( { value: v, label: v } )
						) }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<ToggleControl
						label={ __( 'Zebra striping', 'awt-blocks' ) }
						checked={ zebra }
						onChange={ ( v ) => setAttributes( { zebra: v } ) }
					/>
					<ToggleControl
						label={ __( 'Static width', 'awt-blocks' ) }
						checked={ useStaticWidth }
						onChange={ ( v ) =>
							setAttributes( { useStaticWidth: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Sticky header', 'awt-blocks' ) }
						checked={ stickyHeader }
						onChange={ ( v ) =>
							setAttributes( { stickyHeader: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Sortable columns', 'awt-blocks' ) }
						checked={ sortable }
						onChange={ ( v ) => setAttributes( { sortable: v } ) }
					/>
					{ sortable && (
						<>
							<SelectControl
								label={ __(
									'Default sort column',
									'awt-blocks'
								) }
								value={ defaultSortKey }
								options={ [
									{
										label: __( 'None', 'awt-blocks' ),
										value: '',
									},
									...headers.map( ( h ) => ( {
										label: String( h.text || '' ).replace(
											/<[^>]*>/g,
											''
										),
										value: h.key,
									} ) ),
								] }
								onChange={ ( v ) =>
									setAttributes( { defaultSortKey: v } )
								}
							/>
							<SelectControl
								label={ __(
									'Default sort direction',
									'awt-blocks'
								) }
								value={ defaultSortDirection }
								options={ [
									{ label: 'Asc', value: 'asc' },
									{ label: 'Desc', value: 'desc' },
								] }
								onChange={ ( v ) =>
									setAttributes( { defaultSortDirection: v } )
								}
							/>
						</>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Data', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __( 'Data source', 'awt-blocks' ) }
						value={ dataSource }
						options={ DATA_SOURCE_OPTIONS }
						onChange={ setDataSource }
					/>
					{ dataSource === 'text' && (
						<>
							<TextareaControl
								label={ __(
									'Headers (one per line: key|label)',
									'awt-blocks'
								) }
								value={ headerText }
								onChange={ onHeaderTextChange }
								rows={ 4 }
							/>
							<TextareaControl
								label={ __(
									'Rows (one per line, pipe-separated, in header order)',
									'awt-blocks'
								) }
								value={ rowText }
								onChange={ onRowTextChange }
								rows={ 8 }
							/>
						</>
					) }
					{ ( dataSource === 'html' ||
						dataSource === 'markdown' ) && (
						<>
							<TextareaControl
								label={ __( 'Paste content', 'awt-blocks' ) }
								help={
									dataSource === 'html'
										? __(
												'Paste an HTML <table>. Its header row and body rows become the table data.',
												'awt-blocks'
										  )
										: __(
												'Paste a Markdown table — a header row, a |---|---| separator row, then data rows.',
												'awt-blocks'
										  )
								}
								value={ importText }
								onChange={ setImportText }
								rows={ 8 }
							/>
							<Button
								variant="primary"
								onClick={ applyImport }
								disabled={ ! importText.trim() }
							>
								{ __( 'Generate table', 'awt-blocks' ) }
							</Button>
						</>
					) }
					<PremiumNotice
						title={ __( 'More data sources', 'awt-blocks' ) }
						description={ __(
							'Populate this table from JSON, a REST API, or a WP_Query — available in AWT Premium.',
							'awt-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<table className={ tableClasses }>
					{ caption && <caption>{ caption }</caption> }
					<thead>
						<tr>
							{ headers.map( ( h ) => (
								// Wrap header text in Carbon's label span (as render.php does)
								// so the XL-size `.cds--table-header-label{display:block}`
								// rule can align header text with body cells. Content is
								// re-sanitized here so typed/imported inline formatting renders.
								<th key={ h.key } scope="col">
									<span
										className="cds--table-header-label"
										dangerouslySetInnerHTML={ {
											__html: sanitizeInlineHtml(
												String( h.text || '' )
											),
										} }
									/>
								</th>
							) ) }
						</tr>
					</thead>
					<tbody>
						{ rows.map( ( r, idx ) => (
							<tr key={ idx }>
								{ headers.map( ( h ) =>
									h.cellType === 'boolean' ? (
										<BooleanCell
											key={ h.key }
											value={ r[ h.key ] }
										/>
									) : (
										<td
											key={ h.key }
											dangerouslySetInnerHTML={ {
												__html: sanitizeInlineHtml(
													String( r[ h.key ] || '' )
												),
											} }
										/>
									)
								) }
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		</>
	);
}
