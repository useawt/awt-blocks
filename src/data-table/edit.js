import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { applyFilters } from '@wordpress/hooks';
import {
	useBlockProps,
	InspectorControls,
	BlockControls,
	RichText,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ToggleControl,
	TextareaControl,
	Button,
	Modal,
	Notice,
	ToolbarButton,
	ToolbarDropdownMenu,
	ToolbarGroup,
	VisuallyHidden,
} from '@wordpress/components';
import tableIcon from '@carbon/icons/es/table/32';
import rowInsertIcon from '@carbon/icons/es/row--insert/32';
import rowDeleteIcon from '@carbon/icons/es/row--delete/32';
import columnInsertIcon from '@carbon/icons/es/column--insert/32';
import columnDeleteIcon from '@carbon/icons/es/column--delete/32';
import importIcon from '@carbon/icons/es/document--import/32';
import { blockIcon } from '../shared/block-icon';
import { iconMaskImage } from '../shared/icon-picker';
import PremiumNotice from '../shared/premium-notice';
import { SOURCE_NOTE_STYLE, useLinkGuard } from '../shared/source-locked';
import { sanitizeInlineHtml } from '../shared/import-format';
import { plainText } from './columns';
import { IMPORT_FORMATS } from './import';

const ICONS = {
	table: blockIcon( tableIcon ),
	rowInsert: blockIcon( rowInsertIcon ),
	rowDelete: blockIcon( rowDeleteIcon ),
	columnInsert: blockIcon( columnInsertIcon ),
	columnDelete: blockIcon( columnDeleteIcon ),
	import: blockIcon( importIcon ),
};

// Typed cells keep the inline formatting render.php allows: links, bold,
// italic, inline code and images.
const CELL_FORMATS = [
	'core/bold',
	'core/italic',
	'core/link',
	'core/code',
	'core/image',
];

// Free AWT reads pasted text (CSV, rows separated by |, HTML, Markdown). The
// live sources (JSON, REST, WP_Query) are AWT Premium and are surfaced via the
// shared PremiumNotice box in the Data panel — not as dead disabled options.
const IMPORT_OPTIONS = [
	{
		label: __( 'CSV, or a spreadsheet copy', 'awt-blocks' ),
		value: 'csv',
	},
	{
		label: __( 'Text (values separated by |)', 'awt-blocks' ),
		value: 'text',
	},
	{ label: __( 'HTML table', 'awt-blocks' ), value: 'html' },
	{ label: __( 'Markdown table', 'awt-blocks' ), value: 'markdown' },
];

const IMPORT_HELP = {
	csv: __(
		'The first row is the column headings. Values can be separated by commas, semicolons or tabs, so you can paste straight from a spreadsheet.',
		'awt-blocks'
	),
	text: __(
		'One row per line, the column headings first, values separated by |.',
		'awt-blocks'
	),
	html: __(
		'Paste an HTML <table>. Its header row and body rows become the table.',
		'awt-blocks'
	),
	markdown: __(
		'Paste a Markdown table: a header row, a |---|---| separator row, then data rows.',
		'awt-blocks'
	),
};

const IMPORT_ERROR = {
	csv: __( 'There is no data to import.', 'awt-blocks' ),
	text: __( 'There is no data to import.', 'awt-blocks' ),
	html: __( 'No <table> found in the pasted HTML.', 'awt-blocks' ),
	markdown: __(
		'That doesn’t look like a Markdown table. Include a header row and a |---|---| separator row.',
		'awt-blocks'
	),
};

// Boolean cell renderer — mirrors render.php, which emits a Carbon checkmark
// for truthy values and a dash for everything else. Truthy set matches
// render.php exactly.
const TRUTHY = new Set( [ '1', 'true', 'yes', '✓', 'y', 'on' ] );
const isTruthy = ( v ) =>
	v === true || TRUTHY.has( String( v ).trim().toLowerCase() );

// A typed cell's text fills its cell, so an empty cell can still be clicked
// into, and the cell stays a cell for screen readers (the text inside it is
// the text box, named by its column and row).
const CELL_TEXT_STYLE = { minHeight: '1.25em' };

/**
 * A click on a cell's padding puts the cursor in its text, as a click on the
 * text does. Keyboard users reach the text with Tab.
 *
 * @param {MouseEvent} event The click.
 */
const focusCellText = ( event ) => {
	if ( event.target === event.currentTarget ) {
		event.currentTarget
			.querySelector( '[contenteditable="true"]' )
			?.focus();
	}
};

const maskStyle = ( name, colour ) => ( {
	display: 'inline-block',
	width: '1rem',
	height: '1rem',
	background: colour,
	WebkitMaskImage: iconMaskImage( name, [ 32 ] ),
	maskImage: iconMaskImage( name, [ 32 ] ),
	WebkitMaskRepeat: 'no-repeat',
	maskRepeat: 'no-repeat',
	WebkitMaskPosition: 'center',
	maskPosition: 'center',
	WebkitMaskSize: 'contain',
	maskSize: 'contain',
} );

/**
 * A yes/no cell. In the editor it is a button that flips the value, named by
 * what it shows, with its state as `aria-pressed`.
 *
 * @param {Object}   props
 * @param {*}        props.value    The cell's value.
 * @param {string}   props.label    "<column>, row <n>", for the button's name.
 * @param {Function} props.onChange Receives 'yes' or 'no'.
 * @param {Function} props.onFocus  Marks the cell as the current one.
 */
const BooleanCell = ( { value, label, onChange, onFocus } ) => {
	const yes = isTruthy( value );
	return (
		<td className="awt-data-table__cell--boolean">
			<Button
				size="small"
				aria-pressed={ yes }
				aria-label={ sprintf(
					/* translators: %s: column heading and row number, e.g. "Backups, row 2". */
					__( '%s: included', 'awt-blocks' ),
					label
				) }
				onClick={ () => onChange( yes ? 'no' : 'yes' ) }
				onFocus={ onFocus }
			>
				<span
					aria-hidden="true"
					style={
						yes
							? maskStyle(
									'checkmark',
									'var(--cds-support-success, #24a148)'
							  )
							: maskStyle(
									'subtract',
									'var(--cds-text-secondary, #525252)'
							  )
					}
				/>
			</Button>
		</td>
	);
};

/**
 * A yes/no cell that cannot be changed here: the icon, and its value in words
 * for screen readers.
 *
 * @param {Object} props
 * @param {*}      props.value The cell's value.
 */
const StaticBooleanCell = ( { value } ) => {
	const yes = isTruthy( value );
	return (
		<td className="awt-data-table__cell--boolean">
			<span
				aria-hidden="true"
				style={
					yes
						? maskStyle(
								'checkmark',
								'var(--cds-support-success, #24a148)'
						  )
						: maskStyle(
								'subtract',
								'var(--cds-text-secondary, #525252)'
						  )
				}
			/>
			<VisuallyHidden>
				{ yes ? __( 'Yes', 'awt-blocks' ) : __( 'No', 'awt-blocks' ) }
			</VisuallyHidden>
		</td>
	);
};

/**
 * A key for a new column, unique among the others.
 *
 * @param {Array} headers The current columns.
 * @return {string} The key.
 */
function newColumnKey( headers ) {
	const taken = new Set( headers.map( ( h ) => h.key ) );
	let n = headers.length + 1;
	while ( taken.has( `col${ n }` ) ) {
		n++;
	}
	return `col${ n }`;
}

export default function Edit( {
	attributes,
	setAttributes,
	isSelected,
	clientId,
} ) {
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

	// Other code (AWT Premium's live data) can fill the table from somewhere
	// else. It then returns a short note saying from where: the table shows
	// that data and cannot be typed in, since the page would not show what
	// was typed.
	const sourceNote = applyFilters(
		'awt.dataSourceNote',
		'',
		attributes,
		'awt/data-table'
	);
	const guardLinks = useLinkGuard();

	// The cell the toolbar's row and column actions work from: `row` is -1
	// for the heading row. Null until a cell has been focused, and again once
	// the block is left, so an action never works on a cell out of sight.
	const [ current, setCurrent ] = useState( null );
	useEffect( () => {
		if ( ! isSelected ) {
			setCurrent( null );
		}
	}, [ isSelected ] );
	const [ importing, setImporting ] = useState( false );
	const [ importFormat, setImportFormat ] = useState( 'csv' );
	const [ importText, setImportText ] = useState( '' );
	const [ importError, setImportError ] = useState( '' );

	const columnName = ( h, c ) =>
		plainText( h.text ) ||
		sprintf(
			/* translators: %d: column number. */
			__( 'Column %d', 'awt-blocks' ),
			c + 1
		);
	const cellLabel = ( h, c, r ) =>
		sprintf(
			/* translators: 1: column heading, 2: row number. */
			__( '%1$s, row %2$d', 'awt-blocks' ),
			columnName( h, c ),
			r + 1
		);

	const setCell = ( r, key, value ) =>
		setAttributes( {
			rows: rows.map( ( row, i ) =>
				i === r ? { ...row, [ key ]: value } : row
			),
		} );
	const setHeading = ( c, text ) =>
		setAttributes( {
			headers: headers.map( ( h, i ) =>
				i === c ? { ...h, text } : h
			),
		} );

	const emptyRow = () =>
		Object.fromEntries( headers.map( ( h ) => [ h.key, '' ] ) );
	const insertRow = ( at ) => {
		const next = [ ...rows ];
		next.splice( at, 0, emptyRow() );
		setAttributes( { rows: next } );
		setCurrent( { row: at, col: current?.col ?? 0 } );
		speak( __( 'Row added.', 'awt-blocks' ) );
	};
	const deleteRow = ( at ) => {
		setAttributes( { rows: rows.filter( ( _, i ) => i !== at ) } );
		setCurrent( null );
		speak( __( 'Row deleted.', 'awt-blocks' ) );
	};
	const insertColumn = ( at ) => {
		const key = newColumnKey( headers );
		const next = [ ...headers ];
		next.splice( at, 0, { key, text: '' } );
		setAttributes( {
			headers: next,
			rows: rows.map( ( row ) => ( { ...row, [ key ]: '' } ) ),
		} );
		setCurrent( { row: current?.row ?? -1, col: at } );
		speak( __( 'Column added.', 'awt-blocks' ) );
	};
	const deleteColumn = ( at ) => {
		const { key } = headers[ at ];
		setAttributes( {
			headers: headers.filter( ( _, i ) => i !== at ),
			rows: rows.map( ( row ) => {
				const { [ key ]: dropped, ...rest } = row; // eslint-disable-line no-unused-vars
				return rest;
			} ),
			...( defaultSortKey === key ? { defaultSortKey: '' } : {} ),
		} );
		setCurrent( null );
		speak( __( 'Column deleted.', 'awt-blocks' ) );
	};

	// With no cell chosen, new rows and columns go at the end. A cell that
	// is gone (an undo removed its row or column) counts as none.
	const known =
		current && current.row < rows.length && current.col < headers.length
			? current
			: null;
	const row = known?.row ?? null;
	const col = known?.col ?? null;
	const tableControls = [
		{
			title: __( 'Insert row before', 'awt-blocks' ),
			icon: ICONS.rowInsert,
			isDisabled: row === null || row < 0,
			onClick: () => insertRow( row ),
		},
		{
			title: __( 'Insert row after', 'awt-blocks' ),
			icon: ICONS.rowInsert,
			onClick: () => insertRow( row === null ? rows.length : row + 1 ),
		},
		{
			title: __( 'Delete row', 'awt-blocks' ),
			icon: ICONS.rowDelete,
			isDisabled: row === null || row < 0,
			onClick: () => deleteRow( row ),
		},
		{
			title: __( 'Insert column before', 'awt-blocks' ),
			icon: ICONS.columnInsert,
			isDisabled: col === null,
			onClick: () => insertColumn( col ),
		},
		{
			title: __( 'Insert column after', 'awt-blocks' ),
			icon: ICONS.columnInsert,
			onClick: () =>
				insertColumn( col === null ? headers.length : col + 1 ),
		},
		{
			title: __( 'Delete column', 'awt-blocks' ),
			icon: ICONS.columnDelete,
			isDisabled: col === null || headers.length < 2,
			onClick: () => deleteColumn( col ),
		},
	];

	const openImport = () => {
		setImportError( '' );
		setImporting( true );
	};
	const applyImport = () => {
		const parsed = IMPORT_FORMATS[ importFormat ]( importText );
		if ( ! parsed || ! parsed.headers.length ) {
			setImportError( IMPORT_ERROR[ importFormat ] );
			return;
		}
		setAttributes( {
			headers: parsed.headers,
			rows: parsed.rows,
			...( parsed.headers.some( ( h ) => h.key === defaultSortKey )
				? {}
				: { defaultSortKey: '' } ),
		} );
		setImportText( '' );
		setImporting( false );
		setCurrent( null );
		speak(
			sprintf(
				/* translators: %d: how many rows the table has now. */
				_n(
					'The table was replaced: %d row.',
					'The table was replaced: %d rows.',
					parsed.rows.length,
					'awt-blocks'
				),
				parsed.rows.length
			)
		);
	};

	// Filled from elsewhere, the table shows its content as it is, after the
	// same clean-up an imported table gets.
	const shownRows = useMemo(
		() =>
			sourceNote
				? rows.map( ( r ) =>
						Object.fromEntries(
							headers.map( ( h ) => [
								h.key,
								sanitizeInlineHtml(
									String( r[ h.key ] ?? '' )
								),
							] )
						)
				  )
				: rows,
		[ sourceNote, rows, headers ]
	);

	// Mirror render.php class grammar: the SIZE / ZEBRA / STATIC / SORTABLE
	// modifiers belong on the <table>, not the .cds--data-table-container.
	// The container only ever carries the optional --sticky-header modifier.
	// Deliberate difference from render.php: the front end gives this container
	// tabindex="0" so a keyboard user can scroll a table wider than its box
	// (WCAG 2.1.1). The editor does not, because a tab stop on the block
	// wrapper competes with the editor's own block-selection focus handling, and
	// the requirement is about the published page. Do not "restore parity" here
	// without checking block selection still works.
	const blockProps = useBlockProps( {
		className: `cds--data-table-container${
			stickyHeader ? ' cds--data-table-container--sticky-header' : ''
		}`,
	} );
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
			{ ! sourceNote && (
				<BlockControls group="other">
					<ToolbarGroup>
						<ToolbarDropdownMenu
							icon={ ICONS.table }
							label={ __( 'Rows and columns', 'awt-blocks' ) }
							controls={ tableControls }
						/>
						<ToolbarButton
							icon={ ICONS.import }
							label={ __( 'Import data', 'awt-blocks' ) }
							onClick={ openImport }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			<InspectorControls>
				<PanelBody
					title={ __( 'Data table', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Table caption', 'awt-blocks' ) }
						help={ __(
							'Describes the table. Everyone sees it; screen readers read it first.',
							'awt-blocks'
						) }
						value={ caption }
						onChange={ ( v ) => setAttributes( { caption: v } ) }
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ [ 'xs', 'sm', 'md', 'lg', 'xl' ].map(
							( v ) => ( {
								value: v,
								label: v,
							} )
						) }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<ToggleControl
						label={ __( 'Striped rows', 'awt-blocks' ) }
						checked={ zebra }
						onChange={ ( v ) => setAttributes( { zebra: v } ) }
					/>
					<ToggleControl
						label={ __( 'Fit width to content', 'awt-blocks' ) }
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
									...headers.map( ( h, c ) => ( {
										label: columnName( h, c ),
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
					{ ! sourceNote && (
						<>
							<p className="components-base-control__help">
								{ __(
									'Type in the table. Add and remove rows and columns, or import CSV, from the block toolbar.',
									'awt-blocks'
								) }
							</p>
							<Button variant="secondary" onClick={ openImport }>
								{ __( 'Import data', 'awt-blocks' ) }
							</Button>
						</>
					) }
					<PremiumNotice
						feature="data-sources"
						attributes={ attributes }
						setAttributes={ setAttributes }
						clientId={ clientId }
						title={ __( 'More data sources', 'awt-blocks' ) }
						description={ __(
							'Fill this table from JSON, a REST API, a CSV file, or your own posts and pages. Available in AWT Premium.',
							'awt-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			{ importing && (
				<Modal
					title={ __( 'Import data', 'awt-blocks' ) }
					onRequestClose={ () => setImporting( false ) }
				>
					<div className="awt-data-table__import">
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Format', 'awt-blocks' ) }
							value={ importFormat }
							options={ IMPORT_OPTIONS }
							onChange={ ( v ) => {
								setImportFormat( v );
								setImportError( '' );
							} }
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Paste the data', 'awt-blocks' ) }
							help={ IMPORT_HELP[ importFormat ] }
							value={ importText }
							onChange={ ( v ) => {
								setImportText( v );
								setImportError( '' );
							} }
							rows={ 10 }
						/>
						{ importError && (
							<Notice status="error" isDismissible={ false }>
								{ importError }
							</Notice>
						) }
						{ rows.length > 0 && (
							<p className="components-base-control__help">
								{ __(
									'This replaces the rows and columns the table has now.',
									'awt-blocks'
								) }
							</p>
						) }
						<Button
							variant="primary"
							onClick={ applyImport }
							disabled={ ! importText.trim() }
							accessibleWhenDisabled
						>
							{ __( 'Replace the table', 'awt-blocks' ) }
						</Button>
					</div>
				</Modal>
			) }
			<div { ...blockProps }>
				{ sourceNote && (
					<p
						className="awt-data-table__source-note"
						style={ SOURCE_NOTE_STYLE }
					>
						{ sourceNote }
					</p>
				) }
				{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- catches link clicks, which Enter on a link also fires. */ }
				<table
					className={ tableClasses }
					onClick={ sourceNote ? guardLinks : undefined }
				>
					{ caption && <caption>{ caption }</caption> }
					<thead>
						<tr>
							{ headers.map( ( h, c ) => (
								// Carbon's label span, as render.php writes it, so the
								// XL-size `.cds--table-header-label{display:block}` rule
								// aligns heading text with the cells below.
								<th key={ h.key } scope="col">
									{ sourceNote ? (
										<RichText.Content
											tagName="span"
											className="cds--table-header-label"
											value={ sanitizeInlineHtml(
												h.text || ''
											) }
										/>
									) : (
										<RichText
											tagName="span"
											className="cds--table-header-label"
											value={ h.text || '' }
											onChange={ ( v ) =>
												setHeading( c, v )
											}
											allowedFormats={ CELL_FORMATS }
											placeholder={
												isSelected
													? __(
															'Heading',
															'awt-blocks'
													  )
													: undefined
											}
											aria-label={ sprintf(
												/* translators: %d: column number. */
												__(
													'Column %d heading',
													'awt-blocks'
												),
												c + 1
											) }
											onFocus={ () =>
												setCurrent( {
													row: -1,
													col: c,
												} )
											}
										/>
									) }
								</th>
							) ) }
						</tr>
					</thead>
					<tbody>
						{ shownRows.map( ( r, i ) => (
							<tr key={ i }>
								{ headers.map( ( h, c ) => {
									if ( sourceNote ) {
										return h.cellType === 'boolean' ? (
											<StaticBooleanCell
												key={ h.key }
												value={ r[ h.key ] }
											/>
										) : (
											<RichText.Content
												key={ h.key }
												tagName="td"
												value={ String(
													r[ h.key ] ?? ''
												) }
											/>
										);
									}
									return h.cellType === 'boolean' ? (
										<BooleanCell
											key={ h.key }
											value={ r[ h.key ] }
											label={ cellLabel( h, c, i ) }
											onChange={ ( v ) =>
												setCell( i, h.key, v )
											}
											onFocus={ () =>
												setCurrent( { row: i, col: c } )
											}
										/>
									) : (
										// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- a mouse shortcut to the text box inside, which Tab reaches.
										<td
											key={ h.key }
											onClick={ focusCellText }
										>
											<RichText
												tagName="div"
												style={ CELL_TEXT_STYLE }
												value={ String(
													r[ h.key ] ?? ''
												) }
												onChange={ ( v ) =>
													setCell( i, h.key, v )
												}
												allowedFormats={ CELL_FORMATS }
												aria-label={ cellLabel(
													h,
													c,
													i
												) }
												onFocus={ () =>
													setCurrent( {
														row: i,
														col: c,
													} )
												}
											/>
										</td>
									);
								} ) }
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		</>
	);
}
