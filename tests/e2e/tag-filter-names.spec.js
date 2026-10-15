/**
 * Each filter tag's dismiss button names the tag it removes.
 *
 * The button had no script, so pressing it did nothing, and with several
 * filters every one was named just "Dismiss" (reported by the outside
 * accessibility review, 2026-10-15). Names are read from Chrome over CDP:
 * Playwright's own name computation is not what a screen reader is told.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/tag {"text":"Region: us-east","filter":true} /-->
<!-- wp:awt/tag {"text":"Status: open","filter":true} /-->
<!-- wp:paragraph --><p><a href="#after">A link after them</a></p><!-- /wp:paragraph -->
`;

test( 'each button names the tag it removes', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — filter tag names',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );
	const cdp = await page.context().newCDPSession( page );
	const { root } = await cdp.send( 'DOM.getDocument', { depth: -1 } );
	const { nodeIds } = await cdp.send( 'DOM.querySelectorAll', {
		nodeId: root.nodeId,
		selector: 'main .cds--tag__close-icon',
	} );
	const names = [];
	for ( const nodeId of nodeIds ) {
		const { nodes } = await cdp.send( 'Accessibility.getPartialAXTree', {
			nodeId,
			fetchRelatives: false,
		} );
		names.push( `${ nodes[ 0 ].role.value }: ${ nodes[ 0 ].name.value }` );
	}
	expect( names ).toEqual( [
		'button: Dismiss Region: us-east',
		'button: Dismiss Status: open',
	] );
} );
