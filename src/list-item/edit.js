import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	RichText,
} from '@wordpress/block-editor';
import { IndentControls, useIndentKeys } from './indent';

/**
 * List items optionally contain a nested awt/list as an inner block — that's
 * how nested lists are composed. The inner-blocks insertion slot stays
 * invisible until an author drops a list into the item, so leaf usage feels
 * unchanged.
 */
const ALLOWED = [ 'awt/list' ];

export default function Edit( {
	attributes,
	setAttributes,
	onReplace,
	mergeBlocks,
	clientId,
} ) {
	const { content } = attributes;
	const blockProps = useBlockProps( { className: 'cds--list__item' } );
	// The inner blocks sit directly inside the <li>, which is what render.php
	// emits and what a nested list needs: a wrapper element between the item
	// and its sub-list would indent it differently here than on the page.
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED,
		renderAppender: false,
	} );
	const indentKeysRef = useIndentKeys( clientId );

	return (
		<>
			<li { ...innerBlocksProps }>
				<RichText
					ref={ indentKeysRef }
					identifier="content"
					tagName="span"
					value={ content }
					onChange={ ( v ) => setAttributes( { content: v } ) }
					onSplit={ ( value ) => ( {
						...attributes,
						content: value,
					} ) }
					onReplace={ onReplace }
					onMerge={ mergeBlocks }
					placeholder={ __( 'List item', 'awt-blocks' ) }
				/>
				{ innerBlocksProps.children }
			</li>
			<IndentControls clientId={ clientId } />
		</>
	);
}
