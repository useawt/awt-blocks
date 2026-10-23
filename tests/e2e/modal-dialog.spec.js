/**
 * The modal as a dialog: it covers the page, and it keeps the keyboard.
 *
 * Both of these were broken on a real site and invisible to every other gate.
 *
 *   - The block spacing system puts a margin on a block's outer element. This
 *     block's outer element is the overlay, so the overlay sat 16px down the
 *     screen and left a strip of the page showing above it.
 *   - The focus trap collected everything its selector matched, including a
 *     form's honeypot — a real input taken out of the tab order with
 *     tabindex="-1". Tab never reaches it, so the "wrap back to the first"
 *     that fires on the last element never fired, and focus walked out of the
 *     dialog into the page behind it.
 *
 * The honeypot below is the shape that caused the second one. It is not
 * decoration: without an untabbable control in the dialog, this passes on a
 * broken trap.
 */

const { test, expect } = require( './fixtures' );

const PAGE_CONTENT = `
<!-- wp:paragraph --><p><a href="#nowhere">A link on the page behind the dialog</a></p><!-- /wp:paragraph -->

<!-- wp:awt/modal-opener {"text":"Open the form dialog","modalId":"trap-modal"} /-->
<!-- wp:awt/modal {"id":"trap-modal","heading":"Ask for a demo","primaryAction":"","secondaryAction":""} -->
<!-- wp:awt/form {"ariaLabel":"Demo request"} -->
<!-- wp:awt/text-input {"label":"First name","name":"first_name"} /-->
<!-- wp:awt/text-input {"label":"Business email","name":"email_address","type":"email","required":true} /-->
<!-- wp:awt/button {"text":"Send","type":"submit"} /-->
<!-- wp:html --><input type="text" name="honeypot" tabindex="-1" autocomplete="off" aria-hidden="false" /><!-- /wp:html -->
<!-- /wp:awt/form -->
<!-- /wp:awt/modal -->

<!-- wp:paragraph --><p><a href="#elsewhere">Another link behind it</a></p><!-- /wp:paragraph -->

<!-- wp:html --><style>.awt-hostile-ancestor h2 { color: rgb(255, 0, 0) !important; }</style><!-- /wp:html -->

<!-- wp:awt/section {"themeScope":"dark","align":"full","className":"awt-hostile-ancestor"} -->
<!-- wp:awt/modal-opener {"text":"Open the dialog in the dark band","modalId":"band-modal"} /-->
<!-- wp:awt/modal {"id":"band-modal","heading":"In a dark band","primaryAction":"","secondaryAction":""} -->
<!-- wp:paragraph --><p>Body copy inside the dialog.</p><!-- /wp:paragraph -->
<!-- /wp:awt/modal -->
<!-- /wp:awt/section -->
`;

/**
 * An element's name and description as Chrome exposes them.
 *
 * @param {Object} cdp      CDP session.
 * @param {string} selector CSS selector.
 */
async function axNameAndDescription( cdp, selector ) {
	const { root } = await cdp.send( 'DOM.getDocument', { depth: -1 } );
	const { nodeId } = await cdp.send( 'DOM.querySelector', {
		nodeId: root.nodeId,
		selector,
	} );
	const { nodes } = await cdp.send( 'Accessibility.getPartialAXTree', {
		nodeId,
		fetchRelatives: false,
	} );
	return {
		name: nodes[ 0 ].name?.value ?? '',
		description: nodes[ 0 ].description?.value ?? '',
	};
}

test.describe( 'Modal dialog', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'Modal dialog',
			content: PAGE_CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	test( 'the overlay covers the whole viewport', async ( { page } ) => {
		await page.setViewportSize( { width: 1280, height: 900 } );
		await page.goto( `/?page_id=${ pageId }` );
		await page
			.getByRole( 'button', { name: 'Open the form dialog' } )
			.click();

		const overlay = page.locator( '#trap-modal' );
		await expect( overlay ).toHaveClass( /is-visible/ );

		const box = await overlay.boundingBox();
		const viewport = page.viewportSize();

		expect( Math.round( box.x ) ).toBe( 0 );
		expect( Math.round( box.y ) ).toBe( 0 );
		expect( Math.round( box.width ) ).toBe( viewport.width );
		expect( Math.round( box.height ) ).toBe( viewport.height );
	} );

	test( 'focus stays in the dialog, past a control Tab cannot reach', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ pageId }` );
		await page
			.getByRole( 'button', { name: 'Open the form dialog' } )
			.click();

		await expect( page.locator( '#trap-modal' ) ).toHaveClass(
			/is-visible/
		);

		// Enough passes to go round the dialog several times over.
		const visited = [];
		for ( let i = 0; i < 20; i++ ) {
			await page.keyboard.press( 'Tab' );
			const where = await page.evaluate( () => {
				const modal = document.getElementById( 'trap-modal' );
				const active = modal.ownerDocument.activeElement;
				return {
					inside: modal.contains( active ),
					name:
						active.getAttribute( 'aria-label' ) ||
						active.getAttribute( 'name' ) ||
						( active.textContent || '' ).trim().slice( 0, 20 ),
				};
			} );
			visited.push( where );
		}

		const escaped = visited.filter( ( v ) => ! v.inside );
		expect(
			escaped,
			`focus left the dialog: ${ JSON.stringify( escaped ) }`
		).toHaveLength( 0 );

		// And it really did move around rather than sticking on one control.
		expect(
			new Set( visited.map( ( v ) => v.name ) ).size
		).toBeGreaterThan( 1 );
	} );

	test( 'closing returns focus to the button that opened it', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ pageId }` );
		const opener = page.getByRole( 'button', {
			name: 'Open the form dialog',
		} );
		await opener.click();
		await page.locator( '#trap-modal .cds--modal-close-button' ).click();

		await expect( page.locator( '#trap-modal' ) ).not.toHaveClass(
			/is-visible/
		);
		await expect( opener ).toBeFocused();
	} );

	// A dialog whose content brings its own submit button leaves both button
	// labels empty. The footer bar used to print anyway, 64px of nothing under
	// the 48px Carbon keeps for it, and pushed a demo form's Send button below
	// the fold of a 768px-tall laptop screen. With no footer the content ends
	// the dialog, with the same padding under it as beside it.
	test( 'a dialog with no button labels ends with its content', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ pageId }` );

		for ( const [ opener, id ] of [
			[ 'Open the form dialog', 'trap-modal' ],
			[ 'Open the dialog in the dark band', 'band-modal' ],
		] ) {
			await page.getByText( opener, { exact: true } ).click();
			await expect( page.locator( `#${ id }` ) ).toHaveClass(
				/is-visible/
			);

			const measured = await page.evaluate( ( modalId ) => {
				const container = document.querySelector(
					`#${ modalId } .cds--modal-container`
				);
				const content = container.querySelector(
					'.cds--modal-content'
				);
				const styles = getComputedStyle( content );
				return {
					footers:
						container.querySelectorAll( '.cds--modal-footer' )
							.length,
					belowContent: Math.round(
						container.getBoundingClientRect().bottom -
							parseFloat(
								getComputedStyle( container ).borderBottomWidth
							) -
							content.getBoundingClientRect().bottom
					),
					paddingBelow: styles.paddingBlockEnd,
					paddingBeside: styles.paddingInlineStart,
				};
			}, id );

			expect( measured.footers ).toBe( 0 );
			expect( measured.belowContent ).toBe( 0 );
			expect( measured.paddingBelow ).toBe( measured.paddingBeside );

			await page.keyboard.press( 'Escape' );
			await expect( page.locator( `#${ id }` ) ).not.toHaveClass(
				/is-visible/
			);
		}
	} );

	// The page behind an open dialog is inert, so a screen reader cannot read
	// it either. `aria-modal` alone left it readable to VoiceOver in Safari,
	// whose reading cursor walked out of the dialog while Tab stayed in
	// (reported by the outside accessibility review, 2026-10-13).
	test( 'the page behind the open dialog is inert until it closes', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ pageId }` );
		const opener = page.getByRole( 'button', {
			name: 'Open the form dialog',
		} );
		const state = () =>
			page.evaluate( () => {
				const modal = document.getElementById( 'trap-modal' );
				const behind = [ ...document.querySelectorAll( 'a' ) ].find(
					( a ) =>
						a.textContent === 'A link on the page behind the dialog'
				);
				return {
					behind: !! behind.closest( '[inert]' ),
					dialog: !! modal.closest( '[inert]' ),
				};
			} );

		await opener.click();
		await expect( page.locator( '#trap-modal' ) ).toHaveClass(
			/is-visible/
		);
		expect( await state() ).toEqual( { behind: true, dialog: false } );

		await page.keyboard.press( 'Escape' );
		await expect( page.locator( '#trap-modal' ) ).not.toHaveClass(
			/is-visible/
		);
		expect( await state() ).toEqual( { behind: false, dialog: false } );
		// The page is back before focus returns to the opener, which is in it.
		await expect( opener ).toBeFocused();
	} );

	// The page is inert while the dialog is open, and Chrome takes no name or
	// description from inert text, so a Labelled by or Described by pointing
	// out of the dialog left it with no name at all. Read from Chrome's own
	// tree: Playwright's role queries compute names themselves and find these
	// anyway, which is how the gap was first missed.
	test( 'a name and description from outside the dialog are read while it is open', async ( {
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Modal named from outside',
			content: `
<!-- wp:paragraph {"anchor":"gate-outside-name"} --><p id="gate-outside-name">Name from the page</p><!-- /wp:paragraph -->
<!-- wp:paragraph {"anchor":"gate-outside-desc"} --><p id="gate-outside-desc">Description from the page</p><!-- /wp:paragraph -->
<!-- wp:awt/modal-opener {"text":"Open the named dialog","modalId":"outside-modal"} /-->
<!-- wp:awt/modal {"id":"outside-modal","heading":"Heading","primaryAction":"Done","ariaLabelledby":"gate-outside-name","ariaDescribedby":"gate-outside-desc"} -->
<!-- wp:paragraph --><p>Body.</p><!-- /wp:paragraph -->
<!-- /wp:awt/modal -->`,
			status: 'publish',
		} );
		await page.goto( `/?page_id=${ created.id }` );
		const cdp = await page.context().newCDPSession( page );

		await page
			.getByRole( 'button', { name: 'Open the named dialog' } )
			.click();
		await expect( page.locator( '#outside-modal' ) ).toHaveClass(
			/is-visible/
		);
		expect(
			await axNameAndDescription( cdp, '#outside-modal [role="dialog"]' )
		).toEqual( {
			name: 'Name from the page',
			description: 'Description from the page',
		} );

		await page.keyboard.press( 'Escape' );
		await expect( page.locator( '#outside-modal' ) ).not.toHaveClass(
			/is-visible/
		);
		// The page's own references are back, and the copies gone.
		const dialog = page.locator( '#outside-modal [role="dialog"]' );
		await expect( dialog ).toHaveAttribute(
			'aria-labelledby',
			'gate-outside-name'
		);
		await expect( dialog ).toHaveAttribute(
			'aria-describedby',
			'gate-outside-desc'
		);
		await expect( page.locator( '[id$="--awt-modal-copy"]' ) ).toHaveCount(
			0
		);
	} );

	// A modal covers the page, so it takes the page's colour — not the colour
	// of the Section it happens to be written inside. A call to action moved
	// into a dark footer band opened both of its forms in dark on a light
	// site, because a theme scope declares its tokens for everything within.
	test( 'a dialog inside a dark band takes the colour of the page', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ pageId }` );

		const tokensOf = ( id ) =>
			page.evaluate( ( modalId ) => {
				const modal = document.getElementById( modalId );
				const styles = getComputedStyle( modal );
				return {
					layer: styles.getPropertyValue( '--cds-layer' ).trim(),
					text: styles
						.getPropertyValue( '--cds-text-primary' )
						.trim(),
				};
			}, id );

		await page
			.getByText( 'Open the dialog in the dark band', { exact: true } )
			.click();
		await expect( page.locator( '#band-modal' ) ).toHaveClass(
			/is-visible/
		);
		const inBand = await tokensOf( 'band-modal' );

		await page.keyboard.press( 'Escape' );
		await page.getByText( 'Open the form dialog', { exact: true } ).click();
		await expect( page.locator( '#trap-modal' ) ).toHaveClass(
			/is-visible/
		);
		const plain = await tokensOf( 'trap-modal' );

		expect( inBand ).toEqual( plain );
	} );

	// Tokens are only half of it. A rule that names an ancestor reaches the
	// dialog too — the site this was found on paints every heading in its
	// footer white, which on the dialog's own surface is invisible, and gives
	// the footer a white focus ring, which on that surface cannot be seen at
	// all. `!important` here stands in for all of them: nothing but leaving
	// the subtree can beat it.
	test( 'a rule on an ancestor does not reach the open dialog', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ pageId }` );

		const headingColour = () =>
			page.evaluate( () =>
				getComputedStyle(
					document.querySelector(
						'#band-modal .cds--modal-header__heading'
					)
				).color.replace( /\s/g, '' )
			);

		// Closed, it is still inside the section and the rule does apply.
		expect( await headingColour() ).toBe( 'rgb(255,0,0)' );

		await page
			.getByText( 'Open the dialog in the dark band', { exact: true } )
			.click();
		await expect( page.locator( '#band-modal' ) ).toHaveClass(
			/is-visible/
		);
		expect( await headingColour() ).not.toBe( 'rgb(255,0,0)' );

		// And it goes back where the page put it.
		await page.keyboard.press( 'Escape' );
		await expect( page.locator( '#band-modal' ) ).not.toHaveClass(
			/is-visible/
		);
		expect( await headingColour() ).toBe( 'rgb(255,0,0)' );
	} );
} );
