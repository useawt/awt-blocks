import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	cloneBlock,
	createBlock,
	getDefaultBlockName,
} from '@wordpress/blocks';

const ROW = 'awt/inline-set';

/**
 * Enter in a tag, button, link or modal opener: never a second line.
 *
 * These are one line of text, so Enter must not add a line break (the
 * RichText also takes `disableLineBreaks`). What it does instead depends on
 * where the cursor is:
 *
 * - At the end of the text: what Enter does at the end of a heading. A
 *   paragraph after the block where one is allowed, otherwise (an Inline
 *   set) another block of the same kind, empty, so tags can be typed one
 *   after another.
 * - In an empty one inside a row: leave the row. The empty block goes, and
 *   a paragraph follows the row, as Enter on an empty list item leaves a
 *   list.
 * - At the start of the text, in a row, when the block is not the first in
 *   it: break the row there. The block and everything after it move to a new
 *   row below. A link added after a button lands next to it, and without
 *   this the author had no way to put it on its own line (found 2026-10-12).
 * - Anywhere else, such as the middle of the text: nothing.
 *
 * WordPress's own `splitting` support was not used: where a paragraph is not
 * allowed it adds the block with its defaults, which brings back the word
 * "Tag" or "Button" the author would have to delete, and it splits the text
 * in the middle into two blocks.
 *
 * @param {string}   clientId          The block's client ID.
 * @param {string}   name              The block's name.
 * @param {Object}   emptyAttributes   What a new one starts with.
 * @param {string}   text              The block's current text.
 * @param {Function} insertBlocksAfter The edit component's prop.
 * @return {Object} Props for the block's RichText.
 */
export function useRowEnter(
	clientId,
	name,
	emptyAttributes,
	text,
	insertBlocksAfter
) {
	const registry = useRegistry();
	const { canInsertBlockType, getBlockRootClientId, getBlockIndex } =
		useSelect( blockEditorStore );
	const { removeBlock, insertBlock } = useDispatch( blockEditorStore );

	const onSplitAtEnd = () => {
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

	// RichText has no hook for Enter at the start, so listen for it. Its own
	// handler does nothing there, because of `disableLineBreaks`.
	const ref = useRefEffect(
		( node ) => {
			function breakRow( event ) {
				if (
					event.key !== 'Enter' ||
					event.shiftKey ||
					event.altKey ||
					event.metaKey ||
					event.ctrlKey
				) {
					return;
				}
				const editor = registry.select( blockEditorStore );
				const start = editor.getSelectionStart();
				const end = editor.getSelectionEnd();
				if (
					start.clientId !== clientId ||
					end.clientId !== clientId ||
					start.offset !== 0 ||
					end.offset !== 0 ||
					! editor.getBlockAttributes( clientId )?.text
				) {
					return;
				}
				const row = editor.getBlockRootClientId( clientId );
				if ( editor.getBlockName( row ) !== ROW ) {
					return;
				}
				const index = editor.getBlockOrder( row ).indexOf( clientId );
				if (
					index < 1 ||
					! editor.canInsertBlockType(
						ROW,
						editor.getBlockRootClientId( row )
					)
				) {
					return;
				}
				event.preventDefault();
				const rowBlock = editor.getBlock( row );

				// Copies, as the Inline set's wrap does: a set takes blocks
				// moved into it only after it has rendered once.
				const copy = ( blocks ) =>
					blocks.map( ( b ) => cloneBlock( b ) );
				const moved = copy( rowBlock.innerBlocks.slice( index ) );
				const head = cloneBlock(
					rowBlock,
					{},
					copy( rowBlock.innerBlocks.slice( 0, index ) )
				);
				const tail = createBlock(
					ROW,
					{ ...rowBlock.attributes, anchor: undefined },
					moved
				);
				const { replaceBlocks, selectBlock } =
					registry.dispatch( blockEditorStore );
				registry.batch( () => {
					replaceBlocks( row, [ head, tail ] );
					selectBlock( moved[ 0 ].clientId, 0 );
				} );
			}
			node.addEventListener( 'keydown', breakRow );
			return () => node.removeEventListener( 'keydown', breakRow );
		},
		[ clientId, registry ]
	);

	return { __unstableOnSplitAtEnd: onSplitAtEnd, ref };
}
