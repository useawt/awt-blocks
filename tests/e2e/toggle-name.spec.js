/**
 * A Toggle's name is its label, and stays the same when it is switched.
 *
 * The On/Off text sat inside the label without `aria-hidden`, so it was read
 * as part of the name: "Tell me about events Yes, switch, on". The name
 * changed on every toggle, and VoiceOver could read the old text first
 * (reported by the outside accessibility review, 2026-10-14). Carbon hides
 * that text from assistive technology; the switch reports its own state.
 */

const { test, expect } = require( './fixtures' );

test( 'the switch keeps its label as its name when toggled', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — toggle name',
		content:
			'<!-- wp:awt/toggle {"label":"Tell me about events","name":"events","labelA":"No","labelB":"Yes"} /-->',
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );

	const toggle = page.getByRole( 'switch', {
		name: 'Tell me about events',
		exact: true,
	} );
	await expect( toggle ).not.toBeChecked();
	await expect( page.getByText( 'No', { exact: true } ) ).toBeVisible();

	await toggle.focus();
	await page.keyboard.press( 'Space' );
	await expect( toggle ).toBeChecked();
	// Same name, and the visible text still changes for sighted users.
	await expect( toggle ).toHaveAccessibleName( 'Tell me about events' );
	await expect( page.getByText( 'Yes', { exact: true } ) ).toBeVisible();
} );
