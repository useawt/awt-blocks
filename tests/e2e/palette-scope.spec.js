/**
 * A color picked from the palette follows the light or dark theme it sits in.
 *
 * The palette's values are Carbon White's, printed once on `:root`, and the
 * classes WordPress gives a picked color read them from there. So a picked
 * color kept its light value on a dark page and inside a dark section:
 * "Text secondary" at 2.32:1 on #161616, and a "Layer 01" box light grey
 * under light text, 1.00:1 (awt-workspace #24). The theme now points each
 * palette color at its Carbon token on the scope classes.
 *
 * Each check compares a picked color with the Carbon token it stands for,
 * resolved at the same spot, rather than with a fixed value. axe is no use
 * here: text at 1.00:1 is "incomplete" to axe, not a violation, so the worst
 * case would pass an axe-only gate.
 */

const { test, expect } = require( './fixtures' );

const PAGE_CONTENT = `
<!-- wp:paragraph {"textColor":"text-secondary"} -->
<p class="has-text-secondary-color has-text-color">Picked text on the page.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"color":{"text":"var:preset|color|text-secondary"}}} -->
<p class="has-text-color" style="color:var(--wp--preset--color--text-secondary)">Picked text, set inline.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"backgroundColor":"layer-01","layout":{"type":"constrained"}} -->
<div class="wp-block-group has-layer-01-background-color has-background"><!-- wp:paragraph -->
<p>Inside a Layer 01 box.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:awt/section {"themeScope":"g100"} -->
<!-- wp:paragraph {"textColor":"text-secondary"} -->
<p class="has-text-secondary-color has-text-color">Picked text in a dark section.</p>
<!-- /wp:paragraph -->
<!-- /wp:awt/section -->
`;

/**
 * Each picked color next to the token it should resolve to, read at the same
 * element: a probe styled with the token is appended there and measured.
 *
 * @param {import('@playwright/test').Locator} body The page's or the canvas's body.
 */
function measure( body ) {
	return body.evaluate( ( root ) => {
		const document = root.ownerDocument;
		const resolve = ( el, prop, token ) => {
			const probe = document.createElement( 'span' );
			probe.style[ prop ] = `var(${ token })`;
			el.appendChild( probe );
			const value = getComputedStyle( probe )[ prop ];
			probe.remove();
			return value;
		};
		const byText = ( text ) =>
			[ ...document.querySelectorAll( 'p' ) ].find( ( p ) =>
				p.textContent.includes( text )
			);
		const box = byText( 'Inside a Layer 01 box.' ).parentElement;
		const out = {};
		for ( const [ key, text ] of [
			[ 'page', 'Picked text on the page.' ],
			[ 'inline', 'Picked text, set inline.' ],
			[ 'section', 'Picked text in a dark section.' ],
		] ) {
			const p = byText( text );
			out[ key ] = {
				got: getComputedStyle( p ).color,
				want: resolve( p, 'color', '--cds-text-secondary' ),
			};
		}
		out.box = {
			got: getComputedStyle( box ).backgroundColor,
			want: resolve( box, 'backgroundColor', '--cds-layer-01' ),
		};
		return out;
	} );
}

function expectAllFollow( result, where ) {
	for ( const [ key, { got, want } ] of Object.entries( result ) ) {
		expect(
			want,
			`${ where }: ${ key } has no token to compare with`
		).not.toBe( '' );
		expect(
			got,
			`${ where }: ${ key } should follow its Carbon token`
		).toBe( want );
	}
}

test.describe( 'Palette colors follow the theme', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'Palette colors in light and dark',
			content: PAGE_CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	for ( const scheme of [ 'light', 'dark' ] ) {
		test( `on the page, ${ scheme }`, async ( { page, baseURL } ) => {
			await page.emulateMedia( { colorScheme: scheme } );
			await page
				.context()
				.addCookies( [
					{ name: 'awt_color_scheme', value: scheme, url: baseURL },
				] );
			await page.goto( `/?page_id=${ pageId }` );

			// The scheme is really in effect, or the dark run proves nothing.
			const bodyClass = await page.evaluate(
				() => document.body.className
			);
			expect( bodyClass ).toMatch(
				scheme === 'dark'
					? /\bcds--g(90|100)\b/
					: /\bcds--(white|g10)\b/
			);

			const result = await measure( page.locator( 'body' ) );
			expectAllFollow( result, scheme );

			// The section is dark on a light page too.
			expect( result.section.got ).toBe( 'rgb(198, 198, 198)' );
		} );
	}

	test( 'in a dark editor canvas', async ( {
		admin,
		editor,
		page,
		baseURL,
	} ) => {
		await page.emulateMedia( { colorScheme: 'dark' } );
		await page
			.context()
			.addCookies( [
				{ name: 'awt_color_scheme', value: 'dark', url: baseURL },
			] );
		await admin.visitAdminPage(
			'post.php',
			`post=${ pageId }&action=edit`
		);
		await expect(
			editor.canvas.getByText( 'Picked text in a dark section.' )
		).toBeVisible();
		const body = editor.canvas.locator( 'body' );

		// The canvas root itself is dark: the case that needs the rule on
		// body.editor-styles-wrapper, which carries no scope class.
		const bg = await body.evaluate(
			( el ) => getComputedStyle( el ).backgroundColor
		);
		expect( bg ).toBe( 'rgb(22, 22, 22)' );

		const result = await measure( body );
		expectAllFollow( result, 'dark canvas' );
		expect( result.page.got ).toBe( 'rgb(198, 198, 198)' );
	} );
} );
