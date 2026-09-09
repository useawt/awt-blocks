/**
 * An inline set takes a modal opener.
 *
 * The inline set is the block for a row of calls to action, and on a real site
 * a call to action is as often a button that opens a dialog as one that
 * follows a link. The opener was missing from the allowed list, so the editor
 * refused to move one in — no error, the drop just did not take, which reads
 * as the editor being broken rather than as a rule (found on a live site,
 * 2026-09-09).
 *
 * `canInsertBlockType` is what the editor itself asks before it allows a drag,
 * a paste, or an inserter click, so it is the property under test rather than
 * a stand-in for it. The second assertion is the control: the list still has
 * to keep out what does not belong in a row of buttons, or the first one
 * passes for the wrong reason.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `<!-- wp:awt/inline-set --><!-- wp:awt/button {"label":"Primary action"} /--><!-- /wp:awt/inline-set -->`;

// What the editor is asked, for the block the author is holding.
const CAN_INSERT = ( name ) => {
	const { select } = window.wp.data;
	const set = select( 'core/block-editor' )
		.getBlocks()
		.find( ( b ) => b.name === 'awt/inline-set' );
	return select( 'core/block-editor' ).canInsertBlockType(
		name,
		set.clientId
	);
};

test.describe( 'Inline set children', () => {
	test( 'a modal opener can go in, a paragraph still cannot', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Inline set children',
			content: CONTENT,
			status: 'publish',
		} );

		await admin.editPost( created.id );
		await editor.canvas.locator( '.awt-inline-set' ).first().waitFor();

		expect(
			await page.evaluate( CAN_INSERT, 'awt/modal-opener' ),
			'the inline set should accept a modal opener'
		).toBe( true );

		expect(
			await page.evaluate( CAN_INSERT, 'core/paragraph' ),
			'the inline set should still refuse a paragraph'
		).toBe( false );
	} );
} );
