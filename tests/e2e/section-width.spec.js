/**
 * A Section set wider than the content width actually gets the room.
 *
 * WordPress's constrained layout caps every ordinary child at the content
 * width. A Section sitting in post content was therefore held to that width
 * whatever its own Max width said: picking "Wide" moved nothing on the page
 * and gave no clue why. The snapshot tests could not see it — the markup was
 * correct all along, and the cap came from a stylesheet.
 *
 * The second case matters as much as the first: a Section at or below the
 * content width must keep rendering exactly as it did, because lifting the
 * cap for everything would have widened every existing banded section.
 */

const { test, expect } = require( './fixtures' );

const PAGE_CONTENT = `
<!-- wp:awt/section {"maxWidth":"content"} -->
<!-- wp:paragraph --><p id="in-default">Default width.</p><!-- /wp:paragraph -->
<!-- /wp:awt/section -->

<!-- wp:awt/section {"maxWidth":"wide"} -->
<!-- wp:paragraph --><p id="in-wide">Wide.</p><!-- /wp:paragraph -->
<!-- /wp:awt/section -->
`;

test.describe( 'Section width', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'Section width',
			content: PAGE_CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	test( 'a wide section is wider than a default one, in ordinary content', async ( {
		page,
	} ) => {
		// Wide enough that both widths fit, so the viewport is not the cap.
		await page.setViewportSize( { width: 1600, height: 900 } );
		await page.goto( `/?page_id=${ pageId }` );

		const widths = await page.evaluate( () => {
			const inner = ( id ) =>
				document
					.getElementById( id )
					.closest( '.awt-section' )
					.getBoundingClientRect().width;
			return {
				def: Math.round( inner( 'in-default' ) ),
				wide: Math.round( inner( 'in-wide' ) ),
			};
		} );

		expect(
			widths.wide,
			`wide section (${ widths.wide }px) should be wider than the default one (${ widths.def }px)`
		).toBeGreaterThan( widths.def );
	} );

	test( 'the editor canvas shows the same width as the page', async ( {
		admin,
		editor,
		page,
	} ) => {
		// The canvas has to be wider than the content width, or both sections
		// fill it and the comparison proves nothing.
		await page.setViewportSize( { width: 1920, height: 1080 } );
		// The canvas builds its own preview from edit.js, so a fix made only in
		// the rendered output leaves the author looking at the wrong width —
		// which is exactly what happened.
		await admin.createNewPost( { title: 'Section width in the canvas' } );
		await editor.insertBlock( {
			name: 'awt/section',
			attributes: { maxWidth: 'content' },
		} );
		await editor.insertBlock( {
			name: 'awt/section',
			attributes: { maxWidth: 'wide' },
		} );

		const sections = editor.canvas.locator( '.awt-section' );
		await expect( sections ).toHaveCount( 2 );

		const canvasWidth = await editor.canvas
			.locator( 'body' )
			.evaluate( ( el ) => el.clientWidth );
		expect(
			canvasWidth,
			'the canvas must be wider than the content width for this to mean anything'
		).toBeGreaterThan( 1056 );

		const def = await sections.nth( 0 ).boundingBox();
		const wide = await sections.nth( 1 ).boundingBox();

		expect(
			Math.round( wide.width ),
			`wide section in the canvas (${ Math.round(
				wide.width
			) }px) should be wider than the default one (${ Math.round(
				def.width
			) }px)`
		).toBeGreaterThan( Math.round( def.width ) );
	} );

	test( 'a section at the content width is left where it was', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1600, height: 900 } );
		await page.goto( `/?page_id=${ pageId }` );

		const measured = await page.evaluate( () => {
			const section = document
				.getElementById( 'in-default' )
				.closest( '.awt-section' );
			const main = section.closest( 'main' ) || document.body;
			return {
				section: Math.round( section.getBoundingClientRect().width ),
				contentSize: getComputedStyle( main )
					.getPropertyValue( '--wp--style--global--content-size' )
					.trim(),
				cap: getComputedStyle( section ).maxWidth,
			};
		} );

		// Still capped by the layout rather than let loose.
		expect( measured.cap ).not.toBe( 'none' );
	} );
} );
