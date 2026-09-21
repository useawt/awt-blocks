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
 * **Every site is served, free included** *(2026-09-21)*. The response
 * carries the package, so a site on the default setting keeps itself up to
 * date, stopping at a release the changelog marks `[Breaking]`. The rule and
 * the reasoning live in the theme's `inc/updates.php`; this half carries the
 * same walk because the plugin has to work when AWT is not the active theme.
 *
 * Superseded, kept for the shape of the old design: the response carried no package URL,
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
add_filter( 'auto_update_plugin', __NAMESPACE__ . '\\should_auto_update', 10, 2 );
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
	return (bool) apply_filters( 'awt_update_check_enabled', mode() !== 'off' );
}

/**
 * How this site handles a new AWT: 'auto', 'notify' or 'off'.
 *
 * Read straight out of the theme's settings row rather than through the
 * theme's own code, for the reason above: the plugin can be active under
 * another theme, and a site with nothing saved yet has to default to on.
 *
 * `updates.check` is the pre-2026-09-21 shape — a yes/no. A site that had it
 * on becomes 'auto' and one that had it off becomes 'off', which is the same
 * mapping the theme's schema migration performs.
 *
 * @return string One of: auto | notify | off.
 */
function mode(): string {
	$raw = get_option( 'awt_theme_settings', array() );
	if ( is_string( $raw ) ) {
		$decoded = json_decode( $raw, true );
		$raw     = is_array( $decoded ) ? $decoded : array();
	}
	$updates = is_array( $raw ) ? ( $raw['updates'] ?? array() ) : array();

	$mode = (string) ( $updates['mode'] ?? '' );
	if ( in_array( $mode, array( 'auto', 'notify', 'off' ), true ) ) {
		return $mode;
	}
	if ( array_key_exists( 'check', (array) $updates ) ) {
		return empty( $updates['check'] ) ? 'off' : 'auto';
	}
	return 'auto';
}

/**
 * Whether this site may install an update without being asked.
 *
 * The theme's `inc/updates.php` documents what each of these refusals is
 * for. Duplicated rather than shared because the plugin has to answer the
 * same question on a site where AWT is not the active theme.
 *
 * @return bool True when AWT Blocks may install its own updates here.
 */
function automatic_allowed(): bool {
	$deployed = defined( 'AWT_DEPLOYED_FROM_SOURCE' ) && AWT_DEPLOYED_FROM_SOURCE;
	if ( apply_filters( 'awt_deployed_from_source', $deployed ) ) {
		return false;
	}
	if ( mode() !== 'auto' ) {
		return false;
	}
	$environment = function_exists( 'wp_get_environment_type' ) ? wp_get_environment_type() : 'production';
	return (string) apply_filters( 'awt_update_environment', $environment ) === 'production';
}

/**
 * The newest release this site may install by itself right now, or null.
 *
 * The same four-line walk as the theme's, against the same list: step up from
 * the installed version, stop at the first breaking release, stop at the
 * first that has not soaked, take the last one that passed.
 *
 * @param array  $data      Decoded manifest.
 * @param string $installed The version running here.
 * @return array|null The release entry to install, or null for none.
 */
function auto_install_target( array $data, string $installed ): ?array {
	$releases = $data['releases'] ?? null;
	if ( ! is_array( $releases ) ) {
		return null;
	}

	$target = null;
	foreach ( array_reverse( $releases ) as $release ) {
		$version = (string) ( $release['version'] ?? '' );
		if ( $version === '' || version_compare( $version, $installed, '<=' ) ) {
			continue;
		}
		if ( ! empty( $release['breaking'] ) || empty( $release['autoInstall'] ) ) {
			break;
		}
		$target = $release;
	}
	return $target;
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

	$offer   = $latest;
	$package = (string) ( $data['plugin']['package'] ?? '' );

	if ( wp_doing_cron() ) {
		/*
		 * The unattended path, and the only place the breaking hold can be
		 * enforced. Core installs whatever this entry names without asking
		 * anybody, so during cron it must name only what this site may
		 * install by itself, or nothing at all. Every human-facing screen
		 * still sees the newest version, because this filter runs on each
		 * read rather than on the stored value.
		 */
		$target = automatic_allowed() ? auto_install_target( $data, $installed ) : null;
		if ( null === $target ) {
			$transient->no_update[ $key ] = current_entry( $key, $installed, $data );
			unset( $transient->response[ $key ] );
			return $transient;
		}
		$offer   = (string) $target['version'];
		$package = (string) ( $target['plugin']['package'] ?? '' );
	}

	$entry = (object) array(
		'id'            => 'useawt.com/plugins/awt-blocks',
		'slug'          => slug(),
		'plugin'        => $key,
		'new_version'   => $offer,
		'url'           => (string) ( $data['plugin']['releaseUrl'] ?? '' ),
		// Served to every site since 2026-09-21 — see the file docblock.
		'package'       => (string) apply_filters( 'awt_blocks_update_package', $package, $data ),
		'requires'      => (string) ( $data['requiresWp'] ?? '' ),
		'requires_php'  => (string) ( $data['requiresPhp'] ?? '' ),
		'tested'        => (string) ( $data['testedWp'] ?? '' ),
		'icons'         => array(),
		'banners'       => array(),
		'banners_rtl'   => array(),
		'compatibility' => new \stdClass(),
	);

	if ( version_compare( $installed, $offer, '<' ) ) {
		$transient->response[ $key ] = $entry;
		unset( $transient->no_update[ $key ] );
	} else {
		$transient->no_update[ $key ] = current_entry( $key, $installed, $data );
		unset( $transient->response[ $key ] );
	}

	return $transient;
}

/**
 * The "checked, and up to date" entry.
 *
 * Core reads `no_update` to know a plugin was looked at. Without it the
 * Plugins screen can say nothing about AWT Blocks at all.
 *
 * @param string $key       Plugin basename.
 * @param string $installed Version running here.
 * @param array  $data      Decoded manifest.
 * @return object Entry for the no_update list.
 */
function current_entry( string $key, string $installed, array $data ): object {
	return (object) array(
		'id'            => 'useawt.com/plugins/awt-blocks',
		'slug'          => slug(),
		'plugin'        => $key,
		'new_version'   => $installed,
		'url'           => (string) ( $data['plugin']['releaseUrl'] ?? '' ),
		'package'       => '',
		'requires'      => (string) ( $data['requiresWp'] ?? '' ),
		'requires_php'  => (string) ( $data['requiresPhp'] ?? '' ),
		'tested'        => (string) ( $data['testedWp'] ?? '' ),
		'icons'         => array(),
		'banners'       => array(),
		'banners_rtl'   => array(),
		'compatibility' => new \stdClass(),
	);
}

/**
 * Answer WordPress's "should this update itself?" question for AWT Blocks.
 *
 * Always a boolean rather than null, which takes the per-plugin toggle off
 * the Plugins screen and replaces it with plain text, so AWT Settings is the
 * only place the answer can be changed.
 *
 * @param bool|null $update Core's answer so far.
 * @param mixed     $item   The update offer.
 * @return bool|null Ours for AWT Blocks, core's for everything else.
 */
function should_auto_update( $update, $item ) {
	$plugin = is_object( $item ) ? ( $item->plugin ?? '' ) : ( is_array( $item ) ? ( $item['plugin'] ?? '' ) : '' );
	if ( $plugin !== basename_key() ) {
		return $update;
	}
	return automatic_allowed();
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
			__( 'This version of AWT Blocks cannot be downloaded automatically. Get it from the AWT website and upload it in Plugins, Add Plugin, Upload Plugin, choosing "Replace current with uploaded". Your settings, pages and content are kept. %s', 'awt-blocks' ),
			'https://useawt.com/faq/#updating'
		)
	);
}
