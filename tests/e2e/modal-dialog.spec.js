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

<!-- wp:awt/section {"themeScope":"dark","align":"full"} -->
<!-- wp:awt/modal-opener {"text":"Open the dialog in the dark band","modalId":"band-modal"} /-->
<!-- wp:awt/modal {"id":"band-modal","heading":"In a dark band","primaryAction":"","secondaryAction":""} -->
<!-- wp:paragraph --><p>Body copy inside the dialog.</p><!-- /wp:paragraph -->
<!-- /wp:awt/modal -->
<!-- /wp:awt/section -->
`;

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
} );
