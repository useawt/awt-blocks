/**
 * A cut-off tag label can still be read in full.
 *
 * A label too long for the tag ends in an ellipsis, as in Carbon, and nothing
 * showed the rest: the WCAG text spacing overrides turned "Accessible toilet,
 * ground floor" into "Accessible toilet, ground …" (reported by the outside
 * accessibility review, 2026-10-14). Carbon puts the full text in the label's
 * `title` and, when the label is cut off, wraps it in a definition tooltip, a
 * button that shows the full text. AWT now does both, on plain tags; link and
 * dismissible tags get the `title`.
 */

const { test, expect } = require( './fixtures' );

const LONG = 'Accessible toilet, ground floor, with a baby changing room';
const SPACED = 'Accessible toilet, ground floor';

const CONTENT = `<!-- wp:awt/inline-set -->
<!-- wp:awt/tag {"text":"Step-free"} /-->
<!-- wp:awt/tag {"text":"${ LONG }"} /-->
<!-- wp:awt/tag {"text":"${ SPACED }"} /-->
<!-- wp:awt/tag {"text":"${ LONG }","href":"/visit"} /-->
<!-- /wp:awt/inline-set -->`;

// The WCAG 1.4.12 text spacing overrides, as the Text Spacing bookmarklet
// applies them.
const TEXT_SPACING = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important;
	word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`;

test.describe( 'Tag labels', () => {
	let url;
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'gate — tag labels',
			content: CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
		url = `/?page_id=${ pageId }`;
	} );

	const tag = ( page, text ) =>
		page
			.locator( '.wp-block-awt-tag' )
			.filter( { has: page.locator( `[title="${ text }"]` ) } )
			.first();

	test( 'a cut-off label opens its full text from the keyboard', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1280, height: 800 } );
		await page.goto( url );

		// Every label has its full text as a title.
		for ( const text of [ 'Step-free', LONG ] ) {
			await expect(
				page.locator( `.cds--tag__label[title="${ text }"]` ).first()
			).toBeAttached();
		}

		// A short tag is left alone.
		await expect(
			tag( page, 'Step-free' ).locator( 'button' )
		).toHaveCount( 0 );

		// The long one is a button named by its full text, which is what a
		// screen reader reads; the cut is only visual.
		const button = tag( page, LONG ).locator(
			'button.cds--definition-term'
		);
		await expect( button ).toHaveCount( 1 );
		await expect( button ).toHaveAccessibleName( LONG );
		// The text is in the popover's content, which Carbon shows only while
		// the popover is open; the popover element itself is an empty frame.
		const tip = page.locator(
			`#${ await button.getAttribute(
				'aria-controls'
			) } .cds--definition-tooltip`
		);
		await expect( tip ).toBeHidden();

		await button.focus();
		await page.keyboard.press( 'Enter' );
		await expect( button ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( tip ).toBeVisible();
		await expect( tip ).toHaveText( LONG );
		const box = await tip.boundingBox();
		expect( box.x ).toBeGreaterThanOrEqual( 0 );
		expect( box.x + box.width ).toBeLessThanOrEqual( 1280 );

		await page.keyboard.press( 'Escape' );
		await expect( button ).toHaveAttribute( 'aria-expanded', 'false' );
		await expect( tip ).toBeHidden();

		// Space opens it too, and moving focus away closes it.
		await page.keyboard.press( 'Space' );
		await expect( tip ).toBeVisible();
		await page.keyboard.press( 'Tab' );
		await expect( tip ).toBeHidden();

		// A link tag keeps its title and gets no button of its own.
		const link = page.getByRole( 'link', { name: LONG } );
		await expect( link ).toHaveCount( 1 );
		await expect( link.locator( 'button' ) ).toHaveCount( 0 );
	} );

	test( 'text spacing that cuts a label off gives it the tooltip', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1280, height: 800 } );
		await page.goto( url );
		const spaced = tag( page, SPACED );
		await expect( spaced.locator( 'button' ) ).toHaveCount( 0 );

		await page.addStyleTag( { content: TEXT_SPACING } );
		await expect(
			spaced.locator( 'button.cds--definition-term' )
		).toHaveCount( 1 );
		await spaced.locator( 'button' ).click();
		await expect( spaced.locator( '.cds--definition-tooltip' ) ).toHaveText(
			SPACED
		);
		await expect(
			spaced.locator( '.cds--definition-tooltip' )
		).toBeVisible();
	} );

	// The editor writes `white-space: pre-wrap` on its text fields as an inline
	// style, so a long label wrapped onto several lines in the editor while
	// the page kept it on one (found by the owner, 2026-10-14).
	test( 'a long label stays on one line in the editor, as on the page', async ( {
		page,
		admin,
		editor,
	} ) => {
		const sizes = ( tags ) =>
			tags.evaluateAll( ( els ) =>
				els.map( ( el ) => {
					const r = el.getBoundingClientRect();
					return [ Math.round( r.width ), Math.round( r.height ) ];
				} )
			);
		await page.goto( url );
		const onPage = await sizes( page.locator( '.wp-block-awt-tag' ) );

		await admin.editPost( pageId );
		const tags = editor.canvas.locator( '.wp-block-awt-tag' );
		await expect( tags ).toHaveCount( onPage.length );
		await expect( tags.nth( 1 ).locator( '.cds--tag__label' ) ).toHaveCSS(
			'white-space',
			'nowrap'
		);
		expect( await sizes( tags ) ).toEqual( onPage );
	} );
} );
