/**
 * Floor A compatibility: WooCommerce (Stage 1 spec, "Plugin compatibility
 * floor"). Coexistence, not integration:
 *
 *   - install + activate alongside AWT without fatals
 *   - create a product; view product page, shop archive, cart, checkout;
 *     complete a guest checkout (cash on delivery)
 *   - AWT-controlled pages keep their Carbon styling; WC-specific pages
 *     may keep WC's default styling (accepted at Floor A)
 *   - the block editor (with the accessibility linter) doesn't crash
 *     while WooCommerce is active
 */

const { test, expect } = require( '../e2e/fixtures' );
const { wp, bash, collectConsoleErrors } = require( './helpers' );

let productUrl = '';

test.describe( 'WooCommerce — Floor A coexistence', () => {
	test.beforeAll( () => {
		test.setTimeout( 300_000 );
		bash( 'wp plugin install woocommerce --activate' );
		// A brand-new store sends the next admin page load to WooCommerce's
		// setup wizard, so the first attempt at opening the block editor never
		// reaches the editor at all. It only happens once per store, which is
		// why it fails on a fresh CI database and passes on the retry — and why
		// it looked like flakiness for weeks. Skipping the profiler and
		// clearing the one-shot redirect keeps the admin where the test asks
		// for it. (Floor A is about coexistence; onboarding is not under test.)
		wp( 'transient delete _wc_activation_redirect' );
		wp(
			`option update woocommerce_onboarding_profile --format=json '{"skipped":true}'`
		);
		bash( 'wp wc tool run install_pages --user=admin' );
		wp( 'option update woocommerce_enable_guest_checkout yes' );
		wp( 'option update woocommerce_calc_taxes no' );
		wp(
			`option update woocommerce_cod_settings --format=json '{"enabled":"yes","title":"Cash on delivery"}'`
		);
		const id = wp(
			`wc product create --name='Compat test product' --type=simple --virtual=true --regular_price=19 --user=admin --porcelain`
		);
		productUrl = wp( `post url ${ id }` );
	} );

	test.afterAll( () => {
		test.setTimeout( 120_000 );
		bash(
			'wp plugin deactivate woocommerce && wp plugin delete woocommerce'
		);
	} );

	test( 'site pages still render with Carbon styling', async ( { page } ) => {
		const errors = collectConsoleErrors( page );
		await page.goto( '/' );
		await expect( page.locator( '.cds--header' ) ).toBeVisible();
		expect( errors ).toEqual( [] );
	} );

	test( 'guest checkout completes end to end', async ( { page } ) => {
		test.setTimeout( 180_000 );
		await page.goto( productUrl );
		// AWT site chrome + WC product content coexist on the same page.
		await expect( page.locator( '.cds--header' ) ).toBeVisible();
		await page
			.locator( 'button[name="add-to-cart"], .single_add_to_cart_button' )
			.first()
			.click();

		await page.goto(
			'/?page_id=' +
				wp( 'post list --post_type=page --name=checkout --field=ID' )
		);

		// WC checkout block form (guest). Which fields render depends on
		// the cart (virtual carts may need no address at all), so fill
		// whatever WC shows — Floor A tests coexistence, not WC's UX.
		await page.locator( '#email' ).fill( 'floor-a@example.com' );
		const optional = [
			[ '#billing-first_name', 'Floor' ],
			[ '#billing-last_name', 'Tester' ],
			[ '#billing-address_1', '1 Access Way' ],
			[ '#billing-city', 'Berlin' ],
			[ '#billing-postcode', '10115' ],
		];
		for ( const [ selector, value ] of optional ) {
			const field = page.locator( selector );
			if ( await field.isVisible() ) {
				await field.fill( value );
			}
		}

		await page.getByRole( 'button', { name: /place order/i } ).click();

		await expect(
			page.getByText( /your order has been received|thank you/i ).first()
		).toBeVisible( { timeout: 30_000 } );
	} );

	test( 'block editor (with the linter) survives WooCommerce', async ( {
		admin,
		editor,
		page,
	} ) => {
		const errors = collectConsoleErrors( page );
		await admin.createNewPost( { title: 'WC coexistence' } );
		// Fail here, naming the page we actually landed on, if a plugin sends
		// the admin somewhere else — rather than three steps later as an
		// unexplained missing block.
		await expect( page ).toHaveURL( /post-new\.php/ );
		await editor.insertBlock( { name: 'awt/button' } );
		await editor.insertBlock( { name: 'awt/notification' } );
		await expect(
			editor.canvas.locator( '.block-editor-warning' )
		).toHaveCount( 0 );
		expect( errors ).toEqual( [] );
	} );
} );
