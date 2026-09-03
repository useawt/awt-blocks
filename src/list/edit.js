import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	TextareaControl,
	Button,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import {
	escapeHtml,
	mdInline,
	sanitizeInlineHtml,
} from '../shared/import-format';
import PremiumNotice from '../shared/premium-notice';

const TYPE_OPTIONS = [
	{ label: 'Bulleted', value: 'unordered' },
	{ label: 'Numbered', value: 'ordered' },
	{
		label: 'Numbered, using your browser’s own style',
		value: 'ordered-native',
	},
];

// Free tier supplies static/inline sources (text, HTML, Markdown). The dynamic
// live-data sources (JSON, REST, WP_Query) are AWT Premium and are surfaced via
// the shared PremiumNotice box below the picker — not as dead disabled options.
const FORMAT_OPTIONS = [
	{ label: __( 'Text (one item per line)', 'awt-blocks' ), value: 'text' },
	{ label: __( 'HTML', 'awt-blocks' ), value: 'html' },
	{ label: __( 'Markdown', 'awt-blocks' ), value: 'markdown' },
];

const TEMPLATE = [ [ 'awt/list-item' ] ];

// escapeHtml + mdInline now live in ../shared/import-format (mdInline also
// supports images and runs through the inline sanitizer).

// ---- Tree model ---------------------------------------------------------
// A parsed list is { type: 'unordered'|'ordered', items: Item[] } where an
// Item is { html, sublist: List|null }. Both the HTML and Markdown parsers
// produce this shape so buildItems() can turn either into nested blocks.

// Recursively read a <ul>/<ol> DOM node into the tree model, pulling any
// nested list inside an <li> into that item's sublist (multi-level support).
function parseHtmlList( listEl ) {
	const type =
		listEl.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered';
	const items = [];
	for ( const li of Array.from( listEl.children ) ) {
		if ( li.tagName.toLowerCase() !== 'li' ) {
			continue;
		}
		const childList = Array.from( li.children ).find( ( c ) =>
			/^(ul|ol)$/i.test( c.tagName )
		);
		// The item's own content is the <li> minus any nested lists.
		const clone = li.cloneNode( true );
		Array.from( clone.children ).forEach( ( c ) => {
			if ( /^(ul|ol)$/i.test( c.tagName ) ) {
				c.remove();
			}
		} );
		items.push( {
			// Keep allowlisted inline formatting (links, bold, italic, code,
			// images), strip class/style/etc. and drop svg/script.
			html: sanitizeInlineHtml( clone.innerHTML ),
			sublist: childList ? parseHtmlList( childList ) : null,
		} );
	}
	return { type, items };
}

// Parse Markdown into the tree model, using leading indentation (tabs count
// as 2 spaces) to nest items. A deeper line becomes a sublist of the previous
// item; the sublist's type follows that line's marker (ordered vs unordered).
function parseMarkdownTree( raw ) {
	const flat = raw
		.split( /\r?\n/ )
		.filter( ( l ) => l.trim() )
		.map( ( line ) => {
			const m = line.match( /^(\s*)([-*+]|\d+[.)])\s+(.*)$/ );
			if ( ! m ) {
				return {
					indent: 0,
					ordered: false,
					html: mdInline( line.trim() ),
				};
			}
			return {
				indent: m[ 1 ].replace( /\t/g, '  ' ).length,
				ordered: /\d/.test( m[ 2 ] ),
				html: mdInline( m[ 3 ].trim() ),
			};
		} );

	const rootType = flat.length && flat[ 0 ].ordered ? 'ordered' : 'unordered';
	const root = { type: rootType, items: [] };
	const stack = [
		{ indent: flat.length ? flat[ 0 ].indent : 0, list: root },
	];

	for ( const f of flat ) {
		while (
			stack.length > 1 &&
			f.indent < stack[ stack.length - 1 ].indent
		) {
			stack.pop();
		}
		let top = stack[ stack.length - 1 ];
		if ( f.indent > top.indent && top.list.items.length ) {
			// Deeper than the current list → open a sublist on its last item.
			const lastItem = top.list.items[ top.list.items.length - 1 ];
			lastItem.sublist = {
				type: f.ordered ? 'ordered' : 'unordered',
				items: [],
			};
			stack.push( { indent: f.indent, list: lastItem.sublist } );
			top = stack[ stack.length - 1 ];
		}
		top.list.items.push( { html: f.html, sublist: null } );
	}
	return root;
}

// Tree → blocks. A sublist becomes a nested awt/list inside the list-item.
function buildItems( items ) {
	return items.map( ( it ) => {
		const inner =
			it.sublist && it.sublist.items.length
				? [
						createBlock(
							'awt/list',
							{ type: it.sublist.type },
							buildItems( it.sublist.items )
						),
				  ]
				: [];
		return createBlock( 'awt/list-item', { content: it.html }, inner );
	} );
}

// Parse pasted content → { type, blocks }. `type` is the detected list type
// (so the block can switch ordered/unordered to match the source) or null to
// leave the current type unchanged (plain text / non-list HTML).
function parseContent( text, mode ) {
	const raw = ( text || '' ).trim();
	if ( ! raw ) {
		return { type: null, blocks: [] };
	}

	if ( mode === 'html' ) {
		const doc = new window.DOMParser().parseFromString( raw, 'text/html' );
		const rootList = doc.querySelector( 'ul, ol' );
		if ( rootList ) {
			const tree = parseHtmlList( rootList );
			return { type: tree.type, blocks: buildItems( tree.items ) };
		}
		// No list markup — fall back to paragraphs / lines, flat.
		const ps = Array.from( doc.querySelectorAll( 'p' ) )
			.map( ( p ) => p.innerHTML.trim() )
			.filter( Boolean );
		const arr = ps.length
			? ps
			: ( doc.body.textContent || '' )
					.split( /\n+/ )
					.map( ( s ) => s.trim() )
					.filter( Boolean );
		return {
			type: null,
			blocks: arr.map( ( h ) =>
				createBlock( 'awt/list-item', { content: h } )
			),
		};
	}

	if ( mode === 'markdown' ) {
		const tree = parseMarkdownTree( raw );
		return { type: tree.type, blocks: buildItems( tree.items ) };
	}

	// Plain text — one item per non-empty line; tolerate pasted bullets.
	const items = raw
		.split( /\r?\n/ )
		.map( ( l ) => {
			const s = l.trim();
			return s
				? escapeHtml( s.replace( /^([••\-*]\s+|\d+[.)]\s+)/, '' ) )
				: '';
		} )
		.filter( Boolean )
		.map( ( h ) => createBlock( 'awt/list-item', { content: h } ) );
	return { type: null, blocks: items };
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const { type, isExpressive, nested } = attributes;
	const isOrdered = type !== 'unordered';
	const tagName = isOrdered ? 'ol' : 'ul';

	const [ dataFormat, setDataFormat ] = useState( 'text' );
	const [ dataText, setDataText ] = useState( '' );

	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );
	const innerItems = useSelect(
		( select ) => select( 'core/block-editor' ).getBlocks( clientId ),
		[ clientId ]
	);

	// "Has data" = anything beyond the single, untouched default item, so a
	// fresh list (one placeholder "Item") generates without a prompt.
	const hasMeaningfulData = () => {
		if ( ! innerItems || innerItems.length === 0 ) {
			return false;
		}
		if ( innerItems.length > 1 ) {
			return true;
		}
		const c = ( innerItems[ 0 ]?.attributes?.content || '' ).trim();
		return c !== '' && c !== 'Item';
	};

	const applyData = () => {
		const { type: detectedType, blocks } = parseContent(
			dataText,
			dataFormat
		);
		if ( ! blocks.length ) {
			return;
		}
		if ( hasMeaningfulData() ) {
			// eslint-disable-next-line no-alert -- native confirm is the editor-standard guard for destructive replaces (core uses it too)
			const ok = window.confirm(
				__(
					'This list already has items. Replace them with the pasted content?',
					'awt-blocks'
				)
			);
			if ( ! ok ) {
				return;
			}
		}
		// Switch the list type to match the source (HTML <ul>/<ol>, Markdown
		// marker). Plain text leaves the current type unchanged.
		if ( detectedType && detectedType !== type ) {
			setAttributes( { type: detectedType } );
		}
		replaceInnerBlocks( clientId, blocks, false );
		setDataText( '' );
	};

	let modifierBase = 'cds--list--unordered';
	if ( type === 'ordered-native' ) {
		modifierBase = 'cds--list--ordered--native';
	} else if ( isOrdered ) {
		modifierBase = 'cds--list--ordered';
	}

	const classes = [
		modifierBase,
		isExpressive ? 'cds--list--expressive' : null,
		nested ? 'cds--list--nested' : null,
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps( { className: classes } );
	const innerProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		allowedBlocks: [ 'awt/list-item' ],
		orientation: 'vertical',
	} );

	const Tag = tagName;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'List', 'awt-blocks' ) }>
					<SelectControl
						label={ __( 'Type', 'awt-blocks' ) }
						value={ type }
						options={ TYPE_OPTIONS }
						onChange={ ( v ) => setAttributes( { type: v } ) }
					/>
					<ToggleControl
						label={ __( 'Expressive text size', 'awt-blocks' ) }
						help={ __(
							'Larger text that grows with the screen. Suits landing pages and marketing content.',
							'awt-blocks'
						) }
						checked={ isExpressive }
						onChange={ ( v ) =>
							setAttributes( { isExpressive: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Style as a sub-list', 'awt-blocks' ) }
						help={ __(
							'Turn this on when this list sits inside another list, so its markers match.',
							'awt-blocks'
						) }
						checked={ nested }
						onChange={ ( v ) => setAttributes( { nested: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Data', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __( 'Data source', 'awt-blocks' ) }
						value={ dataFormat }
						options={ FORMAT_OPTIONS }
						onChange={ setDataFormat }
					/>
					<TextareaControl
						label={ __( 'Paste content', 'awt-blocks' ) }
						help={ __(
							'Each line becomes one list item. Pasted HTML lists and indented Markdown become sub-lists, and set the list type to match.',
							'awt-blocks'
						) }
						value={ dataText }
						onChange={ setDataText }
						rows={ 6 }
					/>
					<Button
						variant="primary"
						onClick={ applyData }
						disabled={ ! dataText.trim() }
					>
						{ __( 'Generate list items', 'awt-blocks' ) }
					</Button>
					<PremiumNotice
						title={ __( 'More data sources', 'awt-blocks' ) }
						description={ __(
							'Fill this list from JSON, a REST API, or your own posts and pages. Available in AWT Premium.',
							'awt-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<Tag { ...innerProps } />
		</>
	);
}
