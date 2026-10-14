/**
 * A Hero opens in the editor with its text once.
 *
 * Opening an old (v1) Hero turns its text settings into blocks and puts its
 * buttons in an Inline set. A new Hero starts as a v1 one too, so it goes
 * through the same step. That step trusted the version in its props, and
 * React can run it twice for one mount (its development build does, on sites
 * with SCRIPT_DEBUG on): the second run wrapped the heading and paragraph the
 * first had just made, so a new Hero showed its text twice (found
 * 2026-10-14). This site runs React's production build, so it checks the
 * result of the step; the second run itself was reproduced, and the fix
 * checked, on the SCRIPT_DEBUG marketing site.
 */

const { test, expect } = require( './fixtures' );

const shape = ( page ) =>
	page.evaluate( () => {
		const store = window.wp.data.select( 'core/block-editor' );
		const show = ( b ) =>
			b.innerBlocks.length
				? `${ b.name }[${ b.innerBlocks.map( show ).join( ', ' ) }]`
				: b.name;
		const [ hero ] = store.getBlocksByName( 'awt/hero' );
		return {
			tree: show( store.getBlock( hero ) ),
			version: store.getBlockAttributes( hero ).version,
		};
	} );

test( 'a new Hero has one heading and one description', async ( {
	admin,
	editor,
	page,
} ) => {
	await admin.createNewPost();
	await editor.insertBlock( { name: 'awt/hero' } );
	await expect
		.poll( () => shape( page ) )
		.toEqual( {
			tree: 'awt/hero[core/heading, core/paragraph]',
			version: 2,
		} );
} );

test( 'an old Hero with buttons upgrades once', async ( {
	admin,
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — old hero',
		content: `<!-- wp:awt/hero {"eyebrow":"Stage 1","heading":"Build accessible block themes","description":"Keyboard-friendly out of the box."} -->
<!-- wp:awt/button {"text":"Get started","href":"#"} /-->
<!-- wp:awt/button {"text":"Read docs","kind":"tertiary","href":"#"} /-->
<!-- /wp:awt/hero -->`,
		status: 'draft',
	} );
	await admin.editPost( created.id );
	await expect
		.poll( () => shape( page ) )
		.toEqual( {
			tree: 'awt/hero[core/paragraph, core/heading, core/paragraph, awt/inline-set[awt/button, awt/button]]',
			version: 2,
		} );
} );
