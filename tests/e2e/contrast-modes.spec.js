/**
 * The editor's contrast checks judge a block in light and dark mode.
 *
 * Palette colors follow the theme they sit in, so the contrast preview in the
 * Color panel and the linter's contrast check have to judge each color at the
 * value it really has: in every mode the site shows visitors, and in a section
 * with its own theme only in that one. They used to judge every palette color
 * at its light value against a white page, and passed text that fails in dark
 * mode (awt-workspace #24).
 */

const { test, expect } = require( './fixtures' );

const PAGE_CONTENT = `
<!-- wp:paragraph {"textColor":"text-secondary","style":{"color":{"background":"#ffffff"}}} -->
<p class="has-text-secondary-color has-text-color has-background" style="background-color:#ffffff">Palette text on a custom white background.</p>
<!-- /wp:paragraph -->

<!-- wp:awt/section {"themeScope":"g100"} -->
<!-- wp:paragraph {"textColor":"text-secondary"} -->
<p class="has-text-secondary-color has-text-color">Palette text in a dark section.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"color":{"text":"#525252"}}} -->
<p class="has-text-color" style="color:#525252">Custom grey text in a dark section.</p>
<!-- /wp:paragraph -->
<!-- /wp:awt/section -->
`;

test.describe( 'Contrast checks in light and dark', () => {
	let pageId;

	test.beforeAll( async ( { requestUtils } ) => {
		const created = await requestUtils.createPage( {
			title: 'Contrast checks in light and dark',
			content: PAGE_CONTENT,
			status: 'publish',
		} );
		pageId = created.id;
	} );

	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.visitAdminPage(
			'post.php',
			`post=${ pageId }&action=edit`
		);
		await expect(
			editor.canvas.getByText( 'Palette text in a dark section.' )
		).toBeVisible();
		// The colors of each theme are read from the canvas once it is in.
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						!! window.wp.data
							.select( 'awt/linter' )
							.getScopeColors()
				)
			)
			.toBe( true );
	} );

	test( 'the linter flags what fails, and says in which mode', async ( {
		page,
	} ) => {
		const titles = () =>
			page.evaluate( () =>
				window.wp.data
					.select( 'awt/linter' )
					.getFindings()
					.filter( ( f ) => f.checkId === 12 )
					.map( ( f ) => f.title )
					.sort()
			);

		await expect.poll( titles ).toEqual( [
			// #525252 on the dark section, which only has one mode.
			'Text contrast is too low (2.3:1)',
			// #c6c6c6 on white: passes in light mode, fails in dark.
			'Text contrast is too low in dark mode (1.7:1)',
		] );
	} );

	test( 'the Color panel gives a result for each mode', async ( {
		editor,
		page,
	} ) => {
		const panelFor = async ( text ) => {
			await editor.canvas.getByText( text ).click();
			await page.getByRole( 'tab', { name: 'Styles' } ).click();
			return page.locator( '.awt-contrast' );
		};

		const both = await panelFor(
			'Palette text on a custom white background.'
		);
		await expect( both ).toContainText( 'Light mode' );
		await expect( both ).toContainText( '7.81:1' );
		await expect( both ).toContainText( 'Dark mode' );
		await expect( both ).toContainText( '1.71:1' );

		// The section has its own dark theme: one result, at the dark value.
		const section = await panelFor( 'Palette text in a dark section.' );
		await expect( section ).toContainText( 'Dark mode' );
		await expect( section ).toContainText( '10.59:1' );
		await expect( section ).not.toContainText( 'Light mode' );
	} );
} );
