/**
 * A header section link looks like the current page.
 *
 * A link set to "This address or any page under it" was announced as the
 * current page on every page beneath it (reported by the outside accessibility
 * review, 2026-10-20). It now carries aria-current="true" and Carbon's
 * `--current` class (tests/phpunit/test-nav-current.php), and Carbon's own
 * rule for that class loses to its base link colour, which would have dimmed
 * it. This checks the theme puts it back: the same text colour and underline
 * as the current page. The markup is what the header nav item renders.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:html -->
<header class="cds--header" aria-label="Test header"><nav class="cds--header__nav" aria-label="Test menu"><ul class="cds--header__menu-bar">
<li><a class="cds--header__menu-item" href="/x/" aria-current="page">Page</a></li>
<li><a class="cds--header__menu-item cds--header__menu-item--current" href="/y/" aria-current="true">Section</a></li>
<li><a class="cds--header__menu-item" href="/z/">Other</a></li>
</ul></nav></header>
<!-- /wp:html -->
`;

test( 'a section link has the current page colour and underline', async ( {
	page,
	requestUtils,
} ) => {
	const created = await requestUtils.createPage( {
		title: 'gate — header section current',
		content: CONTENT,
		status: 'publish',
	} );
	await page.goto( `/?page_id=${ created.id }` );
	const looks = await page.evaluate( () =>
		[ ...document.querySelectorAll( 'main .cds--header__menu-item' ) ].map(
			( a ) => {
				const after = getComputedStyle( a, '::after' );
				return {
					color: getComputedStyle( a ).color,
					bar: `${ after.blockSize } ${ after.backgroundColor }`,
				};
			}
		)
	);
	const [ current, section, other ] = looks;
	expect( section ).toEqual( current );
	expect( other.color ).not.toBe( current.color );
} );
