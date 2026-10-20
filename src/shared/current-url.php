<?php
/**
 * Current-URL matching for aria-current on navigation blocks.
 *
 * Implements the contract from phase-1 spec §1 "Current-URL matching":
 *   - Normalizes both sides (strip protocol+host when same-origin, trailing
 *     slash, query, fragment; lowercase path).
 *   - Exact match by default; `prefix` opts a nav item into "highlight on any
 *     descendant route."
 *   - Pure server-side; runs in render callbacks.
 *
 * A link to the page being shown is `aria-current="page"`. A section link in
 * prefix mode, on a page beneath it, is `aria-current="true"`: the reader is
 * in that section, not on its page. Search results and 404 pages mark nothing.
 * Home matches only the front page, and a link with a query string matches
 * only a request carrying the same values: the query is otherwise ignored, so
 * `/?s=library` and, with plain permalinks, every `/?page_id=` used to count
 * as Home (outside accessibility review, 2026-10-20).
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
 * Whether the current request carries every query value an href names.
 *
 * An href with no query string asks for nothing, so it always passes.
 *
 * @param string $href Block's href attribute.
 * @return bool
 */
function query_matches( string $href ): bool {
	$wanted_query = (string) wp_parse_url( $href, PHP_URL_QUERY );
	if ( $wanted_query === '' ) {
		return true;
	}

	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
	wp_parse_str( $wanted_query, $wanted );
	wp_parse_str( (string) wp_parse_url( $request_uri, PHP_URL_QUERY ), $have );

	foreach ( $wanted as $key => $value ) {
		if ( ! isset( $have[ $key ] ) || ! is_scalar( $value ) || ! is_scalar( $have[ $key ] ) || (string) $have[ $key ] !== (string) $value ) {
			return false;
		}
	}
	return true;
}

/**
 * How an href relates to the page being shown.
 *
 * Placeholder hrefs ('#', '', '#anchor') never match — they're not navigation.
 *
 * @param string $href Block's href attribute.
 * @param string $mode 'exact' or 'prefix'.
 * @return string|null 'page' for the page being shown, 'true' for a prefix
 *                     link the page sits beneath, null otherwise.
 */
function current_state( string $href, string $mode = 'exact' ): ?string {
	if ( $href === '' || $href === '#' || str_starts_with( $href, '#' ) ) {
		return null;
	}

	// No menu item is a search result or a missing page.
	if ( is_search() || is_404() ) {
		return null;
	}

	$current = current_path();
	if ( $current === '' ) {
		return null;
	}

	$target = normalize( $href );

	// Same string returned by normalize() means the URL was external — skip.
	if ( $target === $href && ( str_contains( $href, '://' ) ) ) {
		return null;
	}

	if ( $target === '' ) {
		$target = '/';
	}

	if ( ! query_matches( $href ) ) {
		return null;
	}

	if ( $target === '/' ) {
		// The request path of every view on a plain-permalink site is "/",
		// so Home needs the front page itself, unless the href names a query.
		$has_query = (string) wp_parse_url( $href, PHP_URL_QUERY ) !== '';
		return ( $current === '/' && ( $has_query || is_front_page() ) ) ? 'page' : null;
	}

	if ( $current === $target ) {
		return 'page';
	}

	if ( $mode === 'prefix' && str_starts_with( $current, $target . '/' ) ) {
		return 'true';
	}

	return null;
}

/**
 * Decide whether an href matches the current request URL: the page itself,
 * or in prefix mode a page beneath it.
 *
 * @param string $href      Block's href attribute.
 * @param string $mode      'exact' or 'prefix'.
 * @return bool
 */
function matches_current( string $href, string $mode = 'exact' ): bool {
	return current_state( $href, $mode ) !== null;
}

/**
 * Keep one aria-current="page" in a navigation, the most specific one.
 *
 * A parent item set to match on prefix now says `aria-current="true"` on the
 * pages beneath it (current_state()). Two items can still both claim the page
 * when one is marked "Always mark as the current page", and a screen reader
 * then announces two current pages in one menu — there is only ever one.
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
