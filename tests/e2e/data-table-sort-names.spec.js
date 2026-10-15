/**
 * A sortable column keeps its plain name while it sorts.
 *
 * The sort button was named "Sort by Name", and after a sort "Sort by Name,
 * currently ascending. Click to sort descending.". A header's name is what a
 * screen reader reads before every cell in its column, so every cell carried
 * it (reported by the outside accessibility review, 2026-10-15). The state
 * lives in `aria-sort` and the live region. Names are read from Chrome over
 * CDP: Playwright's own name computation is not what a screen reader is told.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `<!-- wp:awt/data-table {"headers":[{"key":"name","text":"Name"},{"key":"status","text":"Status"}],"rows":[{"name":"Initech","status":"Degraded"},{"name":"Acme","status":"Healthy"}],"sortable":true,"caption":"Services"} /-->`;

test( 'sort headers keep their plain names while sorting', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — data table sort names',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );
	const cdp = await page.context().newCDPSession( page );

	// Chrome's role and name for each header and its sort button.
	const headers = async () => {
		const { root } = await cdp.send( 'DOM.getDocument', { depth: -1 } );
		const out = [];
		for ( const selector of [ 'main thead th', 'main thead th button' ] ) {
			const { nodeIds } = await cdp.send( 'DOM.querySelectorAll', {
				nodeId: root.nodeId,
				selector,
			} );
			for ( const nodeId of nodeIds ) {
				const { nodes } = await cdp.send(
					'Accessibility.getPartialAXTree',
					{ nodeId, fetchRelatives: false }
				);
				out.push(
					`${ nodes[ 0 ].role.value }: ${ nodes[ 0 ].name.value }`
				);
			}
		}
		return out;
	};
	const plain = [
		'columnheader: Name',
		'columnheader: Status',
		'button: Name',
		'button: Status',
	];
	const name = page.locator( 'main thead th' ).first();
	const announce = page.locator( 'main .awt-data-table__sort-announce' );

	expect( await headers() ).toEqual( plain );

	await name.locator( 'button' ).click();
	await expect( name ).toHaveAttribute( 'aria-sort', 'ascending' );
	await expect( announce ).toHaveText( 'Table sorted by Name ascending.' );
	expect( await headers() ).toEqual( plain );

	await name.locator( 'button' ).click();
	await expect( name ).toHaveAttribute( 'aria-sort', 'descending' );
	await expect( announce ).toHaveText( 'Table sorted by Name descending.' );
	expect( await headers() ).toEqual( plain );
} );
