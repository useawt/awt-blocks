/**
 * Copying shows Carbon's "Copied" tooltip and says it in a status message;
 * the button keeps its name.
 *
 * A copy used to swap the button's name to "Copied", which most screen
 * readers do not announce on the button you are on, and showed nothing but a
 * colour (reported by the outside accessibility review, 2026-10-15). Names
 * are read from Chrome over CDP.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/code-snippet {"code":"npm install","variant":"single","anchor":"single"} /-->
<!-- wp:awt/code-snippet {"code":"npm install\\\\nnpm run build","variant":"multi","anchor":"multi"} /-->
<!-- wp:paragraph --><p>Run <!-- /wp:paragraph -->
<!-- wp:awt/code-snippet {"code":"npm test","variant":"inline","anchor":"inline"} /-->
`;

test( 'a copy is confirmed on screen and to screen readers', async ( {
	page,
	context,
	requestUtils,
} ) => {
	await context.grantPermissions( [ 'clipboard-read', 'clipboard-write' ] );
	const created = await requestUtils.createPage( {
		title: 'gate — code snippet copy',
		content: CONTENT,
		status: 'publish',
	} );
	await page.setViewportSize( { width: 1280, height: 900 } );
	await page.goto( `/?page_id=${ created.id }` );
	const cdp = await page.context().newCDPSession( page );
	const nameOf = async ( id ) => {
		const { root } = await cdp.send( 'DOM.getDocument', { depth: -1 } );
		const { nodeId } = await cdp.send( 'DOM.querySelector', {
			nodeId: root.nodeId,
			selector: `#${ id } .cds--copy-btn`,
		} );
		const { nodes } = await cdp.send( 'Accessibility.getPartialAXTree', {
			nodeId,
			fetchRelatives: false,
		} );
		return nodes[ 0 ].name.value;
	};

	// The button stays where it always was in the block snippets.
	for ( const id of [ 'single', 'multi' ] ) {
		const offset = await page.locator( `#${ id }` ).evaluate( ( el ) => {
			const b = el
				.querySelector( '.cds--copy-btn' )
				.getBoundingClientRect();
			const r = el.getBoundingClientRect();
			return [
				Math.round( r.right - b.right ),
				Math.round( b.top - r.top ),
			];
		} );
		expect( offset ).toEqual( [ 8, 8 ] );
	}

	for ( const id of [ 'single', 'multi', 'inline' ] ) {
		const snippet = page.locator( `#${ id }` );
		const tooltip = snippet.locator( '.cds--popover-content' );
		const status = snippet.locator( '[role="status"]' );
		await expect( tooltip ).toBeHidden();
		await snippet.locator( '.cds--copy-btn' ).focus();
		await page.keyboard.press( 'Enter' );
		await expect( status ).toHaveText( 'Copied' );
		await expect( tooltip ).toBeVisible();
		await expect( tooltip ).toHaveText( 'Copied' );
		expect( await nameOf( id ) ).toBe( 'Copy' );
		// Gone after two seconds.
		await expect( status ).toHaveText( '', { timeout: 4000 } );
		await expect( tooltip ).toBeHidden();
	}
} );
