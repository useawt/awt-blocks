/**
 * Blocks that take a link let you search for the page.
 *
 * Every linking block used to ask for the address in a plain text box, so an
 * author had to leave the editor, find the page, copy its URL and paste it
 * back — for 47 internal links on one site (reported 2026-09-18). They now
 * share `LinkField`, which wraps the page search WordPress already uses for
 * its own links.
 *
 * What is saved is unchanged: the same `href`, holding the same address. The
 * test asserts both halves of that — the search is there, and choosing a page
 * puts that page's address into the block.
 */

const { test, expect } = require( './fixtures' );

const SEARCH = '.block-editor-link-control input';

const CASES = [
	{
		block: 'awt/button',
		panel: 'Link',
		content: '<!-- wp:awt/button {"text":"Go"} /-->',
	},
	{
		block: 'awt/link',
		panel: 'Link',
		content: '<!-- wp:awt/link {"text":"Read more"} /-->',
	},
	{
		// Only a clickable tile takes a link; the others have nowhere to put one.
		block: 'awt/tile',
		panel: 'Link',
		content:
			'<!-- wp:awt/tile {"variant":"clickable","heading":"A tile"} /-->',
	},
];

async function selectAndOpen( page, editor, block, panel ) {
	await page.evaluate( ( name ) => {
		const { select, dispatch } = window.wp.data;
		const find = ( blocks ) => {
			for ( const b of blocks ) {
				if ( b.name === name ) {
					return b;
				}
				const inner = find( b.innerBlocks || [] );
				if ( inner ) {
					return inner;
				}
			}
			return null;
		};
		dispatch( 'core/block-editor' ).selectBlock(
			find( select( 'core/block-editor' ).getBlocks() ).clientId
		);
	}, block );
	const toggle = page
		.locator( '.block-editor-block-inspector button', {
			hasText: new RegExp( `^${ panel }$` ),
		} )
		.first();
	if ( await toggle.count() ) {
		const expanded = await toggle.getAttribute( 'aria-expanded' );
		if ( expanded === 'false' ) {
			await toggle.click();
		}
	}
}

test.describe( 'Link picker', () => {
	for ( const { block, panel, content } of CASES ) {
		test( `${ block } offers a page search`, async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const created = await requestUtils.createPage( {
				title: `Link picker in ${ block }`,
				content,
				status: 'publish',
			} );
			await admin.editPost( created.id );
			await editor.canvas.locator( 'body .wp-block' ).first().waitFor();
			await selectAndOpen( page, editor, block, panel );

			await expect(
				page.locator( SEARCH ).first(),
				`${ block } should offer a page search`
			).toBeVisible();
		} );
	}

	test( 'a link already set can be changed', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const created = await requestUtils.createPage( {
			title: 'Link picker change',
			content:
				'<!-- wp:awt/button {"text":"Go","href":"https://example.com/old"} /-->',
			status: 'publish',
		} );

		await admin.editPost( created.id );
		await editor.canvas.locator( 'body .wp-block' ).first().waitFor();
		await selectAndOpen( page, editor, 'awt/button', 'Link' );

		// With an address set the control shows it, rather than a search box.
		// The way back has to be there, or an existing link can be read and
		// never changed — which is what an earlier version of this shipped as.
		const edit = page.locator( 'button[aria-label="Edit link"]' ).first();
		await expect(
			edit,
			'an address already set should offer a way to change it'
		).toBeVisible();
		// The icon inside the button is what sits under the pointer.
		await edit.click( { force: true } );

		const search = page.locator( SEARCH ).first();
		await expect( search ).toBeVisible();
		await expect(
			search,
			'the search box should start from the current address'
		).toHaveValue( 'https://example.com/old' );
	} );

	test( 'choosing a page fills in its address', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const target = await requestUtils.createPage( {
			title: 'Findable target page',
			content:
				'<!-- wp:paragraph --><p>Target.</p><!-- /wp:paragraph -->',
			status: 'publish',
		} );
		const created = await requestUtils.createPage( {
			title: 'Link picker choice',
			content: '<!-- wp:awt/button {"text":"Go"} /-->',
			status: 'publish',
		} );

		await admin.editPost( created.id );
		await editor.canvas.locator( 'body .wp-block' ).first().waitFor();
		await selectAndOpen( page, editor, 'awt/button', 'Link' );

		await page.locator( SEARCH ).first().fill( 'Findable target' );
		const option = page.locator( '[role="option"]' ).first();
		await option.waitFor();
		await option.click();

		await expect
			.poll( async () =>
				page.evaluate( () => {
					const { select } = window.wp.data;
					return select( 'core/block-editor' )
						.getBlocks()
						.find( ( b ) => b.name === 'awt/button' ).attributes
						.href;
				} )
			)
			.toBe( target.link );
	} );
} );
