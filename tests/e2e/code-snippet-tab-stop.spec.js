/**
 * A code snippet is a tab stop only while its code scrolls.
 *
 * Every single- and multi-line snippet was a tab stop with no role or name,
 * even when its code fit and there was nothing to scroll (reported by the
 * outside accessibility review, 2026-10-15). Now the box is a stop, a region
 * named "Code snippet" or the author's name, only while it overflows, and it
 * follows the width: a snippet that fits at 1280px scrolls at 320px. Names
 * are read from Chrome over CDP.
 */

const { test, expect } = require( './fixtures' );

const LONG = 'x'.repeat( 300 );
// Fits at 1280px, scrolls at 320px.
const CLONE = 'git clone https://github.com/useawt/awt-blocks.git';
const CONTENT = `
<!-- wp:paragraph --><p><a href="#before">A link before</a></p><!-- /wp:paragraph -->
<!-- wp:awt/code-snippet {"code":"${ CLONE }","variant":"single","anchor":"short-single"} /-->
<!-- wp:awt/code-snippet {"code":"${ CLONE }\\nnpm run build","variant":"multi","anchor":"short-multi"} /-->
<!-- wp:awt/code-snippet {"code":"${ LONG }","variant":"single","anchor":"long-single"} /-->
<!-- wp:awt/code-snippet {"code":"${ CLONE }","variant":"single","anchor":"named","ariaLabel":"Install command"} /-->
`;

// For each snippet: whether its box is a tab stop, and Chrome's role and name.
async function boxes( page, cdp ) {
	const { root } = await cdp.send( 'DOM.getDocument', { depth: -1 } );
	const out = {};
	for ( const id of [
		'short-single',
		'short-multi',
		'long-single',
		'named',
	] ) {
		const selector = `#${ id } .cds--snippet-container${
			id === 'short-multi' ? ' pre' : ''
		}`;
		const { nodeId } = await cdp.send( 'DOM.querySelector', {
			nodeId: root.nodeId,
			selector,
		} );
		const { nodes } = await cdp.send( 'Accessibility.getPartialAXTree', {
			nodeId,
			fetchRelatives: false,
		} );
		const stop = await page
			.locator( selector )
			.evaluate( ( el ) => el.getAttribute( 'tabindex' ) === '0' );
		const role = nodes[ 0 ].role?.value;
		out[ id ] = `${ stop ? 'stop' : 'no stop' }, ${
			role === 'region'
				? `region "${ nodes[ 0 ].name?.value }"`
				: 'not a region'
		}`;
	}
	return out;
}

test( 'snippets are tab stops only while they scroll', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — code snippet tab stop',
		content: CONTENT,
		status: 'publish',
	} );
	await page.setViewportSize( { width: 1280, height: 900 } );
	await page.goto( `/?page_id=${ created.id }` );
	const cdp = await page.context().newCDPSession( page );

	await expect( page.locator( '#long-single [tabindex="0"]' ) ).toHaveCount(
		1
	);
	await expect
		.poll( () => boxes( page, cdp ) )
		.toEqual( {
			'short-single': 'no stop, not a region',
			'short-multi': 'no stop, not a region',
			'long-single': 'stop, region "Code snippet"',
			named: 'no stop, region "Install command"',
		} );

	// From the link before, Tab goes straight to the first Copy button.
	await page.getByRole( 'link', { name: 'A link before' } ).focus();
	await page.keyboard.press( 'Tab' );
	await expect(
		page.locator( '#short-single .cds--snippet-button' )
	).toBeFocused();

	// At 320px the clone command no longer fits: every box scrolls and is a
	// stop.
	await page.setViewportSize( { width: 320, height: 900 } );
	await expect
		.poll( () => boxes( page, cdp ) )
		.toEqual( {
			'short-single': 'stop, region "Code snippet"',
			'short-multi': 'stop, region "Code snippet"',
			'long-single': 'stop, region "Code snippet"',
			named: 'stop, region "Install command"',
		} );
} );
