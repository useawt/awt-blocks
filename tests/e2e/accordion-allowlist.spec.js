/**
 * An accordion takes a FAQ question as well as a plain item.
 *
 * `awt/faq-item` renders the same <li> as `awt/accordion-item` when an
 * accordion is above it, and the theme's own FAQ pattern ships that nesting —
 * but the accordion's allowed list named only the plain item, so the editor
 * refused to insert, duplicate or drag a question into one. The blocks
 * already in the page still rendered and edited, which is what made it read
 * as the editor misbehaving rather than as a rule (found on a live site,
 * 2026-09-10).
 *
 * `canInsertBlockType` is the question the editor asks itself before allowing
 * any of those three, so it is the property under test. The second assertion
 * is the control: the list still has to keep out what does not belong, or the
 * first one passes for the wrong reason.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `<!-- wp:awt/accordion --><!-- wp:awt/accordion-item {"title":"First section"} --><!-- wp:paragraph --><p>Body.</p><!-- /wp:paragraph --><!-- /wp:awt/accordion-item --><!-- /wp:awt/accordion -->`;

// What the editor is asked, for the block the author is holding.
const CAN_INSERT = ( name ) => {
	const { select } = window.wp.data;
	const parent = select( 'core/block-editor' )
		.getBlocks()
		.find( ( b ) => b.name === 'awt/accordion' );
	return select( 'core/block-editor' ).canInsertBlockType(
		name,
		parent.clientId
	);
};

test.describe( 'Accordion allowed blocks', () => {
	test( 'awt/accordion takes a FAQ question and still refuses a paragraph', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'FAQ question in an accordion',
			content: CONTENT,
			status: 'publish',
		} );

		await admin.editPost( created.id );
		await editor.canvas.locator( '.cds--accordion' ).first().waitFor();

		expect(
			await page.evaluate( CAN_INSERT, 'awt/faq-item' ),
			'an accordion should accept a FAQ question'
		).toBe( true );

		// Rows of a list, not a place for loose body copy.
		expect(
			await page.evaluate( CAN_INSERT, 'core/paragraph' ),
			'an accordion should still refuse a paragraph'
		).toBe( false );
	} );
} );
