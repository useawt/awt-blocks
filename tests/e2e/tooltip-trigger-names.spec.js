/**
 * The tooltip trigger is a button, carries its hint as a description, and
 * shows a dotted underline.
 *
 * It was a focusable span that a screen reader announced as plain text, with
 * no underline to show a hint was there (reported by the outside
 * accessibility review, 2026-10-20). Read from Chrome over CDP: Playwright's
 * own computation is not what a screen reader is told.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/tooltip {"triggerText":"Draft","description":"Saved, but not published yet."} /-->
`;

test( 'is a button that carries the hint', async ( { page, requestUtils } ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — tooltip trigger names',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );
	const cdp = await page.context().newCDPSession( page );
	const { root } = await cdp.send( 'DOM.getDocument', { depth: -1 } );
	const { nodeId } = await cdp.send( 'DOM.querySelector', {
		nodeId: root.nodeId,
		selector: 'main .cds--tooltip button',
	} );
	const { nodes } = await cdp.send( 'Accessibility.getPartialAXTree', {
		nodeId,
		fetchRelatives: false,
	} );
	expect( {
		role: nodes[ 0 ].role.value,
		name: nodes[ 0 ].name.value,
		description: nodes[ 0 ].description?.value,
	} ).toEqual( {
		role: 'button',
		name: 'Draft',
		description: 'Saved, but not published yet.',
	} );
	const underline = await page
		.locator( 'main .cds--tooltip button' )
		.evaluate( ( e ) => {
			const s = getComputedStyle( e );
			return `${ s.borderBottomStyle } ${ s.borderBottomWidth }`;
		} );
	expect( underline ).toBe( 'dotted 1px' );
} );
