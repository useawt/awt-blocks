/**
 * The automatic breadcrumb lines up with what is under it — on a phone.
 *
 * The trail sits above `<main>` and copies `<main>`'s side padding, so it
 * lines up with the first thing below it. On the default page template that is
 * the page title, which takes that same padding. On `page-no-title` there is
 * no title, `<main>` is deliberately `padding: 0`, and the gutter comes from
 * the site's root padding one level in — so copying the zero put the trail
 * against the edge of the screen while the content kept its inset
 * (awt-theme#1, 2026-09-20).
 *
 * **Every width in this file is below the content size on purpose.** Above it
 * the `margin-inline: auto` that centres the trail supplies an inset of its
 * own and both templates look right, which is why the defect survived: it is
 * invisible at the width a desktop browser opens at. A wide check is included
 * only to hold the centring that masked it.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `<!-- wp:paragraph --><p>Content that keeps its gutter.</p><!-- /wp:paragraph -->`;

// Where the trail starts, and where the first thing below it starts. On a
// titled page that is the title; on a title-less one it is the content.
const OFFSETS = () => {
	const left = ( el ) =>
		el ? Math.round( el.getBoundingClientRect().left ) : null;
	const trail = document.querySelector(
		'.awt-breadcrumb-region .cds--breadcrumb'
	);
	const title = document.querySelector(
		'#main-content .wp-block-post-title'
	);
	const first = document.querySelector( '#main-content p' );
	return {
		trail: left( trail ),
		reference: left( title || first ),
	};
};

test.describe( 'Automatic breadcrumb alignment', () => {
	let parent;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'Breadcrumb alignment parent',
			content: CONTENT,
			status: 'publish',
		} );
		parent = created.id;
	} );

	for ( const template of [ 'page-no-title', '' ] ) {
		const name = template || 'the default template';

		// 375 is a phone; 1055 is the last width before the centring rule
		// starts supplying an inset of its own.
		for ( const width of [ 375, 1055 ] ) {
			test( `lines up on ${ name } at ${ width }px`, async ( {
				page,
				requestUtils,
			} ) => {
				const created = await requestUtils.createPage( {
					title: `Alignment ${ name } ${ width }`,
					content: CONTENT,
					status: 'publish',
					parent,
					template,
				} );

				await page.setViewportSize( { width, height: 800 } );
				await page.goto( `/?page_id=${ created.id }` );
				await page.locator( '.awt-breadcrumb-region' ).waitFor();

				const seen = await page.evaluate( OFFSETS );
				expect(
					seen.reference,
					'the page needs something under the trail to line up with'
				).not.toBeNull();
				expect( seen.trail ).toBe( seen.reference );
			} );
		}
	}

	test( 'the centring rule still insets the trail on a wide screen', async ( {
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Alignment wide',
			content: CONTENT,
			status: 'publish',
			parent,
			template: 'page-no-title',
		} );

		await page.setViewportSize( { width: 1440, height: 800 } );
		await page.goto( `/?page_id=${ created.id }` );
		await page.locator( '.awt-breadcrumb-region' ).waitFor();

		const seen = await page.evaluate( OFFSETS );
		expect( seen.trail ).toBe( seen.reference );
		// Well past the root padding: this inset is the centring, not the fix.
		expect( seen.trail ).toBeGreaterThan( 60 );
	} );
} );
