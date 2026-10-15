/**
 * Every list AWT draws without the browser's markers says what it is.
 *
 * Carbon takes the markers off most of its lists (`list-style: none`) and
 * draws its own, or none. Safari stops treating a list with no visible markers
 * as a list, so VoiceOver gave no item count and no end of the list: found on
 * the header menus in 2026.10.8 and reported for the List block by the outside
 * accessibility review on 2026-10-15. Each such list now carries a role, `list`
 * or its own (menu, tablist, listbox). This renders every block that draws one
 * and fails on any that has neither markers nor a role.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/list -->
<!-- wp:awt/list-item {"content":"Bulleted"} -->
<!-- wp:awt/list {"nested":true} -->
<!-- wp:awt/list-item {"content":"Nested"} /-->
<!-- /wp:awt/list -->
<!-- /wp:awt/list-item -->
<!-- /wp:awt/list -->
<!-- wp:awt/list {"type":"ordered"} -->
<!-- wp:awt/list-item {"content":"Numbered"} /-->
<!-- /wp:awt/list -->
<!-- wp:awt/accordion -->
<!-- wp:awt/accordion-item {"title":"Section"} -->
<!-- wp:paragraph --><p>Body.</p><!-- /wp:paragraph -->
<!-- /wp:awt/accordion-item -->
<!-- /wp:awt/accordion -->
<!-- wp:awt/breadcrumb -->
<!-- wp:awt/breadcrumb-item {"text":"Home","href":"/"} /-->
<!-- wp:awt/breadcrumb-item {"text":"Here","isCurrentPage":true} /-->
<!-- /wp:awt/breadcrumb -->
<!-- wp:awt/pagination {"totalPages":3,"currentPage":2} /-->
<!-- wp:awt/side-nav -->
<!-- wp:awt/side-nav-section {"title":"Guides"} -->
<!-- wp:awt/side-nav-link {"text":"Install","href":"/install"} /-->
<!-- /wp:awt/side-nav-section -->
<!-- wp:awt/side-nav-link {"text":"About","href":"/about"} /-->
<!-- /wp:awt/side-nav -->
<!-- wp:awt/footer-section {"title":"Product"} -->
<!-- wp:awt/footer-link {"text":"Blocks","href":"/blocks"} /-->
<!-- /wp:awt/footer-section -->
`;

test( 'no list loses its markers without a role', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — list roles',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );

	const lists = await page.evaluate( () =>
		[ ...document.querySelectorAll( 'ul, ol' ) ]
			.filter( ( el ) => ! el.closest( '#wpadminbar' ) )
			.map( ( el ) => ( {
				list: `${ el.tagName.toLowerCase() }.${ [ ...el.classList ]
					.filter( ( c ) => c.startsWith( 'cds--' ) )
					.join( '.' ) }`,
				markers: getComputedStyle( el ).listStyleType !== 'none',
				role: el.getAttribute( 'role' ) || '',
			} ) )
	);
	// The page really holds each kind, so a renamed class cannot pass by
	// rendering nothing.
	const kinds = lists.map( ( l ) => l.list ).join( ' ' );
	for ( const kind of [
		'cds--list--unordered',
		'cds--list--nested',
		'cds--list--ordered',
		'cds--accordion',
		'cds--breadcrumb__list',
		'cds--pagination-nav__list',
		'cds--side-nav__items',
		'cds--side-nav__menu',
		'cds--footer__links',
		'cds--header__menu-bar',
	] ) {
		expect( kinds ).toContain( kind );
	}
	expect(
		lists.filter( ( l ) => ! l.markers && ! l.role ).map( ( l ) => l.list )
	).toEqual( [] );
} );
