import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

/**
 * Enter at the end of a tag, button or link's text: start the next thing.
 *
 * These are one line of text, so Enter must not add a second line (the
 * RichText also takes `disableLineBreaks`). Instead it does what Enter does
 * at the end of a heading: a paragraph after the block where one is allowed,
 * otherwise, as in an Inline set, another block of the same kind, empty, so
 * tags can be typed one after another. Enter on that empty one leaves the
 * row for a paragraph after it, as Enter on an empty list item leaves a list.
 *
 * WordPress's own `splitting` support was not used: where a paragraph is not
 * allowed it adds the block with its defaults, which brings back the word
 * "Tag" or "Button" the author would have to delete.
 *
 * @param {string}   clientId          The block's client ID.
 * @param {string}   name              The block's name.
 * @param {Object}   emptyAttributes   What a new one starts with.
 * @param {string}   text              The block's current text.
 * @param {Function} insertBlocksAfter The edit component's prop.
 * @return {Function} The RichText's `__unstableOnSplitAtEnd`.
 */
export function useEnterAddsNext(
	clientId,
	name,
	emptyAttributes,
	text,
	insertBlocksAfter
) {
	const { canInsertBlockType, getBlockRootClientId, getBlockIndex } =
		useSelect( blockEditorStore );
	const { removeBlock, insertBlock } = useDispatch( blockEditorStore );

	return () => {
		const defaultName = getDefaultBlockName();
		const row = getBlockRootClientId( clientId );

		if ( canInsertBlockType( defaultName, row ) ) {
			if ( text ) {
				insertBlocksAfter( createBlock( defaultName ) );
			}
			return;
		}
		if ( text ) {
			insertBlocksAfter( createBlock( name, emptyAttributes ) );
			return;
		}
		const outside = row ? getBlockRootClientId( row ) : null;
		if ( row && canInsertBlockType( defaultName, outside ) ) {
			removeBlock( clientId, false );
			insertBlock(
				createBlock( defaultName ),
				getBlockIndex( row ) + 1,
				outside
			);
		}
	};
}
