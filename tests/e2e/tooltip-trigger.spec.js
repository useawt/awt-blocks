/**
 * The tooltip trigger opens on hover, click, focus and tap, Enter toggles it
 * and Escape closes it.
 *
 * It was a focusable span with no reliable way to open it by touch (reported
 * by the outside accessibility review, 2026-10-20); tooltip-trigger-names
 * checks what screen readers are told. Also runs in WebKit, where a click
 * does not focus a button.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/tooltip {"triggerText":"Draft","description":"Saved, but not published yet."} /-->
<!-- wp:paragraph --><p>After the tooltip.</p><!-- /wp:paragraph -->
`;

const hidden = ( page ) =>
	page.locator( 'main [role="tooltip"]' ).evaluate( ( e ) => e.hidden );

test.describe( 'Tooltip trigger', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'gate — tooltip trigger',
			content: CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	test( 'opens on hover, click and focus, Enter toggles, Escape closes', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ pageId }` );
		const trigger = page.locator( 'main .cds--tooltip button' );
		await trigger.hover();
		await expect.poll( () => hidden( page ) ).toBe( false );
		// Hover has shown it; a click keeps it open.
		await trigger.click();
		expect( await hidden( page ) ).toBe( false );
		await page.mouse.move( 0, 0 );
		await expect.poll( () => hidden( page ) ).toBe( true );
		// Chrome focuses a clicked button; WebKit does not.
		await trigger.blur();

		await trigger.focus();
		expect( await hidden( page ) ).toBe( false );
		await expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
		await page.keyboard.press( 'Escape' );
		expect( await hidden( page ) ).toBe( true );
		await expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
		await page.keyboard.press( 'Enter' );
		expect( await hidden( page ) ).toBe( false );
		await page.keyboard.press( 'Enter' );
		expect( await hidden( page ) ).toBe( true );
	} );

	test( 'a tap toggles it', async ( { browser, baseURL } ) => {
		const context = await browser.newContext( {
			hasTouch: true,
			isMobile: true,
			viewport: { width: 390, height: 844 },
			baseURL,
		} );
		const page = await context.newPage();
		await page.goto( `/?page_id=${ pageId }` );
		const trigger = page.locator( 'main .cds--tooltip button' );
		await trigger.tap();
		await expect.poll( () => hidden( page ) ).toBe( false );
		await trigger.tap();
		await expect.poll( () => hidden( page ) ).toBe( true );
		await context.close();
	} );
} );
