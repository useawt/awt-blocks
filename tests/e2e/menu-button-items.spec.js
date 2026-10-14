/**
 * The element that takes focus in an open menu is the menu item.
 *
 * The `menuitem` role sat on each <li>, while the arrow keys moved focus to a
 * plain button inside it, so a screen reader said "Edit, button" instead of
 * "Edit, menu item, 1 of 3" (reported by the outside accessibility review,
 * 2026-10-14). The role is on the button now, and the <li> is `none`.
 *
 * A disabled item takes focus, as a menu's disabled items should, and does
 * nothing when chosen. It used the `disabled` attribute, which cannot take
 * focus, so an arrow key onto it left focus behind.
 */

const { test, expect } = require( './fixtures' );

const CONTENT =
	'<!-- wp:awt/menu-button {"label":"Actions","items":[{"label":"Edit","value":"edit"},{"label":"Duplicate","value":"duplicate"},{"label":"Delete","value":"delete","disabled":true}]} /-->';

test( 'arrow keys move between menu items that report their place', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — menu items',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );
	const cdp = await page.context().newCDPSession( page );
	// What the menu holds, as Chrome tells assistive technology: its children,
	// looking through ignored wrappers. A screen reader counts "1 of 3" from
	// these, so three menu items and nothing else is the point.
	const menuChildren = async () => {
		const { nodes } = await cdp.send( 'Accessibility.getFullAXTree' );
		const byId = new Map( nodes.map( ( n ) => [ n.nodeId, n ] ) );
		const menu = nodes.find(
			( n ) => n.role?.value === 'menu' && n.name?.value === 'Actions'
		);
		const out = [];
		const walk = ( ids ) =>
			ids.forEach( ( id ) => {
				const n = byId.get( id );
				if ( ! n ) {
					return;
				}
				if ( n.ignored ) {
					walk( n.childIds || [] );
				} else {
					out.push( `${ n.role?.value } "${ n.name?.value ?? '' }"` );
				}
			} );
		walk( menu?.childIds || [] );
		return out;
	};

	await page.getByRole( 'button', { name: 'Actions' } ).focus();
	await page.keyboard.press( 'Enter' );
	const edit = page.getByRole( 'menuitem', { name: 'Edit', exact: true } );
	await expect( edit ).toBeFocused();
	expect( await menuChildren() ).toEqual( [
		'menuitem "Edit"',
		'menuitem "Duplicate"',
		'menuitem "Delete"',
	] );

	await page.keyboard.press( 'ArrowDown' );
	await expect(
		page.getByRole( 'menuitem', { name: 'Duplicate', exact: true } )
	).toBeFocused();

	// The disabled item takes focus and says so, and Enter does nothing.
	await page.keyboard.press( 'ArrowDown' );
	const remove = page.getByRole( 'menuitem', {
		name: 'Delete',
		exact: true,
	} );
	await expect( remove ).toBeFocused();
	await expect( remove ).toHaveAttribute( 'aria-disabled', 'true' );
	await page.keyboard.press( 'Enter' );
	await expect( page.getByRole( 'menu', { name: 'Actions' } ) ).toBeVisible();
	await expect( remove ).toBeFocused();

	// And wraps round to the first.
	await page.keyboard.press( 'ArrowDown' );
	await expect( edit ).toBeFocused();
} );
