/**
 * A button, tag, link, icon, modal opener or toggletip dropped straight on
 * the page arrives inside an Inline set.
 *
 * These blocks are inline boxes. The page's content column centres its
 * children with auto side margins, and auto margins do nothing on an inline
 * box, so a loose one sits at the page's padding edge instead of lining up
 * with the text: 176px left of it on a 1440px screen. It is invisible below
 * about 1090px, where the column already fills the page, which is why no gate
 * caught it (found on the sandbox, 2026-09-28). An Inline set is a block-level
 * row and takes its place in the column like any other block.
 *
 * Only a block that was just inserted is wrapped. A page that already has
 * loose ones is left exactly as it is: opening it must not change it. The
 * signal is core's `wasBlockJustInserted`, which Navigation uses for the same
 * job; loading or resetting the content clears it, inserting, pasting and
 * duplicating set it. Moving an existing block by drag does not set it, so a
 * block dragged out of a set stays where it was dropped.
 *
 * "Straight on the page" means a parent that centres its children: the top
 * level of a post or page, or a block with a constrained layout (a Group, the
 * Post Content block in a template). A flex row, a table cell, a Hero, a
 * Section and the header are all left alone. At the top level of a template,
 * template part or synced pattern nothing is wrapped: those are edited on
 * their own and placed in contexts this cannot see.
 *
 * The wrap is one step with the insert. It is marked as not persistent, so a
 * single undo takes away the block and its set together rather than
 * unwrapping it and leaving the author a loose block to undo again. The set
 * is created already holding copies of the blocks, so it never renders empty
 * and its two-button starter template never runs, and the copy of the block
 * the author was working on is selected again. Moving the originals into a
 * freshly inserted set does not work: the editor refuses the move, silently,
 * until the set has rendered once and said what it accepts.
 */

import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRegistry } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { cloneBlock, createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

import { INLINE_SET_CHILDREN } from './children';

const SET = 'awt/inline-set';

// Edited on their own: their top level is not a page's content column.
const STANDALONE_TYPES = [
	'wp_template',
	'wp_template_part',
	'wp_block',
	'wp_navigation',
];

/**
 * Does this parent centre its children the way a content column does?
 *
 * @param {Object} select   Registry select.
 * @param {string} parentId Parent client ID; empty for the top level.
 * @return {boolean} True when a loose inline block would sit outside it.
 */
function centresChildren( select, parentId ) {
	if ( ! parentId ) {
		const postType = select( 'core/editor' )?.getCurrentPostType?.();
		return !! postType && ! STANDALONE_TYPES.includes( postType );
	}
	const layout =
		select( blockEditorStore ).getBlockAttributes( parentId )?.layout;
	return layout?.type === 'constrained' || layout?.inherit === true;
}

/**
 * Wrap a just-inserted loose block, and any just-inserted neighbours of the
 * same kinds, in one Inline set.
 *
 * @param {Object} registry Data registry.
 * @param {string} clientId The block that mounted.
 */
function wrapIfLoose( registry, clientId ) {
	const select = registry.select;
	const editor = select( blockEditorStore );
	const isCandidate = ( id ) =>
		!! id &&
		INLINE_SET_CHILDREN.includes( editor.getBlockName( id ) ) &&
		editor.wasBlockJustInserted( id );

	if ( ! isCandidate( clientId ) ) {
		return;
	}
	const parentId = editor.getBlockRootClientId( clientId );
	if ( ! centresChildren( select, parentId ) ) {
		return;
	}

	// A paste of three tags is one row, not three. The first of a run of
	// just-inserted neighbours wraps them all; the rest see they already
	// have a set when their own turn comes.
	if ( isCandidate( editor.getPreviousBlockClientId( clientId ) ) ) {
		return;
	}
	const run = [ clientId ];
	let next = editor.getNextBlockClientId( clientId );
	while ( isCandidate( next ) ) {
		run.push( next );
		next = editor.getNextBlockClientId( next );
	}

	const {
		replaceBlocks,
		selectBlock,
		__unstableMarkNextChangeAsNotPersistent: markNotPersistent,
	} = registry.dispatch( blockEditorStore );
	const wasSelected = editor.getSelectedBlockClientId();
	const copies = run.map( ( id ) => cloneBlock( editor.getBlock( id ) ) );
	const set = createBlock( SET, {}, copies );
	registry.batch( () => {
		markNotPersistent();
		replaceBlocks( run, set );
		const index = run.indexOf( wasSelected );
		if ( index !== -1 ) {
			selectBlock( copies[ index ].clientId );
		}
	} );
}

const withWrapLoose = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const registry = useRegistry();
		const { name, clientId } = props;
		const applies = INLINE_SET_CHILDREN.includes( name );
		useEffect( () => {
			if ( applies ) {
				wrapIfLoose( registry, clientId );
			}
		}, [ applies, registry, clientId ] );
		return <BlockEdit { ...props } />;
	},
	'withWrapLoose'
);

addFilter( 'editor.BlockEdit', 'awt/inline-set/wrap-loose', withWrapLoose );
