/**
 * Indent and outdent for list items — the nesting controls.
 *
 * A nested list in AWT is an `awt/list` sitting inside an `awt/list-item`,
 * which is the same shape WordPress's own list uses and the same shape
 * `render.php` already emits. What was missing was any way to make one by
 * hand: the Data panel's HTML and Markdown importers could build nested
 * lists, but an author writing a list in the editor could not.
 *
 * The behaviour here is WordPress's, step for step, because a list is one of
 * the few blocks people already know the keys for — Tab to indent, Shift+Tab
 * to go back, and the same two toolbar buttons in the same place. Anything
 * subtly different would be worse than nothing. The one AWT difference is the
 * list this creates: it inherits the parent's type and text size and is
 * marked as a sub-list, so Carbon styles its markers as one.
 *
 * WordPress's own implementation is not importable (the hooks are private to
 * the block library), so this mirrors it against the shipped source rather
 * than guessing at it.
 */

import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import {
	store as blockEditorStore,
	BlockControls,
} from '@wordpress/block-editor';
import { createBlock, cloneBlock } from '@wordpress/blocks';
import { ToolbarButton } from '@wordpress/components';
import { useRefEffect } from '@wordpress/compose';
import { SPACE, TAB, displayShortcut } from '@wordpress/keycodes';
import { __, isRTL } from '@wordpress/i18n';
import { SVG, Path } from '@wordpress/primitives';

// WordPress's own indent/outdent icons (GPL, @wordpress/icons). Inlined rather
// than imported: that package is bundled, not shared, so importing it would
// add its whole build to this plugin's editor script for two glyphs.
const icon = ( d ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
	>
		<Path d={ d } />
	</SVG>
);
const formatIndent = icon(
	'M4 7.2v1.5h16V7.2H4zm8 8.6h8v-1.5h-8v1.5zm-8-3.5l3 3-3 3 1 1 4-4-4-4-1 1z'
);
const formatOutdent = icon(
	'M4 7.2v1.5h16V7.2H4zm8 8.6h8v-1.5h-8v1.5zm-4-4.6l-4 4 4 4 1-1-3-3 3-3-1-1z'
);
const formatIndentRTL = icon(
	'M20 5.5H4V4H20V5.5ZM12 12.5H4V11H12V12.5ZM20 20V18.5H4V20H20ZM20.0303 9.03033L17.0607 12L20.0303 14.9697L18.9697 16.0303L15.4697 12.5303L14.9393 12L15.4697 11.4697L18.9697 7.96967L20.0303 9.03033Z'
);
const formatOutdentRTL = icon(
	'M20 5.5H4V4H20V5.5ZM12 12.5H4V11H12V12.5ZM20 20V18.5H4V20H20ZM15.4697 14.9697L18.4393 12L15.4697 9.03033L16.5303 7.96967L20.0303 11.4697L20.5607 12L20.0303 12.5303L16.5303 16.0303L15.4697 14.9697Z'
);

/**
 * The attributes a sub-list inherits from the list it is created inside.
 *
 * `type` and `isExpressive` are inherited because a sub-list that numbered
 * differently, or sat at a different text size, would read as a mistake.
 * `nested` is the AWT part: it adds Carbon's `cds--list--nested`, which is
 * what makes the sub-list's markers and indentation correct.
 *
 * @param {Object} parentAttributes Attributes of the list being nested into.
 * @return {Object} Attributes for the new sub-list.
 */
function subListAttributes( parentAttributes ) {
	return {
		type: parentAttributes?.type ?? 'unordered',
		isExpressive: !! parentAttributes?.isExpressive,
		nested: true,
	};
}

/**
 * Move a list item (or the whole multi-selection) one level deeper.
 *
 * The item joins the previous sibling's sub-list, and the previous sibling
 * gains one if it has none. Returns false when there is no previous sibling
 * to nest under, so the caller can leave the key press alone.
 *
 * @param {string} clientId The list item's client ID.
 * @return {Function} Callback that performs the indent and reports whether it did.
 */
export function useIndentListItem( clientId ) {
	const { replaceBlocks, selectionChange, multiSelect } =
		useDispatch( blockEditorStore );
	const {
		getBlock,
		getBlockAttributes,
		getBlockRootClientId,
		getPreviousBlockClientId,
		getSelectionStart,
		getSelectionEnd,
		hasMultiSelection,
		getMultiSelectedBlockClientIds,
	} = useSelect( blockEditorStore );

	return useCallback( () => {
		const previousSiblingId = getPreviousBlockClientId( clientId );
		if ( ! previousSiblingId ) {
			return false;
		}

		const isMultiSelection = hasMultiSelection();
		const clientIds = isMultiSelection
			? getMultiSelectedBlockClientIds()
			: [ clientId ];
		const movedBlocks = clientIds.map( ( id ) =>
			cloneBlock( getBlock( id ) )
		);

		const newListItem = cloneBlock( getBlock( previousSiblingId ) );
		if ( ! newListItem.innerBlocks?.length ) {
			newListItem.innerBlocks = [
				createBlock(
					'awt/list',
					subListAttributes(
						getBlockAttributes( getBlockRootClientId( clientId ) )
					)
				),
			];
		}
		const subList =
			newListItem.innerBlocks[ newListItem.innerBlocks.length - 1 ];
		subList.innerBlocks = [ ...subList.innerBlocks, ...movedBlocks ];

		// Read the caret before the replace, and put it back afterwards — the
		// clones carry new client IDs, so the selection does not survive on
		// its own and the author would lose their place mid-sentence.
		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();

		replaceBlocks( [ previousSiblingId, ...clientIds ], [ newListItem ] );

		if ( isMultiSelection ) {
			multiSelect(
				movedBlocks[ 0 ].clientId,
				movedBlocks[ movedBlocks.length - 1 ].clientId
			);
		} else {
			selectionChange(
				movedBlocks[ 0 ].clientId,
				selectionEnd.attributeKey,
				selectionEnd.clientId === selectionStart.clientId
					? selectionStart.offset
					: selectionEnd.offset,
				selectionEnd.offset
			);
		}
		return true;
	}, [ clientId ] ); // eslint-disable-line react-hooks/exhaustive-deps -- store selectors are stable.
}

/**
 * Move a list item (or the whole multi-selection) one level out.
 *
 * Items that followed it in the sub-list follow it out too, as its own
 * sub-list — otherwise they would jump a level and change meaning. An emptied
 * sub-list is removed. Returns false when the item is already at the top
 * level.
 *
 * @return {Function} Callback that performs the outdent and reports whether it did.
 */
export function useOutdentListItem() {
	const registry = useRegistry();
	const { moveBlocksToPosition, removeBlock, removeBlocks, insertBlock } =
		useDispatch( blockEditorStore );
	const {
		getBlock,
		getBlockIndex,
		getBlockName,
		getBlockOrder,
		getBlockRootClientId,
		getSelectedBlockClientIds,
	} = useSelect( blockEditorStore );

	/**
	 * The list item this item's list sits inside, if there is one.
	 *
	 * @param {string} id A list item's client ID.
	 * @return {string|undefined} The parent list item's client ID, or undefined at the top level.
	 */
	function parentListItemId( id ) {
		const parent = getBlockRootClientId( getBlockRootClientId( id ) );
		if ( ! parent || getBlockName( parent ) !== 'awt/list-item' ) {
			return undefined;
		}
		return parent;
	}

	return useCallback( ( ids ) => {
		let clientIds = ids ?? getSelectedBlockClientIds();
		if ( ! Array.isArray( clientIds ) ) {
			clientIds = [ clientIds ];
		}
		if ( ! clientIds.length ) {
			return false;
		}

		const firstClientId = clientIds[ 0 ];
		if ( getBlockName( firstClientId ) !== 'awt/list-item' ) {
			return false;
		}
		const parentItemId = parentListItemId( firstClientId );
		if ( ! parentItemId ) {
			return false;
		}

		const parentListId = getBlockRootClientId( firstClientId );
		const lastClientId = clientIds[ clientIds.length - 1 ];
		const following = getBlockOrder( parentListId ).slice(
			getBlockIndex( lastClientId ) + 1
		);

		registry.batch( () => {
			if ( following.length ) {
				// Whatever came after stays underneath the item being moved,
				// so its own depth does not change.
				const ownSubListId = getBlockOrder( firstClientId )[ 0 ];
				if ( ownSubListId ) {
					moveBlocksToPosition(
						following,
						parentListId,
						ownSubListId
					);
				} else {
					// Clone the list they were already in, so type, text size
					// and the sub-list styling come with them.
					const subList = cloneBlock(
						getBlock( parentListId ),
						{},
						following.map( ( id ) => getBlock( id ) )
					);
					removeBlocks( following, false );
					insertBlock( subList, 0, firstClientId, false );
				}
			}

			moveBlocksToPosition(
				clientIds,
				parentListId,
				getBlockRootClientId( parentItemId ),
				getBlockIndex( parentItemId ) + 1
			);

			if ( ! getBlockOrder( parentListId ).length ) {
				removeBlock( parentListId, false );
			}
		} );
		return true;
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps -- store selectors and dispatchers are stable.
}

/**
 * Tab and Space at the start of an item, the way the editor's own list works.
 *
 * Both keys only act when the caret sits at the very start of the item and no
 * modifier other than Shift is held, so they keep working as Tab and Space
 * everywhere else in the text.
 *
 * @param {string} clientId The list item's client ID.
 * @return {Function} Ref callback for the item's editable element.
 */
export function useIndentKeys( clientId ) {
	const { getSelectionStart, getSelectionEnd, getBlockIndex } =
		useSelect( blockEditorStore );
	const indentListItem = useIndentListItem( clientId );
	const outdentListItem = useOutdentListItem();

	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				// The listener runs in the capture phase, so a key pressed in
				// a NESTED item reaches this item first. Only handle what was
				// typed into this item's own editable element.
				if ( event.target !== element ) {
					return;
				}
				const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;
				if (
					event.defaultPrevented ||
					( keyCode !== SPACE && keyCode !== TAB ) ||
					altKey ||
					metaKey ||
					ctrlKey
				) {
					return;
				}
				const selectionStart = getSelectionStart();
				const selectionEnd = getSelectionEnd();
				if (
					selectionStart.offset !== 0 ||
					selectionEnd.offset !== 0
				) {
					return;
				}
				if ( shiftKey ) {
					if ( keyCode === TAB && outdentListItem() ) {
						event.preventDefault();
					}
				} else if (
					getBlockIndex( clientId ) !== 0 &&
					indentListItem()
				) {
					event.preventDefault();
				}
			}

			element.addEventListener( 'keydown', onKeyDown, true );
			return () => {
				element.removeEventListener( 'keydown', onKeyDown, true );
			};
		},
		[ clientId, indentListItem, outdentListItem ]
	);
}

/**
 * The two toolbar buttons, in the editor's standard block-controls group.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId The list item's client ID.
 * @return {Element} The Outdent and Indent buttons.
 */
export function IndentControls( { clientId } ) {
	const indentListItem = useIndentListItem( clientId );
	const outdentListItem = useOutdentListItem();
	const { canIndent, canOutdent } = useSelect(
		( select ) => {
			const { getBlockIndex, getBlockName, getBlockRootClientId } =
				select( blockEditorStore );
			return {
				canIndent: getBlockIndex( clientId ) > 0,
				canOutdent:
					getBlockName(
						getBlockRootClientId( getBlockRootClientId( clientId ) )
					) === 'awt/list-item',
			};
		},
		[ clientId ]
	);

	return (
		<BlockControls group="block">
			<ToolbarButton
				icon={ isRTL() ? formatOutdentRTL : formatOutdent }
				title={ __( 'Outdent', 'awt-blocks' ) }
				shortcut={ displayShortcut.shift( 'Tab' ) }
				description={ __(
					'Move this item out one level',
					'awt-blocks'
				) }
				disabled={ ! canOutdent }
				onClick={ () => outdentListItem() }
			/>
			<ToolbarButton
				icon={ isRTL() ? formatIndentRTL : formatIndent }
				title={ __( 'Indent', 'awt-blocks' ) }
				shortcut="Tab"
				description={ __(
					'Make this item part of the one above',
					'awt-blocks'
				) }
				disabled={ ! canIndent }
				onClick={ () => indentListItem() }
			/>
		</BlockControls>
	);
}
