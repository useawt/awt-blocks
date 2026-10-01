/**
 * Every AWT block has its own icon.
 *
 * The icons come from Carbon (src/shared/block-icon.js, imported in each
 * block's index.js). Without one, WordPress draws its default box, so every
 * AWT block looked the same in the inserter, and the AWT List could not be
 * told from WordPress's own List in "Transform to". A new block needs an
 * icon no other block uses.
 */

const { test, expect } = require( './fixtures' );

test( 'every AWT block has its own Carbon icon', async ( { admin, page } ) => {
	await admin.createNewPost();
	await page.waitForFunction( () =>
		window.wp?.blocks?.getBlockType( 'awt/list' )
	);

	const icons = await page.evaluate( () => {
		const draw = ( node ) =>
			! node || typeof node !== 'object'
				? ''
				: [
						node.type,
						node.props?.d,
						node.props?.cx,
						node.props?.cy,
						node.props?.r,
				  ]
						.concat(
							[].concat( node.props?.children ?? [] ).map( draw )
						)
						.join( ' ' );
		return window.wp.blocks
			.getBlockTypes()
			.filter( ( b ) => b.name.startsWith( 'awt/' ) )
			.map( ( b ) => ( {
				name: b.name,
				svg:
					b.icon?.src?.type === 'svg' &&
					b.icon.src.props.viewBox === '0 0 32 32',
				drawing: draw( b.icon?.src ),
			} ) );
	} );

	expect( icons.length ).toBeGreaterThan( 50 );
	expect( icons.filter( ( i ) => ! i.svg ).map( ( i ) => i.name ) ).toEqual(
		[]
	);

	const byDrawing = {};
	for ( const i of icons ) {
		( byDrawing[ i.drawing ] ??= [] ).push( i.name );
	}
	expect(
		Object.values( byDrawing ).filter( ( names ) => names.length > 1 )
	).toEqual( [] );
} );
