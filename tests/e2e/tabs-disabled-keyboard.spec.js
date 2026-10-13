/**
 * The arrow keys, Home and End skip disabled tabs.
 *
 * They used to land on them. A disabled button cannot take focus, so End, or
 * Right Arrow from the tab before a disabled one, selected the disabled tab
 * and showed its panel while focus stayed behind on a tab now marked not
 * selected. Right Arrow then did nothing until Left Arrow was pressed
 * (reported by the outside accessibility review, 2026-10-13).
 *
 * After every key the test checks the three things that must agree: the
 * focused tab, the one selected tab, and the one panel on screen.
 */

const { test, expect } = require( './fixtures' );

const tab = ( label, disabled = false ) =>
	`<!-- wp:awt/tab {"label":"${ label }"${
		disabled ? ',"disabled":true' : ''
	}} /-->`;
const panel = ( text ) =>
	`<!-- wp:awt/tab-panel --><!-- wp:paragraph --><p>${ text }</p><!-- /wp:paragraph --><!-- /wp:awt/tab-panel -->`;

// A disabled tab in the middle and one at the end, as on the Tabs page.
const CONTENT = `<!-- wp:awt/tabs {"ariaLabel":"Plans"} -->
${ tab( 'One' ) }${ tab( 'Two' ) }${ tab( 'Three', true ) }${ tab(
	'Four'
) }${ tab( 'Five', true ) }
${ panel( 'Panel one.' ) }${ panel( 'Panel two.' ) }${ panel(
	'Panel three.'
) }${ panel( 'Panel four.' ) }${ panel( 'Panel five.' ) }
<!-- /wp:awt/tabs -->`;

test( 'arrow keys, Home and End skip disabled tabs', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — disabled tabs',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );

	const state = () =>
		page.evaluate( () => {
			const tabs = [ ...document.querySelectorAll( '[role="tab"]' ) ];
			const panels = [
				...document.querySelectorAll( '[role="tabpanel"]' ),
			];
			return {
				focused:
					tabs[ 0 ].ownerDocument.activeElement.textContent.trim(),
				selected: tabs
					.filter(
						( t ) => t.getAttribute( 'aria-selected' ) === 'true'
					)
					.map( ( t ) => t.textContent.trim() ),
				shown: panels
					.filter( ( p ) => ! p.hidden )
					.map( ( p ) => p.textContent.trim() ),
			};
		} );
	const at = ( label ) => ( {
		focused: label,
		selected: [ label ],
		shown: [ `Panel ${ label.toLowerCase() }.` ],
	} );

	await page.getByRole( 'tab', { name: 'One' } ).focus();
	expect( await state() ).toEqual( at( 'One' ) );

	const steps = [
		[ 'ArrowRight', 'Two' ],
		[ 'ArrowRight', 'Four' ], // past Three
		[ 'ArrowRight', 'One' ], // past Five, wrapping
		[ 'ArrowLeft', 'Four' ], // wrapping, past Five
		[ 'ArrowLeft', 'Two' ], // past Three
		[ 'End', 'Four' ],
		[ 'ArrowRight', 'One' ], // the reported dead end
		[ 'Home', 'One' ],
	];
	for ( const [ key, label ] of steps ) {
		await page.keyboard.press( key );
		expect( await state(), `${ key } to ${ label }` ).toEqual(
			at( label )
		);
	}
} );
