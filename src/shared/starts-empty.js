/**
 * A block added from the inserter starts with its text empty, so the author
 * sees a hint and types, instead of first deleting a word like "Button".
 *
 * This is the block's default inserter variation: the inserter, the /
 * shortcut and the + buttons all create the block with these attributes. The
 * attributes' own defaults in block.json stay as they were, because blocks
 * saved without the attribute rely on them, and changing a default would
 * have emptied those blocks. `createBlock()` still gives the defaults.
 *
 * The variation has no title of its own, so the inserter shows the block's
 * translated title.
 *
 * @param {Object} attributes The text attributes to start empty.
 * @return {Array} The block's `variations` setting.
 */
export function startsEmpty( attributes ) {
	return [
		{
			name: 'starts-empty',
			isDefault: true,
			scope: [ 'inserter' ],
			attributes,
		},
	];
}
