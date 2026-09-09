/**
 * The containers a call to action lives in take a modal opener.
 *
 * On a real site a call to action is as often a button that opens a dialog as
 * one that follows a link, but the Inline set and the Hero both listed only
 * the link-following kind. The editor refused to move an opener in — no error,
 * the drop just did not take, which reads as the editor being broken rather
 * than as a rule (found on a live site, 2026-09-09).
 *
 * `canInsertBlockType` is what the editor itself asks before it allows a drag,
 * a paste, or an inserter click, so it is the property under test rather than
 * a stand-in for it. The second assertion in each case is the control: a list
 * still has to keep out what does not belong, or the first one passes for the
 * wrong reason.
 */

const { test, expect } = require( './fixtures' );

const CASES = [
	{
		block: 'awt/inline-set',
		selector: '.awt-inline-set',
		content: `<!-- wp:awt/inline-set --><!-- wp:awt/button {"label":"Primary action"} /--><!-- /wp:awt/inline-set -->`,
		// A row of buttons is not a place for body copy.
		refuses: 'core/paragraph',
	},
	{
		block: 'awt/hero',
		selector: '.awt-hero',
		content: `<!-- wp:awt/hero {"version":2} --><!-- wp:core/heading {"level":1} --><h1 class="wp-block-heading">Hero</h1><!-- /wp:core/heading --><!-- /wp:awt/hero -->`,
		// The hero body is prose and calls to action, not a nested layout.
		refuses: 'awt/feature-grid',
	},
];

// What the editor is asked, for the block the author is holding.
const CAN_INSERT = ( [ container, name ] ) => {
	const { select } = window.wp.data;
	const parent = select( 'core/block-editor' )
		.getBlocks()
		.find( ( b ) => b.name === container );
	return select( 'core/block-editor' ).canInsertBlockType(
		name,
		parent.clientId
	);
};

test.describe( 'Modal opener containers', () => {
	for ( const { block, selector, content, refuses } of CASES ) {
		test( `${ block } takes a modal opener and still refuses ${ refuses }`, async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const created = await requestUtils.createPage( {
				title: `Modal opener in ${ block }`,
				content,
				status: 'publish',
			} );

			await admin.editPost( created.id );
			await editor.canvas.locator( selector ).first().waitFor();

			expect(
				await page.evaluate( CAN_INSERT, [
					block,
					'awt/modal-opener',
				] ),
				`${ block } should accept a modal opener`
			).toBe( true );

			expect(
				await page.evaluate( CAN_INSERT, [ block, refuses ] ),
				`${ block } should still refuse ${ refuses }`
			).toBe( false );
		} );
	}
} );
