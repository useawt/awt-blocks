/**
 * A sort is announced once, by the table that was sorted.
 *
 * Every table's live region showed one shared message, so with two sortable
 * tables on a page a sort in one was announced by both (found 2026-10-15,
 * after the outside accessibility review's sort button finding). The
 * messages now come translated from the server; this checks the English.
 */

const { test, expect } = require( './fixtures' );

const table = ( caption ) =>
	`<!-- wp:awt/data-table {"headers":[{"key":"name","text":"Name"},{"key":"status","text":"Status"}],"rows":[{"name":"Initech","status":"Degraded"},{"name":"Acme","status":"Healthy"}],"sortable":true,"caption":"${ caption }"} /-->`;

test( 'only the sorted table announces it', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — data table sort announce',
		content: `${ table( 'Services' ) }\n${ table( 'Backups' ) }`,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );

	const tables = page.locator( 'main .wp-block-awt-data-table' );
	await expect( tables ).toHaveCount( 2 );
	const announce = ( i ) =>
		tables.nth( i ).locator( '.awt-data-table__sort-announce' );
	const sortName = ( i ) =>
		tables.nth( i ).locator( 'thead th button' ).first().click();

	await sortName( 0 );
	await expect( announce( 0 ) ).toHaveText(
		'Table sorted by Name ascending.'
	);
	await expect( announce( 1 ) ).toHaveText( '' );

	await sortName( 1 );
	await expect( announce( 1 ) ).toHaveText(
		'Table sorted by Name ascending.'
	);
	await sortName( 1 );
	await sortName( 1 );
	await expect( announce( 1 ) ).toHaveText(
		'Table sort cleared. Rows restored to original order.'
	);
	await expect( announce( 0 ) ).toHaveText(
		'Table sorted by Name ascending.'
	);
} );
