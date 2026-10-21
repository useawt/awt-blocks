/**
 * Close and More information buttons name what they act on.
 *
 * Every notification close button was "Close notification" and every
 * Toggletip button "More information", so a screen reader's list of buttons
 * showed identical entries (reported by the outside accessibility review,
 * 2026-10-21). Names are read from Chrome over CDP: Playwright's own name
 * computation is not what a screen reader is told.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/notification {"kind":"error","title":"Connection lost","subtitle":"Retrying."} /-->
<!-- wp:awt/notification {"kind":"success","title":"Changes saved"} /-->
<!-- wp:awt/toggletip {"label":"Storage limits","description":"Up to 50 GB."} /-->
<!-- wp:awt/toggletip {"label":"Backup schedule","description":"Backups run at 02:00."} /-->
<!-- wp:awt/toggletip {"label":"Retention","ariaLabel":"About retention","description":"Kept for 30 days."} /-->
`;

test( 'each button names its notification or label', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — button names say what',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );
	const cdp = await page.context().newCDPSession( page );
	const { root } = await cdp.send( 'DOM.getDocument', { depth: -1 } );
	const { nodeIds } = await cdp.send( 'DOM.querySelectorAll', {
		nodeId: root.nodeId,
		selector:
			'main [class*="notification__close-button"], main .cds--toggletip-button',
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
		'button: Close notification: Connection lost',
		'button: Close notification: Changes saved',
		'button: More information: Storage limits',
		'button: More information: Backup schedule',
		'button: About retention',
	] );
} );
