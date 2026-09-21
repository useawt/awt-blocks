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
		remove_all_filters( 'awt_update_environment' );
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
		remove_all_filters( 'wp_doing_cron' );
		set_current_screen( 'plugins' );
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
	 * Every site carries the package.
	 *
	 * **This test used to assert the opposite**, and said so: an empty
	 * package was the free/Premium boundary, and this existed to fail if a
	 * change ever filled it in by default. On 2026-09-21 that became the
	 * decision rather than the accident, so the guard is inverted rather
	 * than deleted. An empty package here would now mean a fix that reaches
	 * nobody, and WordPress telling the owner their update failed.
	 */
	public function test_every_site_is_offered_the_package(): void {
		remove_all_filters( 'wp_doing_cron' );
		set_current_screen( 'plugins' );
		$this->cache( '2099.01.0' );

		$result = Updates\offer_update( $this->transient() );
		$key    = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertSame( 'https://example.com/blocks-2099.01.0.zip', $result->response[ $key ]->package );
	}

	/**
	 * The filter is still the seam, it just no longer decides the tier.
	 */
	public function test_the_package_can_still_be_replaced_by_a_filter(): void {
		remove_all_filters( 'wp_doing_cron' );
		set_current_screen( 'plugins' );
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

	/* ------------------------------------------- what may install itself */

	/**
	 * A release list, newest first, in the shape the manifest publishes.
	 *
	 * @param array $rows version => [ breaking, autoInstall ].
	 * @return array Release entries.
	 */
	private function releases( array $rows ): array {
		$out = array();
		foreach ( $rows as $version => $flags ) {
			$out[] = array(
				'version'     => (string) $version,
				'breaking'    => ! empty( $flags['breaking'] ),
				'autoInstall' => ! empty( $flags['autoInstall'] ),
				'theme'       => array( 'package' => 'https://example.com/awt-' . $version . '.zip' ),
				'plugin'      => array( 'package' => 'https://example.com/blocks-' . $version . '.zip' ),
			);
		}
		return $out;
	}

	/** The walk stops underneath a breaking release. */
	public function test_the_walk_stops_under_a_breaking_release(): void {
		$target = Updates\auto_install_target(
			array(
				'releases' => $this->releases(
					array(
						'2099.01.3' => array( 'autoInstall' => true ),
						'2099.01.2' => array( 'breaking' => true ),
						'2099.01.1' => array( 'autoInstall' => true ),
					)
				),
			),
			'2099.01.0'
		);

		$this->assertSame( '2099.01.1', $target['version'] );
	}

	/** A manifest with no release list installs nothing. */
	public function test_a_manifest_without_releases_installs_nothing(): void {
		$this->assertNull( Updates\auto_install_target( array(), '2000.01.0' ) );
	}

	/** Unattended, the plugin is offered exactly what it may install. */
	public function test_cron_is_offered_the_target_and_not_the_newest(): void {
		add_filter( 'awt_update_environment', static fn () => 'production' );
		$this->cache(
			'2099.01.3',
			$this->releases(
				array(
					'2099.01.3' => array( 'autoInstall' => true ),
					'2099.01.2' => array( 'breaking' => true ),
					'2099.01.1' => array( 'autoInstall' => true ),
				)
			)
		);

		$result = Updates\offer_update( $this->transient() );
		$key    = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertSame( '2099.01.1', $result->response[ $key ]->new_version );
		$this->assertSame( 'https://example.com/blocks-2099.01.1.zip', $result->response[ $key ]->package );
	}

	/**
	 * With a wall immediately ahead, cron is offered nothing at all.
	 *
	 * The load-bearing one: core installs whatever the entry names, without
	 * asking anybody.
	 */
	public function test_cron_is_offered_nothing_when_the_wall_is_next(): void {
		add_filter( 'awt_update_environment', static fn () => 'production' );
		$this->cache( '2099.01.2', $this->releases( array( '2099.01.2' => array( 'breaking' => true ) ) ) );

		$result = Updates\offer_update( $this->transient() );
		$key    = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertArrayNotHasKey( $key, $result->response );
		$this->assertArrayHasKey( $key, $result->no_update );
	}

	/** A person still sees the newest version, wall or no wall. */
	public function test_the_admin_still_sees_the_newest_version(): void {
		remove_all_filters( 'wp_doing_cron' );
		set_current_screen( 'plugins' );
		$this->cache( '2099.01.2', $this->releases( array( '2099.01.2' => array( 'breaking' => true ) ) ) );

		$result = Updates\offer_update( $this->transient() );
		$key    = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertSame( '2099.01.2', $result->response[ $key ]->new_version );
	}

	/** Nothing installs itself outside production. */
	public function test_cron_installs_nothing_outside_production(): void {
		add_filter( 'awt_update_environment', static fn () => 'staging' );
		$this->cache( '2099.01.1', $this->releases( array( '2099.01.1' => array( 'autoInstall' => true ) ) ) );

		$result = Updates\offer_update( $this->transient() );

		$this->assertArrayNotHasKey( plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE ), $result->response );
	}

	/**
	 * The theme's setting drives the plugin, in both the new shape and the
	 * yes/no it replaced.
	 */
	public function test_the_mode_is_read_from_the_theme_setting(): void {
		update_option( 'awt_theme_settings', (string) wp_json_encode( array( 'updates' => array( 'mode' => 'notify' ) ) ) );
		$this->assertSame( 'notify', Updates\mode() );
		$this->assertTrue( Updates\enabled() );
		$this->assertFalse( Updates\automatic_allowed() );

		update_option( 'awt_theme_settings', (string) wp_json_encode( array( 'updates' => array( 'check' => true ) ) ) );
		$this->assertSame( 'auto', Updates\mode(), 'the pre-2026-09-21 shape still reads' );

		update_option( 'awt_theme_settings', (string) wp_json_encode( array( 'updates' => array( 'check' => false ) ) ) );
		$this->assertSame( 'off', Updates\mode() );

		delete_option( 'awt_theme_settings' );
		$this->assertSame( 'auto', Updates\mode(), 'a site with nothing saved keeps itself up to date' );
	}

	/** WordPress always gets a definite answer for AWT Blocks. */
	public function test_wordpress_is_given_a_definite_answer(): void {
		add_filter( 'awt_update_environment', static fn () => 'production' );
		$key = plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );

		$this->assertTrue( Updates\should_auto_update( null, (object) array( 'plugin' => $key ) ) );
		$this->assertNull(
			Updates\should_auto_update( null, (object) array( 'plugin' => 'akismet/akismet.php' ) ),
			'another plugin is not ours to answer for'
		);
	}

	/**
	 * Put a manifest naming $version straight into the cache.
	 *
	 * @param string $version  Version to announce.
	 * @param array  $releases Optional release list, newest first. Without
	 *                         one nothing can install itself, which is the
	 *                         safe default and what most tests here want.
	 */
	private function cache( string $version, array $releases = array() ): void {
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
					'package'    => 'https://example.com/awt-' . $version . '.zip',
				),
				'plugin'        => array(
					'slug'       => 'awt-blocks',
					'releaseUrl' => 'https://example.com/plugin',
					'package'    => 'https://example.com/blocks-' . $version . '.zip',
				),
				'releases'      => $releases,
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
