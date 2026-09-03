<?php
/**
 * The update check, plugin half.
 *
 * The theme's suite covers the strict parsing of the manifest. What is only
 * true here is the plugin-shaped answer WordPress expects, the package seam
 * that keeps the free tier told-not-served, and the fact that one switch —
 * stored in the theme's settings — covers both halves even when the theme is
 * not the active one.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use AWT\Blocks\Updates;

/**
 * The plugin half of the update check.
 *
 * @covers \AWT\Blocks\Updates
 */
class Test_Updates extends WP_UnitTestCase {

	/**
	 * The check does nothing on a front-end page load, so a test that wants to
	 * watch it has to be one of the requests that do check. Cron is the honest
	 * one to pretend to be, and is filterable where `is_admin()` is not.
	 */
	public function set_up(): void {
		parent::set_up();
		add_filter( 'wp_doing_cron', '__return_true' );
	}

	/**
	 * Leave no cached answer, saved setting or filter behind.
	 */
	public function tear_down(): void {
		remove_all_filters( 'wp_doing_cron' );
		delete_site_transient( Updates\CACHE_KEY );
		delete_option( 'awt_theme_settings' );
		remove_all_filters( 'awt_blocks_update_package' );
		remove_all_filters( 'awt_update_check_enabled' );
		parent::tear_down();
	}

	/**
	 * A newer version reaches WordPress's update list, keyed the way the
	 * Plugins screen looks it up.
	 */
	public function test_a_newer_version_is_offered(): void {
		$this->cache( '2099.01.0' );

		$result = Updates\offer_update( $this->transient() );
		$key    = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertArrayHasKey( $key, $result->response );
		$this->assertSame( '2099.01.0', $result->response[ $key ]->new_version );
		$this->assertSame( $key, $result->response[ $key ]->plugin );
		$this->assertArrayNotHasKey( $key, $result->no_update );
	}

	/**
	 * The current version is reported as current, not as an update.
	 */
	public function test_the_installed_version_is_not_offered(): void {
		$this->cache( \AWT\Blocks\AWT_BLOCKS_VERSION );

		$result = Updates\offer_update( $this->transient() );
		$key    = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertArrayNotHasKey( $key, $result->response );
		$this->assertArrayHasKey( $key, $result->no_update );
	}

	/**
	 * The free tier carries no package.
	 *
	 * An empty package is what makes WordPress say "Automatic update is
	 * unavailable" rather than offering a button. If a change ever fills it in
	 * by default, every free site silently gains one-click updates.
	 */
	public function test_free_offers_no_package(): void {
		$this->cache( '2099.01.0' );

		$result = Updates\offer_update( $this->transient() );
		$key    = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertSame( '', $result->response[ $key ]->package );
	}

	/**
	 * A licence can fill the package in without touching this code.
	 */
	public function test_a_licence_can_add_the_package(): void {
		$this->cache( '2099.01.0' );
		add_filter( 'awt_blocks_update_package', static fn () => 'https://example.com/awt-blocks.zip' );

		$result = Updates\offer_update( $this->transient() );
		$key    = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertSame( 'https://example.com/awt-blocks.zip', $result->response[ $key ]->package );
	}

	/**
	 * Pressing "Update" with no package says what to do instead of failing
	 * with "Update package not available."
	 */
	public function test_a_manual_update_is_explained(): void {
		$key    = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );
		$result = Updates\explain_manual_update( false, '', null, array( 'plugin' => $key ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertStringContainsString( 'useawt.com/faq/#updating', $result->get_error_message() );
	}

	/**
	 * A licensed site, which does have a package, is never interrupted.
	 */
	public function test_a_real_package_downloads_normally(): void {
		$key = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertFalse( Updates\explain_manual_update( false, 'https://example.com/x.zip', null, array( 'plugin' => $key ) ) );
	}

	/**
	 * Another plugin's update is none of our business.
	 */
	public function test_other_plugins_are_left_alone(): void {
		$this->assertFalse( Updates\explain_manual_update( false, '', null, array( 'plugin' => 'akismet/akismet.php' ) ) );
	}

	/**
	 * A site that has never opened AWT Settings still checks.
	 */
	public function test_the_check_is_on_when_nothing_is_saved(): void {
		delete_option( 'awt_theme_settings' );

		$this->assertTrue( Updates\enabled() );
	}

	/**
	 * The theme's switch turns the plugin's check off too — that is the point
	 * of reading the theme's option rather than keeping a second setting.
	 */
	public function test_the_theme_switch_covers_the_plugin(): void {
		update_option( 'awt_theme_settings', (string) wp_json_encode( array( 'updates' => array( 'check' => false ) ) ) );

		$this->assertFalse( Updates\enabled() );
		$this->assertNull( Updates\manifest() );
	}

	/**
	 * The setting is stored as JSON, but a site whose option was written as an
	 * array must not silently start checking again.
	 */
	public function test_the_switch_is_read_from_an_array_option_too(): void {
		update_option( 'awt_theme_settings', array( 'updates' => array( 'check' => false ) ) );

		$this->assertFalse( Updates\enabled() );
	}

	/**
	 * The request tells useawt.com nothing about this site.
	 */
	public function test_the_request_carries_nothing_about_the_site(): void {
		$seen = null;
		add_filter(
			'pre_http_request',
			static function ( $preempt, $args, $url ) use ( &$seen ) {
				$seen = array(
					'args' => $args,
					'url'  => $url,
				);
				return new WP_Error( 'stopped', 'not making a real request' );
			},
			10,
			3
		);

		Updates\manifest();
		remove_all_filters( 'pre_http_request' );

		$this->assertNotNull( $seen, 'the check should have made a request' );
		$this->assertStringNotContainsString( (string) wp_parse_url( home_url(), PHP_URL_HOST ), (string) wp_json_encode( $seen ) );
		$this->assertSame( 'AWT', $seen['args']['user-agent'] );
		$this->assertStringNotContainsString( '?', $seen['url'] );
	}

	/**
	 * Both halves ask the same question of the same file, so they share one
	 * cached answer and a site makes one request, not two.
	 */
	public function test_both_halves_share_one_cache_key(): void {
		$this->assertSame( 'awt_update_manifest', Updates\CACHE_KEY );
	}

	// --- helpers ------------------------------------------------------------

	/**
	 * Put a manifest naming $version straight into the cache.
	 *
	 * @param string $version Version to announce.
	 */
	private function cache( string $version ): void {
		set_site_transient(
			Updates\CACHE_KEY,
			array(
				'schemaVersion' => 1,
				'version'       => $version,
				'requiresWp'    => '6.6',
				'requiresPhp'   => '8.1',
				'testedWp'      => '7.1',
				'theme'         => array(
					'slug'       => 'awt',
					'releaseUrl' => 'https://example.com/theme',
				),
				'plugin'        => array(
					'slug'       => 'awt-blocks',
					'releaseUrl' => 'https://example.com/plugin',
				),
			),
			HOUR_IN_SECONDS
		);
	}

	/** An empty update_plugins transient to filter. */
	private function transient(): stdClass {
		$t            = new stdClass();
		$t->response  = array();
		$t->no_update = array();
		return $t;
	}
}
