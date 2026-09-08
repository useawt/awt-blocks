/**
 * The editor canvas shows what the page shows.
 *
 * Every block renders twice from one set of attributes: `render.php` for the
 * page and `edit.js` for the canvas. Nothing keeps the two in step, so a
 * setting can change the page and do nothing in the editor — the author moves
 * a control, sees no result, and reasonably concludes it is broken. It has
 * happened twice: awt/section's Max width, and awt/testimonial's Attribution
 * style, which is laid out entirely by a class the canvas never emitted.
 *
 * Comparing the classes on each block's outer element catches that whole
 * family, because in this codebase a layout choice is a modifier class.
 *
 * Attributes are deliberately NOT defaults: a modifier that both sides omit
 * proves nothing.
 */

const { test, expect } = require( './fixtures' );

const CONTENT = `
<!-- wp:awt/section {"maxWidth":"wide","themeScope":"dark"} --><!-- wp:paragraph --><p>S</p><!-- /wp:paragraph --><!-- /wp:awt/section -->
<!-- wp:awt/feature-grid {"columns":4} --><!-- wp:awt/tile --><!-- wp:paragraph --><p>T</p><!-- /wp:paragraph --><!-- /wp:awt/tile --><!-- /wp:awt/feature-grid -->
<!-- wp:awt/stat {"value":"98%","heading":"H","align":"center"} /-->
<!-- wp:awt/testimonial {"quote":"Q","align":"center","markStyle":"none","quoteSize":"lg","attributionStyle":"inline"} /-->
<!-- wp:awt/hero {"heading":"H","layout":"split"} /-->
<!-- wp:awt/color-scheme-toggle {"kind":"segmented"} /-->
<!-- wp:awt/tile {"kind":"clickable","href":"#x"} --><!-- wp:paragraph --><p>t</p><!-- /wp:paragraph --><!-- /wp:awt/tile -->
<!-- wp:awt/notification {"title":"N","subtitle":"s","kind":"warning"} /-->
<!-- wp:awt/tag {"text":"T","type":"red"} /-->
<!-- wp:awt/button {"text":"B","kind":"tertiary","size":"lg"} /-->
`;

// Runs in both documents: the AWT and Carbon classes on each block's outer
// element, keyed by block. Editor-only chrome is ignored.
const COLLECT = () => {
	const out = {};
	// Scoped to the post's own content. The page also renders the header and
	// footer, and the header has blocks of its own — its colour-scheme toggle
	// is icon-only, and comparing that against the one in the content reports
	// a difference that is not one.
	const root =
		document.querySelector( 'main' ) ||
		document.querySelector( '.is-root-container' ) ||
		document.body;
	root.querySelectorAll( '[class*="wp-block-awt-"]' ).forEach( ( el ) => {
		const name = [ ...el.classList ].find( ( c ) =>
			c.startsWith( 'wp-block-awt-' )
		);
		if ( out[ name ] ) {
			return; // First instance of each block is enough.
		}
		out[ name ] = [ ...el.classList ]
			.filter(
				( c ) => c.startsWith( 'awt-' ) || c.startsWith( 'cds--' )
			)
			.sort()
			.join( ' ' );
	} );
	return out;
};

test.describe( 'Editor parity', () => {
	test( 'a block carries the same classes in the canvas as on the page', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await page.setViewportSize( { width: 1920, height: 1080 } );

		const created = await requestUtils.createPage( {
			title: 'Editor parity',
			content: CONTENT,
			status: 'publish',
		} );

		await page.goto( `/?page_id=${ created.id }` );
		const onPage = await page.evaluate( COLLECT );
		expect( Object.keys( onPage ).length ).toBeGreaterThan( 8 );

		await admin.editPost( created.id );
		await expect(
			editor.canvas.locator( '.wp-block-awt-testimonial' )
		).toBeVisible();
		const inEditor = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body, collect ) => {
				// eslint-disable-next-line no-eval
				return eval( `(${ collect })` )();
			}, COLLECT.toString() );

		const differences = [];
		for ( const [ name, classes ] of Object.entries( onPage ) ) {
			// A block the canvas does not render at all is a different
			// problem, and the smoke test covers it.
			if ( inEditor[ name ] === undefined ) {
				continue;
			}
			if ( inEditor[ name ] !== classes ) {
				differences.push(
					`${ name }\n     page  : ${ classes }\n     editor: ${ inEditor[ name ] }`
				);
			}
		}

		expect(
			differences,
			`the canvas disagrees with the page:\n  ${ differences.join(
				'\n  '
			) }`
		).toHaveLength( 0 );
	} );
} );
