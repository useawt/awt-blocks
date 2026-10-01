/**
 * Transforms between the List block and WordPress's own List block.
 *
 * Either way, nested lists come along as nested lists and the items keep their
 * text and inline formatting. What has no counterpart is left behind: AWT's
 * "Expressive text size" and "browser's own style" numbering going out, and
 * the start number, reversed order and colours of the WordPress list coming in.
 */

import { createBlock } from '@wordpress/blocks';

// A rich-text attribute can arrive as a string or as a RichTextData object,
// which turns into its HTML as a string.
const html = ( value ) => String( value ?? '' );

// Carried over in both directions; both blocks support them.
const common = ( { anchor, className } ) => ( {
	...( anchor ? { anchor } : {} ),
	...( className ? { className } : {} ),
} );

function fromCoreList( attributes, innerBlocks, nested ) {
	return createBlock(
		'awt/list',
		{
			...common( attributes ),
			type: attributes.ordered ? 'ordered' : 'unordered',
			nested,
		},
		innerBlocks
			.filter( ( item ) => item.name === 'core/list-item' )
			.map( ( item ) =>
				createBlock(
					'awt/list-item',
					{ content: html( item.attributes.content ) },
					item.innerBlocks
						.filter( ( b ) => b.name === 'core/list' )
						.map( ( sub ) =>
							fromCoreList(
								sub.attributes,
								sub.innerBlocks,
								true
							)
						)
				)
			)
	);
}

function toCoreList( attributes, innerBlocks ) {
	return createBlock(
		'core/list',
		{
			...common( attributes ),
			ordered: ( attributes.type ?? 'unordered' ) !== 'unordered',
		},
		innerBlocks
			.filter( ( item ) => item.name === 'awt/list-item' )
			.map( ( item ) =>
				createBlock(
					'core/list-item',
					{ content: html( item.attributes.content ) },
					item.innerBlocks
						.filter( ( b ) => b.name === 'awt/list' )
						.map( ( sub ) =>
							toCoreList( sub.attributes, sub.innerBlocks )
						)
				)
			)
	);
}

export default {
	from: [
		{
			type: 'block',
			blocks: [ 'core/list' ],
			transform: ( attributes, innerBlocks ) =>
				fromCoreList( attributes, innerBlocks, false ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/list' ],
			transform: toCoreList,
		},
	],
};
