<?php
/**
 * Current-URL matching for aria-current="page" on navigation blocks.
 *
 * Implements the contract from phase-1 spec §1 "Current-URL matching":
 *   - Normalizes both sides (strip protocol+host when same-origin, trailing
 *     slash, query, fragment; lowercase path).
 *   - Exact match by default; `prefix` opts a nav item into "highlight on any
 *     descendant route."
 *   - Pure server-side; runs in render callbacks.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\CurrentUrl;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Normalize a URL or path to a comparable path-only form.
 *
 * Steps (in order):
 *   1. Strip protocol + host if the host matches the current site's host.
 *      Absolute URLs to a different host are returned as-is and will not match.
 *   2. Strip query string.
 *   3. Strip fragment.
 *   4. Strip trailing slash (except for the root "/").
 *   5. Lowercase the path.
 *
 * Language prefixes (WPML/Polylang) are NOT stripped — see spec §1
 * "Normalization rules → Language prefixes".
 *
 * @param string $url URL or relative path to normalize.
 * @return string Normalized path-only form. Returns the original string
 *                unchanged if it parses to an external host.
 */
function normalize( string $url ): string {
	if ( $url === '' ) {
		return '';
	}

	$site_host = wp_parse_url( home_url( '/' ), PHP_URL_HOST );
	$parsed    = wp_parse_url( $url );

	if ( ! is_array( $parsed ) ) {
		return $url;
	}

	// External URL — never matches.
	if ( isset( $parsed['host'] ) && $parsed['host'] !== $site_host ) {
		return $url;
	}

	$path = isset( $parsed['path'] ) ? (string) $parsed['path'] : '';

	if ( $path === '' ) {
		$path = '/';
	}

	// Trailing slash strip (preserve root).
	if ( $path !== '/' && substr( $path, -1 ) === '/' ) {
		$path = rtrim( $path, '/' );
	}

	return strtolower( $path );
}

/**
 * Get the current request URL normalized to comparison form.
 *
 * @return string
 */
function current_path(): string {
	if ( is_admin() ) {
		return '';
	}

	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '/';

	return normalize( $request_uri );
}

/**
 * Decide whether an href matches the current request URL.
 *
 * Placeholder hrefs ('#', '', '#anchor') never match — they're not navigation.
 *
 * @param string $href      Block's href attribute.
 * @param string $mode      'exact' or 'prefix'.
 * @return bool
 */
function matches_current( string $href, string $mode = 'exact' ): bool {
	if ( $href === '' || $href === '#' || str_starts_with( $href, '#' ) ) {
		return false;
	}

	$current = current_path();
	if ( $current === '' ) {
		return false;
	}

	$target = normalize( $href );

	// Same string returned by normalize() means the URL was external — skip.
	if ( $target === $href && ( str_contains( $href, '://' ) ) ) {
		return false;
	}

	if ( $mode === 'prefix' ) {
		if ( $target === '' || $target === '/' ) {
			return $current === '/';
		}
		return $current === $target || str_starts_with( $current, $target . '/' );
	}

	// Exact match mode.
	if ( $target === '' ) {
		return $current === '/';
	}
	return $current === $target;
}

/**
 * Keep one aria-current="page" in a navigation, the most specific one.
 *
 * A parent item set to match on prefix stays highlighted while the reader is
 * on any page beneath it, which is what makes a section readable at a glance.
 * On the child's own page both then claim `aria-current="page"`, and a screen
 * reader announces two current pages in one menu — there is only ever one.
 *
 * Only an ancestor loses the attribute: an item whose path another current
 * item sits beneath. Two current items that are not related that way are left
 * alone, because nothing here can tell which the author meant.
 *
 * @param string $html Rendered navigation items.
 * @return string The same markup with ancestors' aria-current removed.
 */
function only_most_specific_current( string $html ): string {
	if ( substr_count( $html, 'aria-current="page"' ) < 2 ) {
		return $html;
	}

	// Collect the path of every link claiming to be the current page.
	$paths = array();
	if ( preg_match_all( '/<a\b[^>]*>/i', $html, $tags ) ) {
		foreach ( $tags[0] as $tag ) {
			if ( ! str_contains( $tag, 'aria-current="page"' ) ) {
				continue;
			}
			if ( preg_match( '/\shref="([^"]*)"/i', $tag, $m ) ) {
				$paths[] = normalize( html_entity_decode( $m[1], ENT_QUOTES, 'UTF-8' ) );
			}
		}
	}

	if ( count( $paths ) < 2 ) {
		return $html;
	}

	return (string) preg_replace_callback(
		'/<a\b[^>]*>/i',
		static function ( array $m ) use ( $paths ): string {
			$tag = $m[0];
			if ( ! str_contains( $tag, 'aria-current="page"' ) ) {
				return $tag;
			}
			if ( ! preg_match( '/\shref="([^"]*)"/i', $tag, $href ) ) {
				return $tag;
			}
			$path = normalize( html_entity_decode( $href[1], ENT_QUOTES, 'UTF-8' ) );
			foreach ( $paths as $other ) {
				if ( $other !== $path && str_starts_with( $other, $path . '/' ) ) {
					// Something deeper is also current, so this is the trail.
					return (string) preg_replace( '/\s*aria-current="page"/i', '', $tag );
				}
			}
			return $tag;
		},
		$html
	);
}
