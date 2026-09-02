<?php
/**
 * Shared render helpers for AWT blocks.
 *
 * Each block's render.php delegates to functions here for:
 *   - generating stable per-instance ids
 *   - building Carbon-prefixed class strings from semantic attribute values
 *   - inlining Carbon icon SVGs
 *   - wiring aria-describedby across helper/invalid/warn text fragments
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\Render;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Generate a stable, unique-ish DOM id for the current request.
 *
 * Block render functions call this once per logical element that needs an id
 * (input, helper-text wrapper, invalid-text wrapper, tooltip content, etc.) so
 * label/for and aria-describedby references can be wired up.
 *
 * The id is stable within a single render pass only; do not persist across requests.
 *
 * @param string $prefix Short string identifying what the id is for (e.g. 'awt-checkbox').
 * @return string An id like 'awt-checkbox-7'.
 */
function unique_id( string $prefix = 'awt' ): string {
	static $counter = 0;
	++$counter;
	return $prefix . '-' . $counter;
}

/**
 * Render a Carbon icon as an inline SVG string.
 *
 * Lookup order (first match wins):
 *
 *   1. Inline registry — 10 hardcoded Stage 0 paths kept so the plugin renders
 *      icons even when @carbon/icons isn't available on disk (extracted
 *      build/ folder, scrubbed node_modules, etc.).
 *   2. @carbon/icons SVG files at node_modules/@carbon/icons/svg/<size>/<name>.svg.
 *      Tries the requested size first, then 16 / 20 / 24 / 32. Carbon's SVGs
 *      are vector; a 32px source rendered at width=16 height=16 is fine.
 *   3. Single-dash → double-dash alias normalization. Carbon's filenames use
 *      `--` between words (`arrow--right.svg`); legacy AWT content uses
 *      single dashes (`arrow-right`). Both resolve to the same SVG.
 *
 * Returns aria-hidden — the surrounding element supplies the accessible name
 * when the icon is informative. Callers override aria-hidden when they wire
 * role="img" + aria-label (see awt/icon's render).
 *
 * @param string $name        Icon token (e.g., 'search', 'arrow--right', 'arrow-right').
 * @param int    $size        Pixel width/height to apply on the rendered SVG.
 * @param string $extra_class Optional extra class name(s) added to the rendered <svg>.
 *                            Carbon often expects a specific class on inline SVGs
 *                            (e.g., `cds--btn__icon` for chevrons inside buttons).
 * @return string SVG markup, or empty string when the name isn't known.
 */
function icon( string $name, int $size = 16, string $extra_class = '' ): string {
	$normalized = strtolower( $name );

	// 1. Prefer @carbon/icons on disk — those are the authoritative SVGs.
	$file = _resolve_carbon_icon_file( $normalized, $size );
	if ( $file !== null ) {
		return _read_carbon_icon( $file, $size, $extra_class );
	}

	// 2. Single-dash → double-dash retry (legacy `arrow-right` → `arrow--right`).
	if ( str_contains( $normalized, '-' ) && ! str_contains( $normalized, '--' ) ) {
		$alt = preg_replace( '/(?<!-)-(?!-)/', '--', $normalized );
		if ( is_string( $alt ) && $alt !== $normalized ) {
			$file = _resolve_carbon_icon_file( $alt, $size );
			if ( $file !== null ) {
				return _read_carbon_icon( $file, $size, $extra_class );
			}
		}
	}

	// 3. Inline fallback registry — small set of hardcoded paths so the plugin
	// can still render the most common icons when @carbon/icons isn't on disk
	// (someone extracted just the build/ folder, scrubbed node_modules, etc.).
	$inline_paths = array(
		'chevron-down' => '<path d="M8 11L3 6l.7-.7L8 9.6l4.3-4.3.7.7z"/>',
		'chevron-up'   => '<path d="M8 5l5 5-.7.7L8 6.4 3.7 10.7 3 10z"/>',
		'arrow-right'  => '<path d="M11.8 8l-4-4-.7.7L10.4 8l-3.3 3.3.7.7z"/>',
		'arrow-left'   => '<path d="M4.2 8l4 4 .7-.7L5.6 8l3.3-3.3-.7-.7z"/>',
		'close'        => '<path d="M12 4.7L11.3 4 8 7.3 4.7 4 4 4.7 7.3 8 4 11.3l.7.7L8 8.7l3.3 3.3.7-.7L8.7 8z"/>',
		'checkmark'    => '<path d="M6.5 11.5L3 8l.7-.7 2.8 2.8 5.8-5.8.7.7z"/>',
		'warning'      => '<path d="M8 1L0 15h16zm0 12.5a.75.75 0 110-1.5.75.75 0 010 1.5zM7.5 11V6h1v5z"/>',
		'warning--alt' => '<path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 13a6 6 0 110-12 6 6 0 010 12zM7.5 11V6h1v5zM8 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/>',
		'information'  => '<path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 13a6 6 0 110-12 6 6 0 010 12zM7.5 7h1v5h-1zM8 4.5a.75.75 0 100 1.5.75.75 0 000-1.5z"/>',
		'launch'       => '<path d="M13 14H3a1 1 0 01-1-1V3a1 1 0 011-1h4v1H3v10h10V9h1v4a1 1 0 01-1 1z"/><path d="M10 1v1h3.3l-5.6 5.7.7.7L14 2.7V6h1V1z"/>',
	);

	if ( isset( $inline_paths[ $normalized ] ) ) {
		$class_attr = $extra_class !== '' ? sprintf( ' class="%s"', esc_attr( $extra_class ) ) : '';
		return sprintf(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="%1$d" height="%1$d" fill="currentColor" aria-hidden="true" focusable="false"%3$s>%2$s</svg>',
			$size,
			$inline_paths[ $normalized ],
			$class_attr
		);
	}

	return '';
}

/**
 * Resolve the on-disk path of a Carbon SVG.
 *
 * Two sources, in order: `@carbon/icons` in node_modules (development
 * installs), then the SVG set the build copies into
 * `build/shared/carbon-icons/` (scripts/copy-carbon-icons.js) — installed
 * copies of the plugin have no node_modules, so the bundled set is what
 * production actually reads. The bundled path is anchored on the plugin
 * root (not __DIR__): awt-blocks.php loads these helpers from src/shared/
 * when that copy exists, and both src/shared/ and build/shared/ sit two
 * levels below the root.
 * Tries the requested size first, then progressively larger Carbon-shipped
 * sizes. Returns null if no file exists at any size.
 *
 * @internal
 *
 * @param string $name Carbon icon token (e.g. 'arrow--right').
 * @param int    $size Requested pixel size.
 */
function _resolve_carbon_icon_file( string $name, int $size ): ?string {
	$bases     = array(
		dirname( __DIR__, 2 ) . '/node_modules/@carbon/icons/svg',
		dirname( __DIR__, 2 ) . '/build/shared/carbon-icons',
	);
	$try_sizes = array_unique( array( $size, 16, 20, 24, 32 ) );
	foreach ( $bases as $base ) {
		if ( ! is_dir( $base ) ) {
			continue;
		}
		foreach ( $try_sizes as $s ) {
			$path = $base . '/' . $s . '/' . $name . '.svg';
			if ( is_file( $path ) ) {
				return $path;
			}
		}
		// A few icons ship size-independent, directly in the svg root
		// (caution, circle-fill, …).
		$path = $base . '/' . $name . '.svg';
		if ( is_file( $path ) ) {
			return $path;
		}
	}
	return null;
}

/**
 * Read a Carbon SVG from disk, rewrite the root <svg> tag so it renders at the
 * size we want regardless of the source file's native viewBox, and tag it
 * aria-hidden + focusable=false. Per-request memo cache prevents repeated
 * reads when the same icon appears multiple times on one page.
 *
 * @internal
 *
 * @param string $file        Absolute path to the SVG file.
 * @param int    $size        Pixel size to render at.
 * @param string $extra_class Extra class for the root <svg> tag.
 */
function _read_carbon_icon( string $file, int $size, string $extra_class = '' ): string {
	static $cache = array();
	$key          = $file . '@' . $size . '@' . $extra_class;
	if ( isset( $cache[ $key ] ) ) {
		return $cache[ $key ];
	}

	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local plugin-bundled SVG, not a remote URL; WP_Filesystem is overkill for a read-only asset.
	$svg = file_get_contents( $file );
	if ( $svg === false ) {
		return '';
	}

	// Extract the source viewBox so we don't blow up icons that ship with
	// 0 0 16 16 viewBoxes. Defaults to 0 0 32 32 (Carbon's canonical source).
	$viewbox = '0 0 32 32';
	if ( preg_match( '/viewBox="([^"]+)"/', $svg, $m ) ) {
		$viewbox = $m[1];
	}

	$class_attr = $extra_class !== '' ? sprintf( ' class="%s"', esc_attr( $extra_class ) ) : '';
	$svg        = (string) preg_replace(
		'/<svg\b[^>]*>/',
		sprintf(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="%1$s" width="%2$d" height="%2$d" fill="currentColor" aria-hidden="true" focusable="false"%3$s>',
			esc_attr( $viewbox ),
			$size,
			$class_attr
		),
		$svg,
		1
	);

	$cache[ $key ] = $svg;
	return $svg;
}

/**
 * Build an HTML attribute string from a name=>value map, escaping each value.
 *
 * Booleans render as bare attributes when true and are omitted when false.
 * Null and empty-string values are omitted. Everything else is esc_attr()'d.
 *
 * @param array<string, mixed> $attrs Attribute map.
 * @return string Space-prefixed attribute string suitable for inlining in HTML.
 */
function html_attrs( array $attrs ): string {
	$out = '';
	foreach ( $attrs as $name => $value ) {
		if ( $value === null || $value === '' || $value === false ) {
			continue;
		}
		if ( $value === true ) {
			$out .= ' ' . esc_attr( $name );
			continue;
		}
		$out .= ' ' . esc_attr( $name ) . '="' . esc_attr( (string) $value ) . '"';
	}
	return $out;
}

/**
 * Compute the rel="" attribute value for a link, defaulting to safe values for
 * external-target links.
 *
 * @param string $target HTML target attribute value (e.g., '_blank').
 * @param string $rel    User-supplied rel value (wins if non-empty).
 * @return string Final rel value (may be empty).
 */
function compute_rel( string $target, string $rel ): string {
	if ( $rel !== '' ) {
		return $rel;
	}
	if ( $target === '_blank' ) {
		return 'noopener noreferrer';
	}
	return '';
}

/**
 * Allowlist of inline formatting tags retained in imported / free-text content
 * (e.g. data-table cells). Deliberately tight: links, emphasis, inline code,
 * line breaks, and images — each with only safe attributes. Every other tag is
 * dropped and ALL class / style / id / data-* / on* attributes are stripped.
 *
 * SVG is intentionally NOT allowed: it's the highest XSS surface for pasted
 * markup, and wp_kses lowercases attribute names (breaking `viewBox` etc.), so
 * it can't be sanitized correctly here anyway. Authors use the awt/icon block
 * (vetted Carbon icon set) for icons.
 *
 * @return array<string, array<string, bool>>
 */
function inline_kses_allowed(): array {
	return array(
		'a'      => array(
			'href'   => true,
			'title'  => true,
			'target' => true,
			'rel'    => true,
		),
		'strong' => array(),
		'b'      => array(),
		'em'     => array(),
		'i'      => array(),
		'code'   => array(),
		'br'     => array(),
		'img'    => array(
			'src'    => true,
			'alt'    => true,
			'width'  => true,
			'height' => true,
		),
	);
}

/**
 * Sanitize a string down to the inline allowlist above. wp_kses also enforces
 * WordPress's allowed-protocol list on href/src, so `javascript:` and other
 * unsafe URL schemes are dropped. This is the real security boundary for any
 * stored block attribute that is echoed into a page.
 *
 * @param string $html Untrusted HTML.
 * @return string Sanitized HTML.
 */
function kses_inline( string $html ): string {
	return wp_kses( $html, inline_kses_allowed() );
}

/**
 * Compose a Carbon BEM-style class list from a base class and modifier suffixes.
 *
 * Example: classnames('cds--btn', ['primary', 'lg']) -> 'cds--btn cds--btn--primary cds--btn--lg'.
 *
 * @param string             $base       Base Carbon class (e.g., 'cds--btn').
 * @param array<int, string> $modifiers  Modifier suffixes (without the leading '--').
 *                                       Empty / null entries are skipped.
 * @param string             $extra      Optional extra classes appended verbatim.
 * @return string Space-joined class string.
 */
function classnames( string $base, array $modifiers = array(), string $extra = '' ): string {
	$out = array( $base );
	foreach ( $modifiers as $mod ) {
		if ( $mod === null || $mod === '' ) {
			continue;
		}
		$out[] = $base . '--' . $mod;
	}
	if ( $extra !== '' ) {
		$out[] = $extra;
	}
	return implode( ' ', $out );
}

/**
 * Join a list of ids into a single space-separated string suitable for aria-describedby,
 * skipping empties.
 *
 * @param array<int, string> $ids Possibly-empty id list.
 * @return string
 */
function describedby( array $ids ): string {
	$ids = array_values( array_filter( $ids, static fn( $id ): bool => is_string( $id ) && $id !== '' ) );
	return implode( ' ', $ids );
}

/**
 * The wrapper class that draws a form field's boundary on all four sides.
 *
 * Carbon gives a field a fill plus a single rule under the text, and expects
 * the fill to be what makes the field findable. On Carbon's own palette that
 * fill differs from the page by 1.10:1 in light and 1.20:1 in dark (measured),
 * so the field's *shape* rests almost entirely on one 1px line at the bottom —
 * hard to perceive at low vision, and gone in forced-colors mode. AWT encloses
 * the field instead. See "Differences from Carbon" (D5) in the Stage 1 spec.
 *
 * The class only marks the block; the borders themselves live in the theme's
 * `theme.css`, which is loaded on the front end and inside the editor canvas
 * both, so the editor preview and the published page agree.
 *
 * Deliberately an opt-*out*: a block with `carbonDefault` set emits nothing
 * here, so Carbon's own CSS applies with no override of ours in the cascade.
 * That is what keeps "Carbon default" honestly Carbon, and it means the next
 * Carbon upgrade cannot leave a half-overridden field behind.
 *
 * @param array<string, mixed> $attributes Block attributes.
 * @return string The frame class, or '' when the block opts into Carbon's own look.
 */
function field_frame_class( array $attributes ): string {
	return empty( $attributes['carbonDefault'] ) ? 'awt-field--framed' : '';
}

/**
 * The frame class for an interactive tile, or '' when the block opts into
 * Carbon's own look.
 *
 * Same opt-out shape as `field_frame_class()` above, and the same reason: a
 * selectable or clickable tile is a user-interface component, and at rest its
 * only shape is a fill measuring 1.10:1 from the page in the light themes and
 * 1.20:1 in the dark ones. WCAG 1.4.11 asks for 3:1.
 *
 * Carbon has its own answer to this and it is not enough: the
 * `enable-tile-contrast` feature flag swaps the transparent border for
 * `--cds-border-tile`, which measures 1.55:1 against the fill in white, 2.38:1
 * in g10, 2.30:1 in g90 and 1.94:1 in g100. Visible, still under the bar. So
 * the border uses `--cds-border-strong` instead, the token D5 already uses on
 * form fields, which clears 3:1 in all four scopes.
 *
 * Only the interactive variants get it. A plain tile is a surface, not a
 * control: 1.4.11 does not apply, and bordering every content tile would
 * change the look of the feature grids and pattern layouts built on them.
 *
 * @param array<string, mixed> $attributes Block attributes.
 * @param string               $variant    Tile variant.
 * @return string The frame class, or ''.
 */
function tile_frame_class( array $attributes, string $variant ): string {
	if ( ! in_array( $variant, array( 'selectable', 'clickable' ), true ) ) {
		return '';
	}
	return empty( $attributes['carbonDefault'] ) ? 'awt-tile--framed' : '';
}
