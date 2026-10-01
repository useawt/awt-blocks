/**
 * "Transform to" between AWT blocks and WordPress's own blocks.
 *
 * List ↔ List, Table ↔ Data table and Code ↔ Code snippet, both ways. Each
 * test starts from the WordPress block, converts it to the AWT block, checks
 * nothing the AWT block can hold was lost, saves and reads the page, then
 * converts back. The transforms live in src/<block>/transforms.js.
 */

const { test, expect } = require( './fixtures' );

/**
 * The editor's blocks as plain data: rich-text attributes become strings.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<Array>} Block tree.
 */
async function blockTree( page ) {
	return page.evaluate( () => {
		const plain = ( block ) => ( {
			name: block.name,
			attributes: JSON.parse(
				JSON.stringify( block.attributes, ( key, value ) =>
					value &&
					typeof value === 'object' &&
					typeof value.toHTMLString === 'function'
						? value.toHTMLString()
						: value
				)
			),
			innerBlocks: block.innerBlocks.map( plain ),
		} );
		return window.wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.map( plain );
	} );
}

/**
 * Which blocks the first block can be transformed to, as "Transform to" lists them.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<string[]>} Block names.
 */
async function transformTargets( page ) {
	return page.evaluate( () => {
		const [ block ] = window.wp.data
			.select( 'core/block-editor' )
			.getBlocks();
		return window.wp.blocks
			.getPossibleBlockTransformations( [ block ] )
			.map( ( t ) => t.name );
	} );
}

/**
 * Transform the first block, the way the "Transform to" menu does.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          name Block to transform to.
 */
async function transformTo( page, name ) {
	await page.evaluate( ( target ) => {
		const { select, dispatch } = window.wp.data;
		const [ block ] = select( 'core/block-editor' ).getBlocks();
		const result = window.wp.blocks.switchToBlockType( block, target );
		if ( ! result ) {
			throw new Error(
				`No transform from ${ block.name } to ${ target }`
			);
		}
		dispatch( 'core/block-editor' ).replaceBlocks( block.clientId, result );
	}, name );
}

/**
 * Save the post and return its front-end HTML.
 *
 * @param {Object}                          editor Editor utilities.
 * @param {import('@playwright/test').Page} page
 * @return {Promise<string>} The rendered page.
 */
async function savedPage( editor, page ) {
	await editor.publishPost();
	const link = await page.evaluate( () =>
		window.wp.data.select( 'core/editor' ).getPermalink()
	);
	const response = await page.request.get( link );
	expect( response.status() ).toBe( 200 );
	return response.text();
}

test.describe( 'Block transforms', () => {
	test( 'List: WordPress list to AWT List and back, nesting kept', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'Transform list' } );
		await editor.insertBlock( {
			name: 'core/list',
			attributes: { ordered: true, anchor: 'steps' },
			innerBlocks: [
				{
					name: 'core/list-item',
					attributes: { content: '<strong>One</strong>' },
					innerBlocks: [
						{
							name: 'core/list',
							innerBlocks: [
								{
									name: 'core/list-item',
									attributes: { content: 'One A' },
								},
							],
						},
					],
				},
				{
					name: 'core/list-item',
					attributes: { content: '<a href="/x">Two</a>' },
				},
			],
		} );

		expect( await transformTargets( page ) ).toContain( 'awt/list' );
		await transformTo( page, 'awt/list' );

		const [ list ] = await blockTree( page );
		expect( list.name ).toBe( 'awt/list' );
		expect( list.attributes ).toMatchObject( {
			type: 'ordered',
			nested: false,
			anchor: 'steps',
		} );
		expect( list.innerBlocks.map( ( i ) => i.attributes.content ) ).toEqual(
			[ '<strong>One</strong>', '<a href="/x">Two</a>' ]
		);
		const sub = list.innerBlocks[ 0 ].innerBlocks[ 0 ];
		expect( sub.name ).toBe( 'awt/list' );
		expect( sub.attributes ).toMatchObject( {
			type: 'unordered',
			nested: true,
		} );
		expect( sub.innerBlocks[ 0 ].attributes.content ).toBe( 'One A' );

		const html = await savedPage( editor, page );
		expect( html ).toMatch(
			/<ol[^>]*class="[^"]*cds--list--ordered[^>]*id="steps"/
		);
		expect( html ).toMatch( /<ul[^>]*class="[^"]*cds--list--nested/ );
		expect( html ).toContain( '<strong>One</strong>' );

		await transformTo( page, 'core/list' );
		const [ back ] = await blockTree( page );
		expect( back.name ).toBe( 'core/list' );
		expect( back.attributes ).toMatchObject( {
			ordered: true,
			anchor: 'steps',
		} );
		expect( back.innerBlocks.map( ( i ) => i.attributes.content ) ).toEqual(
			[ '<strong>One</strong>', '<a href="/x">Two</a>' ]
		);
		const backSub = back.innerBlocks[ 0 ].innerBlocks[ 0 ];
		expect( backSub.name ).toBe( 'core/list' );
		expect( backSub.attributes.ordered ).toBe( false );
		expect( backSub.innerBlocks[ 0 ].attributes.content ).toBe( 'One A' );
	} );

	test( 'Table: WordPress table to Data table and back, no cell lost', async ( {
		admin,
		editor,
		page,
	} ) => {
		const cells = ( tag, ...contents ) => ( {
			cells: contents.map( ( content ) => ( { content, tag } ) ),
		} );
		await admin.createNewPost( { title: 'Transform table' } );
		await editor.insertBlock( {
			name: 'core/table',
			attributes: {
				className: 'is-style-stripes prices',
				caption: 'Fruit &amp; prices',
				head: [ cells( 'th', 'Fruit', 'Price', 'Price' ) ],
				body: [
					cells( 'td', '<em>Apple</em>', '1', '2' ),
					cells( 'td', 'Pear', '3', '4', 'Extra' ),
				],
				foot: [ cells( 'td', 'Total', '4', '6' ) ],
			},
		} );

		expect( await transformTargets( page ) ).toContain( 'awt/data-table' );
		await transformTo( page, 'awt/data-table' );

		const [ table ] = await blockTree( page );
		expect( table.name ).toBe( 'awt/data-table' );
		// Repeated headings get distinct keys; the fourth column, which only
		// one row has, gets a heading of its own instead of being dropped.
		expect( table.attributes.headers ).toEqual( [
			{ key: 'fruit', text: 'Fruit' },
			{ key: 'price', text: 'Price' },
			{ key: 'price-2', text: 'Price' },
			{ key: 'column-4', text: 'Column 4' },
		] );
		expect( table.attributes.rows ).toEqual( [
			{
				fruit: '<em>Apple</em>',
				price: '1',
				'price-2': '2',
				'column-4': '',
			},
			{ fruit: 'Pear', price: '3', 'price-2': '4', 'column-4': 'Extra' },
			{ fruit: 'Total', price: '4', 'price-2': '6', 'column-4': '' },
		] );
		expect( table.attributes ).toMatchObject( {
			zebra: true,
			className: 'prices',
			caption: 'Fruit & prices',
		} );

		const html = await savedPage( editor, page );
		expect( html ).toContain( 'cds--data-table--zebra' );
		expect( html ).toContain( '<caption' );
		expect( html ).toContain( 'Fruit &amp; prices' );
		expect( html ).toContain( '<em>Apple</em>' );
		expect( html ).toContain( 'Extra' );

		await transformTo( page, 'core/table' );
		const [ back ] = await blockTree( page );
		expect( back.name ).toBe( 'core/table' );
		expect( back.attributes.className ).toBe( 'prices is-style-stripes' );
		expect( back.attributes.caption ).toBe( 'Fruit &amp; prices' );
		expect(
			back.attributes.head[ 0 ].cells.map( ( c ) => c.content )
		).toEqual( [ 'Fruit', 'Price', 'Price', 'Column 4' ] );
		expect(
			back.attributes.body.map( ( r ) =>
				r.cells.map( ( c ) => c.content )
			)
		).toEqual( [
			[ '<em>Apple</em>', '1', '2', '' ],
			[ 'Pear', '3', '4', 'Extra' ],
			[ 'Total', '4', '6', '' ],
		] );
	} );

	test( 'Table: with no header row, the first row becomes the headings', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'Transform table no head' } );
		await editor.insertBlock( {
			name: 'core/table',
			attributes: {
				body: [
					{
						cells: [
							{ content: 'Name', tag: 'td' },
							{ content: 'Team', tag: 'td' },
						],
					},
					{
						cells: [
							{ content: 'Ada', tag: 'td' },
							{ content: 'Core', tag: 'td' },
						],
					},
				],
			},
		} );
		await transformTo( page, 'awt/data-table' );

		const [ table ] = await blockTree( page );
		expect( table.attributes.headers ).toEqual( [
			{ key: 'name', text: 'Name' },
			{ key: 'team', text: 'Team' },
		] );
		expect( table.attributes.rows ).toEqual( [
			{ name: 'Ada', team: 'Core' },
		] );
		expect( table.attributes.zebra ).toBe( false );
	} );

	test( 'Code: WordPress code to Code snippet and back, code unchanged', async ( {
		admin,
		editor,
		page,
	} ) => {
		const code = '<?php\n\techo "a & b";\n';
		await admin.createNewPost( { title: 'Transform code' } );
		await editor.insertBlock( {
			name: 'core/code',
			attributes: {
				content: code
					.replace( /&/g, '&amp;' )
					.replace( /</g, '&lt;' )
					.replace( />/g, '&gt;' ),
			},
		} );

		// The Code block's own form of that code, to compare the way back with.
		const [ original ] = await blockTree( page );

		expect( await transformTargets( page ) ).toContain(
			'awt/code-snippet'
		);
		await transformTo( page, 'awt/code-snippet' );

		const [ snippet ] = await blockTree( page );
		expect( snippet.name ).toBe( 'awt/code-snippet' );
		expect( snippet.attributes ).toMatchObject( {
			variant: 'multi',
			code,
		} );

		const html = await savedPage( editor, page );
		expect( html ).toContain( '&lt;?php' );
		expect( html ).toContain( 'echo &quot;a &amp; b&quot;;' );

		await transformTo( page, 'core/code' );
		const [ back ] = await blockTree( page );
		expect( back.name ).toBe( 'core/code' );
		expect( back.attributes.content ).toBe( original.attributes.content );
	} );
} );
