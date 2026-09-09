/**
 * A testimonial can point at where the quote came from.
 *
 * The block had no way to link to a source, so an author who needed one put a
 * link inside the quote — inside the `<blockquote>`, where it is part of what
 * the person supposedly said. The source link belongs in the attribution, and
 * that is where this puts it (asked for on a live site, 2026-09-09).
 *
 * Three properties, none of which the render snapshots can see: the editor
 * canvas shows the link the page shows (the two render from one set of
 * attributes and nothing else keeps them in step); the accessible name is the
 * label alone, with the trailing icon contributing nothing; and prose typed
 * into the URL field produces no link at all rather than a broken one.
 */

const { test, expect } = require( './fixtures' );

const LINKED = `<!-- wp:awt/testimonial {"quote":"It stopped being an afterthought.","authorName":"Maria S.","authorRole":"Design lead","href":"https://example.com/story","linkText":"Read the case study","target":"_blank","iconName":"launch"} /-->`;
const PROSE = `<!-- wp:awt/testimonial {"quote":"No link here.","authorName":"Maria S.","href":"ask marketing for the link"} /-->`;

test.describe( 'Testimonial source link', () => {
	test( 'the page renders it in the attribution, named by its label alone', async ( {
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Testimonial source link',
			content: LINKED,
			status: 'publish',
		} );
		await page.goto( `/?page_id=${ created.id }` );

		// Inside the figcaption, not the quote: a link in the blockquote reads
		// as part of what the person said.
		const link = page.locator( 'figcaption .awt-testimonial__source-link' );
		await expect( link ).toHaveAttribute(
			'href',
			'https://example.com/story'
		);
		await expect( link ).toHaveAttribute( 'target', '_blank' );
		// Not typed by the author — a new tab gets these on its own.
		await expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );

		await expect(
			page.getByRole( 'link', {
				name: 'Read the case study',
				exact: true,
			} )
		).toBeVisible();
		await expect( link.locator( 'svg' ) ).toHaveCount( 1 );
	} );

	test( 'the editor canvas shows the same link', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Testimonial source link in the editor',
			content: LINKED,
			status: 'publish',
		} );
		await admin.editPost( created.id );

		await expect(
			editor.canvas.locator( '.awt-testimonial__source-link' )
		).toHaveText( /Read the case study/ );
	} );

	test( 'prose in the URL field produces no link', async ( {
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Testimonial source link, prose',
			content: PROSE,
			status: 'publish',
		} );
		await page.goto( `/?page_id=${ created.id }` );

		await expect(
			page.locator( '.awt-testimonial__source-link' )
		).toHaveCount( 0 );
		await expect(
			page.locator( '.awt-testimonial__source-name' )
		).toHaveText( 'Maria S.' );
	} );
} );
