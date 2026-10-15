/**
 * A name set in the Accessibility panel reaches the element a screen reader
 * user meets: the focusable code area, the switch, the tab, the dialog.
 *
 * The panel wrote its name onto each block's outer element, which on many
 * blocks is a `<div>` or `<span>`. ARIA does not allow a name there, so it
 * was dropped, and the code area of a snippet labelled "Opening hours
 * endpoint example" was announced with no name at all (reported by the
 * outside accessibility review, 2026-10-14). The per-block routing is held by
 * tests/phpunit/test-panel-names.php; this checks what the browser exposes.
 */

const AxeBuilder = require( '@axe-core/playwright' ).default;
const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:html --><p id="gate-name-source">Delivery address</p><p id="gate-desc-source">We only use it for this order.</p><!-- /wp:html -->
<!-- wp:awt/code-snippet {"code":"curl https://example.org/api/hours","ariaLabel":"Opening hours endpoint example"} /-->
<!-- wp:awt/code-snippet {"variant":"single","code":"wp plugin activate awt-blocks","ariaLabel":"Activation command"} /-->
<!-- wp:awt/toggle {"label":"Alerts","name":"alerts","ariaLabel":"Email alerts"} /-->
<!-- wp:awt/checkbox {"label":"I agree","name":"agree","helperText":"Required to continue.","ariaDescribedby":"gate-desc-source"} /-->
<!-- wp:awt/text-input {"label":"Address","name":"address","ariaLabelledby":"gate-name-source"} /-->
<!-- wp:awt/dropdown {"label":"Pick a framework","ariaLabel":"Front-end framework","options":[{"label":"React","value":"react"},{"label":"Vue","value":"vue"}]} /-->
<!-- wp:awt/menu-button {"label":"Actions","ariaLabel":"Actions for this order","items":[{"label":"Edit","value":"edit"}]} /-->
<!-- wp:awt/tooltip {"description":"Save the file","triggerText":"Save","ariaLabel":"Save help"} /-->
<!-- wp:awt/tabs -->
<!-- wp:awt/tab {"label":"Overview","ariaLabel":"Product overview"} /-->
<!-- wp:awt/tab-panel {"ariaLabel":"Ignored panel name"} -->
<!-- wp:paragraph --><p>Overview panel.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tab-panel -->
<!-- /wp:awt/tabs -->
<!-- wp:awt/hero {"version":2,"ariaLabel":"Welcome"} -->
<!-- wp:heading --><h2 class="wp-block-heading">Hello</h2><!-- /wp:heading -->
<!-- /wp:awt/hero -->
<!-- wp:awt/tag {"text":"Beta","ariaLabel":"Ignored tag name"} /-->
<!-- wp:awt/modal-opener {"text":"Open the order","modalId":"gate-panel-modal"} /-->
<!-- wp:awt/modal {"id":"gate-panel-modal","heading":"Order","primaryAction":"Done","ariaLabel":"Order details"} -->
<!-- wp:paragraph --><p>Order body.</p><!-- /wp:paragraph -->
<!-- /wp:awt/modal -->
`;

test( 'panel names reach the element a screen reader meets', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — panel names',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );

	// The auditor's case: the code's scrolling box itself is named, the
	// <pre> of a multi-line snippet and the container of a single-line one.
	// It is a tab stop only while its code overflows, and these fit
	// (code-snippet-tab-stop.spec.js).
	const area = page.getByRole( 'region', {
		name: 'Opening hours endpoint example',
		exact: true,
	} );
	await expect( area ).toHaveJSProperty( 'tagName', 'PRE' );
	await expect(
		page.getByRole( 'region', { name: 'Activation command', exact: true } )
	).toHaveClass( /cds--snippet-container/ );

	await expect(
		page.getByRole( 'switch', { name: 'Email alerts', exact: true } )
	).toBeVisible();
	const agree = page.getByRole( 'checkbox', { name: 'I agree' } );
	await expect( agree ).toHaveAccessibleDescription(
		'Required to continue. We only use it for this order.'
	);
	await expect(
		page.getByRole( 'textbox', { name: 'Delivery address', exact: true } )
	).toBeVisible();
	// aria-label alone beats the field's own aria-labelledby.
	await expect(
		page.getByRole( 'combobox', {
			name: 'Front-end framework',
			exact: true,
		} )
	).toBeVisible();
	await expect(
		page.getByRole( 'button', {
			name: 'Actions for this order',
			exact: true,
		} )
	).toBeVisible();
	await expect(
		page.getByRole( 'tab', { name: 'Product overview', exact: true } )
	).toBeVisible();
	// A panel takes its tab's name; the panel's own field is not written.
	await expect(
		page.getByRole( 'tabpanel', { name: 'Product overview', exact: true } )
	).toBeVisible();
	await expect(
		page.locator( '[aria-label="Ignored panel name"]' )
	).toHaveCount( 0 );
	await expect(
		page.getByRole( 'group', { name: 'Welcome', exact: true } )
	).toBeVisible();
	// The tooltip's trigger is the element that takes focus.
	await expect(
		page.getByRole( 'group', { name: 'Save help', exact: true } )
	).toHaveAttribute( 'tabindex', '0' );
	await expect(
		page.locator( '[aria-label="Ignored tag name"]' )
	).toHaveCount( 0 );

	await page
		.getByRole( 'button', { name: 'Open the order', exact: true } )
		.click();
	await expect(
		page.getByRole( 'dialog', { name: 'Order details', exact: true } )
	).toBeVisible();
	await page.keyboard.press( 'Escape' );

	// No element is left with a name ARIA does not allow. The admin bar is
	// WordPress's own, and has its own role findings.
	const results = await new AxeBuilder( { page } )
		.exclude( '#wpadminbar' )
		.withRules( [
			'aria-prohibited-attr',
			'aria-allowed-attr',
			'aria-allowed-role',
			'presentation-role-conflict',
		] )
		.analyze();
	expect( results.violations.map( ( v ) => v.id ) ).toEqual( [] );
	// axe files a name on a generic element that has text inside as "needs
	// review", not as a violation, so that list is checked too.
	expect(
		results.incomplete
			.filter( ( r ) => r.id === 'aria-prohibited-attr' )
			.flatMap( ( r ) => r.nodes.map( ( n ) => n.html ) )
	).toEqual( [] );
} );
