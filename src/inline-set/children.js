/**
 * The blocks an Inline set holds.
 *
 * Shared by the set's own editor (what it accepts) and by wrap-loose.js
 * (what gets a set of its own when dropped straight on the page), so the two
 * cannot drift apart.
 *
 * The modal opener is on the list because it renders as a button: a call to
 * action that opens a dialog instead of following a link, and a row of calls
 * to action is what this block is for. The toggletip is on it because it is
 * the same kind of small inline control, and without a place in a set it had
 * nowhere to sit but loose on the page, where it lands outside the content
 * column (found on the sandbox, 2026-09-28).
 */
export const INLINE_SET_CHILDREN = [
	'awt/button',
	'awt/modal-opener',
	'awt/link',
	'awt/tag',
	'awt/icon',
	'awt/toggletip',
];
