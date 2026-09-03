<?php
/**
 * Telling a site there is a newer AWT Blocks.
 *
 * The plugin half of the update check. It reads the same file the theme reads
 * — `https://useawt.com/updates/v1/awt.json` — and hands the answer to
 * WordPress's own update machinery, so the site owner sees the ordinary "new
 * version available" notice on Dashboard → Updates and on the Plugins screen.
 *
 * The reasoning behind the shape lives in the theme's `inc/updates.php`, and
 * three points of it are repeated here because they are easy to undo by
 * accident:
 *
 * **The request says nothing about the site.** WordPress's default User-Agent
 * carries the site's own address. It is overridden below. No query string, no
 * POST body, no cookies: a plain GET of a file that is identical for everyone.
 *
 * **The free tier is told, not served.** The response carries no package URL,
 * which is what makes WordPress print "Automatic update is unavailable for
 * this plugin" beside a link to the release instead of a button that could not
 * work. `awt_blocks_update_package` is the seam an AWT Premium licence fills
 * in, and one-click then works with no other change.
 *
 * **One version for the pair.** The manifest names one version for the theme
 * and the plugin together, so the two halves can never point a site at
 * different versions.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\Updates;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The published manifest. The schema version is in the path — see the theme. */
const MANIFEST_URL = 'https://useawt.com/updates/v1/awt.json';

/**
 * Cache key for the parsed manifest.
 *
 * Deliberately the same key the AWT theme uses, so a site makes one request
 * per half-day rather than one per half. If the two ever drift the only cost
 * is a second request.
 */
const CACHE_KEY = 'awt_update_manifest';

/** How long a good answer is kept. */
const CACHE_TTL = 12 * HOUR_IN_SECONDS;

/** How long a failure is kept, so an unreachable endpoint is not paid for twice. */
const CACHE_TTL_FAILED = HOUR_IN_SECONDS;

/** Seconds to wait for the manifest before giving up. */
const TIMEOUT = 5;

add_filter( 'site_transient_update_plugins', __NAMESPACE__ . '\\offer_update' );
add_filter( 'plugins_api', __NAMESPACE__ . '\\details', 10, 3 );
add_action( 'in_plugin_update_message-awt-blocks/awt-blocks.php', __NAMESPACE__ . '\\pair_note' ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- core names this hook after the plugin file.
add_filter( 'upgrader_pre_download', __NAMESPACE__ . '\\explain_manual_update', 10, 4 );

/**
 * Whether this site checks for updates at all.
 *
 * The switch lives in AWT Settings → Tools, which belongs to the theme, and is
 * stored in the theme's settings row. This reads that row directly rather than
 * calling into the theme: the plugin can be active under another theme, and a
 * site with no AWT settings saved yet has to default to on.
 */
function enabled(): bool {
	$raw = get_option( 'awt_theme_settings', array() );
	if ( is_string( $raw ) ) {
		$decoded = json_decode( $raw, true );
		$raw     = is_array( $decoded ) ? $decoded : array();
	}
	$stored = is_array( $raw ) ? ( $raw['updates']['check'] ?? null ) : null;
	$on     = $stored === null ? true : (bool) $stored;

	return (bool) apply_filters( 'awt_update_check_enabled', $on );
}

/**
 * Whether the current request is one that should spend time on a network call.
 *
 * Never on a visitor's page load. Admin screens, WP-Cron and WP-CLI only.
 */
function should_check(): bool {
	return is_admin() || wp_doing_cron() || ( defined( 'WP_CLI' ) && WP_CLI );
}

/**
 * The published manifest, or null when it cannot be read.
 *
 * @return array|null Decoded manifest.
 */
function manifest(): ?array {
	if ( ! enabled() || ! should_check() ) {
		return null;
	}

	$cached = get_site_transient( CACHE_KEY );
	if ( is_array( $cached ) ) {
		return $cached;
	}
	if ( $cached === 'failed' ) {
		return null;
	}

	$url = (string) apply_filters( 'awt_update_manifest_url', MANIFEST_URL );

	$response = wp_remote_get(
		$url,
		array(
			'timeout'    => TIMEOUT,
			// Not the default, which is `WordPress/6.8; https://example.com` —
			// this site's own address, on every check. Set as the documented
			// argument rather than as a header, so the default is not left
			// sitting in the request arguments.
			'user-agent' => 'AWT',
		)
	);

	$data = parse( $response );
	if ( $data === null ) {
		set_site_transient( CACHE_KEY, 'failed', CACHE_TTL_FAILED );
		return null;
	}

	set_site_transient( CACHE_KEY, $data, CACHE_TTL );
	return $data;
}

/**
 * Turn an HTTP response into a manifest, or null if it is not one.
 *
 * Strict on purpose: a truncated body, or a captive portal answering 200 with
 * a login page, must not be able to announce a version.
 *
 * @param array|\WP_Error $response Result of wp_remote_get().
 * @return array|null Manifest, or null.
 */
function parse( $response ): ?array {
	if ( is_wp_error( $response ) || (int) wp_remote_retrieve_response_code( $response ) !== 200 ) {
		return null;
	}
	$data = json_decode( (string) wp_remote_retrieve_body( $response ), true );
	if ( ! is_array( $data ) ) {
		return null;
	}
	if ( (int) ( $data['schemaVersion'] ?? 0 ) !== 1 ) {
		return null;
	}
	$version = (string) ( $data['version'] ?? '' );
	if ( ! preg_match( '/^\d{4}\.\d{2}\.\d+$/', $version ) ) {
		return null;
	}
	return $data;
}

/** The plugin's `directory/file.php` key, which is how WordPress names it. */
function basename_key(): string {
	return plugin_basename( \AWT\Blocks\AWT_BLOCKS_FILE );
}

/** The plugin's directory name. */
function slug(): string {
	return dirname( basename_key() );
}

/**
 * Add AWT Blocks to WordPress's list of plugins with an update available.
 *
 * @param mixed $transient The update_plugins site transient.
 * @return mixed The same, with AWT Blocks' answer filled in.
 */
function offer_update( $transient ) {
	if ( ! is_object( $transient ) ) {
		return $transient;
	}

	$data = manifest();
	if ( $data === null ) {
		return $transient;
	}

	$key       = basename_key();
	$installed = \AWT\Blocks\AWT_BLOCKS_VERSION;
	$latest    = (string) $data['version'];

	$entry = (object) array(
		'id'            => 'useawt.com/plugins/awt-blocks',
		'slug'          => slug(),
		'plugin'        => $key,
		'new_version'   => $latest,
		'url'           => (string) ( $data['plugin']['releaseUrl'] ?? '' ),
		// Empty on the free tier — see the file docblock.
		'package'       => (string) apply_filters( 'awt_blocks_update_package', '', $data ),
		'requires'      => (string) ( $data['requiresWp'] ?? '' ),
		'requires_php'  => (string) ( $data['requiresPhp'] ?? '' ),
		'tested'        => (string) ( $data['testedWp'] ?? '' ),
		'icons'         => array(),
		'banners'       => array(),
		'banners_rtl'   => array(),
		'compatibility' => new \stdClass(),
	);

	if ( version_compare( $installed, $latest, '<' ) ) {
		$transient->response[ $key ] = $entry;
		unset( $transient->no_update[ $key ] );
	} else {
		// Core reads no_update to know a plugin was checked and is current.
		// Without it the Plugins screen can say nothing about AWT Blocks.
		$entry->new_version           = $installed;
		$transient->no_update[ $key ] = $entry;
		unset( $transient->response[ $key ] );
	}

	return $transient;
}

/**
 * Answer the "View version details" link locally.
 *
 * That link opens WordPress's own details window, which normally asks
 * WordPress.org. WordPress.org has never heard of AWT Blocks, so without this
 * the window shows an error. The changelog it needs already sits on disk in
 * `build/changelog.json`, written at release, so the window opens with no
 * network call.
 *
 * @param mixed  $result Whatever an earlier filter returned.
 * @param string $action The plugins_api action being performed.
 * @param object $args   Its arguments.
 * @return mixed An info object for AWT Blocks, or $result untouched.
 */
function details( $result, $action, $args ) {
	if ( $action !== 'plugin_information' || ( $args->slug ?? '' ) !== slug() ) {
		return $result;
	}

	$data = manifest();

	return (object) array(
		'name'          => 'AWT Blocks',
		'slug'          => slug(),
		'version'       => (string) ( $data['version'] ?? \AWT\Blocks\AWT_BLOCKS_VERSION ),
		'author'        => '<a href="https://useawt.com">AWT</a>',
		'homepage'      => 'https://useawt.com',
		'requires'      => (string) ( $data['requiresWp'] ?? '' ),
		'requires_php'  => (string) ( $data['requiresPhp'] ?? '' ),
		'tested'        => (string) ( $data['testedWp'] ?? '' ),
		'download_link' => '',
		'sections'      => array(
			'changelog' => changelog_html(),
		),
		'external'      => true,
	);
}

/**
 * The bundled changelog as HTML for the details window.
 */
function changelog_html(): string {
	$file = \AWT\Blocks\AWT_BLOCKS_DIR . '/build/changelog.json';
	if ( ! is_readable( $file ) ) {
		return '<p>' . esc_html__( 'No changelog is bundled with this copy of AWT Blocks.', 'awt-blocks' ) . '</p>';
	}
	$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local plugin file.
	if ( ! is_array( $data ) || empty( $data['releases'] ) ) {
		return '<p>' . esc_html__( 'No changelog is bundled with this copy of AWT Blocks.', 'awt-blocks' ) . '</p>';
	}

	$html = '';
	foreach ( array_slice( (array) $data['releases'], 0, 10 ) as $release ) {
		$html .= '<h4>' . esc_html( (string) ( $release['version'] ?? '' ) );
		if ( ! empty( $release['date'] ) ) {
			$html .= ' — ' . esc_html( (string) $release['date'] );
		}
		$html .= '</h4><ul>';
		foreach ( (array) ( $release['entries'] ?? array() ) as $entry ) {
			$text  = trim( (string) ( $entry['summary'] ?? '' ) . ' ' . (string) ( $entry['details'] ?? '' ) );
			$html .= '<li>';
			if ( ! empty( $entry['severity'] ) ) {
				$html .= '<strong>[' . esc_html( (string) $entry['severity'] ) . ']</strong> ';
			}
			// The changelog is written in a little Markdown — bold and code
			// spans. Escape first, then turn those two into markup, or people
			// are shown literal asterisks.
			$out   = esc_html( $text );
			$out   = (string) preg_replace( '/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $out );
			$out   = (string) preg_replace( '/`([^`]+)`/', '<code>$1</code>', $out );
			$html .= $out . '</li>';
		}
		$html .= '</ul>';
	}
	return $html;
}

/**
 * Append the pair reminder to the update row on the Plugins screen.
 *
 * The theme and the plugin are one product in two halves, and a site running
 * one updated half is running a combination nobody tested.
 */
function pair_note(): void {
	echo ' <strong>' . esc_html__( 'Update the AWT theme and the AWT Blocks plugin together — they are built as a pair.', 'awt-blocks' ) . '</strong>';
}

/**
 * Say what to do when someone presses "Update" anyway.
 *
 * Dashboard → Updates puts a checkbox beside every plugin with an update,
 * whether or not a package came with it. Ticking AWT Blocks' and pressing the
 * button would otherwise end at WordPress's own "Update package not
 * available." — true, and no help at all. This replaces it with the next step.
 *
 * A licensed AWT Premium site never reaches here: it has a package, so
 * WordPress downloads it and this filter passes the request straight through.
 *
 * @param mixed  $reply      False to carry on downloading.
 * @param string $package    The package URL, empty on the free tier.
 * @param object $upgrader   The upgrader running.
 * @param array  $hook_extra What is being updated.
 * @return mixed False, or a WP_Error explaining the manual step.
 */
function explain_manual_update( $reply, $package, $upgrader, $hook_extra = array() ) {
	if ( $package !== '' || ( $hook_extra['plugin'] ?? '' ) !== basename_key() ) {
		return $reply;
	}

	return new \WP_Error(
		'awt_manual_update',
		sprintf(
			/* translators: %s: URL of the update instructions. */
			__( 'AWT Blocks does not install its own updates. Download the new version and upload it in Plugins, Add Plugin, Upload Plugin, choosing "Replace current with uploaded". Step-by-step instructions: %s', 'awt-blocks' ),
			'https://useawt.com/faq/#updating'
		)
	);
}
