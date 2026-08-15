import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	RichText,
} from '@wordpress/block-editor';

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
} ) {
	const { content } = attributes;
	const blockProps = useBlockProps( { className: 'cds--list__item' } );
	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			allowedBlocks: ALLOWED,
			renderAppender: false,
		}
	);

	return (
		<li { ...blockProps }>
			<RichText
				identifier="content"
				tagName="span"
				value={ content }
				onChange={ ( v ) => setAttributes( { content: v } ) }
				onSplit={ ( value ) => ( { ...attributes, content: value } ) }
				onReplace={ onReplace }
				onMerge={ mergeBlocks }
				placeholder={ __( 'List item', 'awt-blocks' ) }
			/>
			<div { ...innerBlocksProps } />
		</li>
	);
}
