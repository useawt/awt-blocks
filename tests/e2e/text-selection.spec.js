/**
 * Shift and an arrow key select text where you type, as in any text field.
 *
 * Until 2026-11-18 they did not in any AWT block but List item (owner's
 * report, typing a Data table). The text boxes did not tell the editor which
 * text they were, so the editor took the cursor for a whole selected block,
 * and Shift with any arrow key selected the block and the next one instead of
 * a character, a word or a line. `src/shared/rich-text-identifier.test.js`
 * holds the cause; this holds what the author feels.
 *
 * The Data table also keeps the selection in the cell. WordPress carries a
 * selection on into the next block at the first or last character, which in
 * a table is the next cell, and a cell of one line is always at its first and
 * last line, so Shift+Up or Shift+Down left the cell at once.
 */

const { test, expect } = require( './fixtures' );
const { insertableBlockNames } = require( './block-inventory' );

/**
 * What is selected, where the focus is, and how many blocks are selected.
 *
 * @param {Object}                          editor Editor utilities.
 * @param {import('@playwright/test').Page} page
 * @return {Promise<{text: string, focus: string, blocks: number}>} State.
 */
async function selection( editor, page ) {
	const inCanvas = await editor.canvas
		.locator( 'body' )
		.evaluate( ( body ) => ( {
			text: body.ownerDocument.getSelection().toString(),
			focus:
				body.ownerDocument.activeElement?.getAttribute(
					'aria-label'
				) || '',
		} ) );
	const blocks = await page.evaluate(
		() =>
			window.wp.data
				.select( 'core/block-editor' )
				.getMultiSelectedBlockClientIds().length
	);
	return { ...inCanvas, blocks };
}

test.describe( 'Selecting text with the keyboard', () => {
	test( 'Shift and an arrow key select inside a Data table cell', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'Selecting in a table' } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Before' },
		} );
		await editor.insertBlock( {
			name: 'awt/data-table',
			attributes: {
				headers: [
					{ key: 'service', text: 'Service' },
					{ key: 'owner', text: 'Owner' },
				],
				rows: [
					{ service: 'Load balancer', owner: 'Maria' },
					{ service: 'Database', owner: 'Aisha' },
				],
			},
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'After' },
		} );

		const cell = editor.canvas.getByRole( 'textbox', {
			name: 'Service, row 1',
		} );
		await cell.click();

		// [ where the cursor starts, the keys, what is then selected ]
		const cases = [
			[ 4, 'Shift+ArrowDown', ' balancer' ],
			[ 4, 'Shift+ArrowUp', 'Load' ],
			[ 4, 'Shift+ArrowRight', ' ' ],
			[ 13, 'Shift+ArrowRight', '' ],
			[ 0, 'Shift+ArrowLeft', '' ],
			[ 13, 'Shift+ArrowDown', '' ],
			[ 0, 'Shift+ArrowUp', '' ],
		];
		for ( const [ at, keys, selected ] of cases ) {
			await page.keyboard.press( 'Home' );
			for ( let i = 0; i < at; i++ ) {
				await page.keyboard.press( 'ArrowRight' );
			}
			await page.keyboard.press( keys );
			expect(
				await selection( editor, page ),
				`${ keys } at ${ at }`
			).toEqual( { text: selected, focus: 'Service, row 1', blocks: 0 } );
		}

		// Typing over a selection changes that text and nothing else.
		await page.keyboard.press( 'Home' );
		for ( let i = 0; i < 5; i++ ) {
			await page.keyboard.press( 'ArrowRight' );
		}
		await page.keyboard.press( 'Shift+ArrowDown' );
		await page.keyboard.type( 'pool' );
		const rows = await page.evaluate(
			() =>
				window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()
					.find( ( b ) => b.name === 'awt/data-table' ).attributes
					.rows
		);
		expect( rows ).toEqual( [
			{ service: 'Load pool', owner: 'Maria' },
			{ service: 'Database', owner: 'Aisha' },
		] );
		expect( await editor.getBlocks() ).toHaveLength( 3 );
	} );

	test( 'Shift and an arrow key select a character in every AWT text field', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { title: 'Selecting everywhere' } );
		for ( const name of insertableBlockNames() ) {
			await editor.insertBlock( { name } );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Between' },
			} );
		}

		// The visible text boxes inside AWT blocks, marked so each can be
		// found again however the canvas re-renders.
		const count = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body ) => {
				const boxes = [
					...body.querySelectorAll( '[contenteditable="true"]' ),
				].filter(
					( el ) =>
						el
							.closest( '[data-type]' )
							?.dataset.type.startsWith( 'awt/' ) &&
						el.getClientRects().length > 0
				);
				boxes.forEach(
					( el, i ) => ( el.dataset.awtTextBox = String( i ) )
				);
				return boxes.length;
			} );
		expect( count ).toBeGreaterThan( 25 );

		const results = [];
		for ( let i = 0; i < count; i++ ) {
			const box = editor.canvas.locator( `[data-awt-text-box="${ i }"]` );
			const block = await box.evaluate(
				( el ) => el.closest( '[data-type]' ).dataset.type
			);
			await box.focus();
			await page.keyboard.press( 'End' );
			await page.keyboard.type( 'abcd' );
			await page.keyboard.press( 'ArrowLeft' );
			await page.keyboard.press( 'Shift+ArrowLeft' );
			const { text, blocks } = await selection( editor, page );
			const focused = await box.evaluate(
				( el ) => el.ownerDocument.activeElement === el
			);
			results.push( {
				box: `${ block } #${ i }`,
				text,
				blocks,
				focused,
			} );
		}
		// One character selected, in the box being typed in, and no blocks.
		expect( results ).toEqual(
			results.map( ( r ) => ( {
				...r,
				text: 'c',
				blocks: 0,
				focused: true,
			} ) )
		);
	} );
} );
