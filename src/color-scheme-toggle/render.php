<?php
/**
 * AWT Color scheme toggle — server-rendered output.
 *
 * Reads settings.custom.ui-shell.colorScheme.allowVisitorOverride from theme.json
 * and self-removes if false. Otherwise renders an icon-only / with-label /
 * segmented toggle.
 *
 * Accessibility contract, all three kinds:
 *
 * - The control carries its own state. icon-only / with-label are toggle
 *   buttons named after the thing they turn on ("Dark mode") with
 *   `aria-pressed`; segmented is a group of three toggle buttons, exactly one
 *   pressed. A screen reader user hears the state on focus, and hears it change
 *   on activation, without depending on the live region below.
 * - `aria-pressed` is rendered from the visitor's stored preference rather than
 *   hardcoded, so a returning visitor is not told "not pressed" until the view
 *   script hydrates. It stays a best guess: with no explicit cookie the active
 *   scheme depends on the visitor's OS setting, which the server cannot see.
 *   `callbacks.init` reconciles.
 * - The polite live region is printed ONCE per page, empty, in the footer.
 *   Building it at click time and filling it in the same tick — what this block
 *   did until 2026-08-02 — is not announced by screen readers, because they
 *   announce a *change* to a region that was already in the accessibility tree.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

$kind        = isset( $attributes['kind'] ) ? (string) $attributes['kind'] : 'icon-only';
$light_label = isset( $attributes['lightLabel'] ) ? (string) $attributes['lightLabel'] : __( 'Light mode', 'awt' );
$dark_label  = isset( $attributes['darkLabel'] ) ? (string) $attributes['darkLabel'] : __( 'Dark mode', 'awt' );
$auto_label  = isset( $attributes['autoLabel'] ) ? (string) $attributes['autoLabel'] : __( 'Use system preference', 'awt' );

// Honour the theme.json allowVisitorOverride flag.
if ( function_exists( '\\AWT\\Theme\\color_scheme_allow_visitor_override' )
	&& ! \AWT\Theme\color_scheme_allow_visitor_override() ) {
	return;
}

/**
 * The polite live region, printed once per page no matter how many toggles the
 * page has. Inline styles rather than a class: the region has to be hidden even
 * when the block renders without the AWT theme's stylesheet.
 */
if ( ! defined( 'AWT_COLOR_SCHEME_ANNOUNCER_QUEUED' ) ) {
	define( 'AWT_COLOR_SCHEME_ANNOUNCER_QUEUED', true );
	add_action(
		'wp_footer',
		static function (): void {
			echo '<div id="awt-color-scheme-announcer" role="status" aria-live="polite" '
				. 'style="position:absolute;inline-size:1px;block-size:1px;margin:-1px;padding:0;'
				. 'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0"></div>';
		}
	);
}

// The visitor's stored preference, which is exactly what the segmented kind
// shows as selected — including "auto", which the resolved scheme cannot
// express. Empty when the visitor has never chosen.
$stored = isset( $_COOKIE['awt_color_scheme'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only display preference, no state change.
	? sanitize_key( wp_unslash( $_COOKIE['awt_color_scheme'] ) )
	: '';
if ( ! in_array( $stored, array( 'light', 'dark', 'auto' ), true ) ) {
	$stored = '';
}

$scheme = function_exists( '\\AWT\\Theme\\active_scheme_server_guess' )
	? \AWT\Theme\active_scheme_server_guess()
	: 'light';

// With no stored choice the site follows the visitor's OS setting whenever the
// theme is configured to honour it, which is what "auto" means here.
$honors_system = true;
if ( function_exists( '\\AWT\\Theme\\color_scheme_settings' ) ) {
	$honors_system = (bool) ( \AWT\Theme\color_scheme_settings()['honorSystemPreference'] ?? true );
}
$selected = $stored ? $stored : ( $honors_system ? 'auto' : $scheme );

$context_json = wp_json_encode(
	array(
		'kind'          => $kind,
		'selected'      => $selected,
		'lightLabel'    => $light_label,
		'darkLabel'     => $dark_label,
		'autoLabel'     => $auto_label,
		/* translators: %s: name of the color scheme that was just turned on, e.g. "Dark mode". */
		'announceLight' => sprintf( __( '%s on', 'awt' ), $light_label ),
		/* translators: %s: name of the color scheme that was just turned on, e.g. "Dark mode". */
		'announceDark'  => sprintf( __( '%s on', 'awt' ), $dark_label ),
		'announceAuto'  => __( 'Now following your system setting.', 'awt' ),
	)
);

if ( $kind === 'segmented' ) {
	$wrapper = get_block_wrapper_attributes(
		array(
			'class'               => 'awt-color-scheme-toggle awt-color-scheme-toggle--segmented',
			'role'                => 'group',
			'aria-label'          => __( 'Color scheme', 'awt' ),
			'data-wp-interactive' => 'awt/color-scheme-toggle',
			'data-wp-context'     => $context_json,
			'data-wp-init'        => 'callbacks.initGroup',
		)
	);

	$segment = static function ( string $value, string $label, string $action, string $selected ): string {
		return sprintf(
			'<button type="button" data-awt-scheme="%1$s" aria-pressed="%2$s" data-wp-on--click="%3$s">%4$s</button>',
			esc_attr( $value ),
			$value === $selected ? 'true' : 'false',
			esc_attr( $action ),
			esc_html( $label )
		);
	};

	printf(
		'<div %1$s>%2$s%3$s%4$s</div>',
		$wrapper, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
		$segment( 'light', $light_label, 'actions.setLight', $selected ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with every dynamic part escaped.
		$segment( 'auto', $auto_label, 'actions.setAuto', $selected ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with every dynamic part escaped.
		$segment( 'dark', $dark_label, 'actions.setDark', $selected ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with every dynamic part escaped.
	);
	return;
}

// Icon-only or with-label kinds follow.
// §A: the icon-only / with-label kinds adopt Carbon's header-action button styling,
// so that one class routes through the design system's `header-action` resolver
// instead of hardcoding `cds--header__action`. If the resolver returns ''
// (e.g. no AWT theme active), the toggle keeps its awt-* classes + behavior
// and renders unstyled. The segmented kind above uses no `cds--*` and returned early.
$ds                  = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;
$header_action_class = $ds ? $ds->classes_for( 'header-action', array() ) : 'cds--header__action';

$is_dark = $scheme === 'dark';

$wrapper_args = array(
	'class'               => trim( 'awt-color-scheme-toggle awt-color-scheme-toggle--' . ( $kind === 'with-label' ? 'with-label' : 'icon-only' ) . ' ' . $header_action_class ),
	'type'                => 'button',
	'aria-pressed'        => $is_dark ? 'true' : 'false',
	'data-wp-interactive' => 'awt/color-scheme-toggle',
	'data-wp-context'     => $context_json,
	'data-wp-on--click'   => 'actions.toggle',
	'data-wp-init'        => 'callbacks.init',
);

// with-label takes its accessible name from the visible label, so an aria-label
// there would only risk contradicting it (WCAG 2.5.3 Label in Name).
if ( $kind !== 'with-label' ) {
	$wrapper_args['aria-label'] = $dark_label;
}

$wrapper = get_block_wrapper_attributes( $wrapper_args );

// Both icons ship; the inactive one carries `hidden`, so the state reads
// without colour and without waiting for a stylesheet. `hidden` sits on the
// wrapping span because it is an HTML attribute and the child is SVG.
//
// Both are Carbon's own 16px icons — `light` and `asleep` — with their paths
// copied verbatim from @carbon/icons rather than read through `icon()` at
// render time: this control must always draw, and the helper returns '' for a
// name the generated icon manifest no longer carries.
$icon = '<span class="awt-color-scheme-toggle__icon" aria-hidden="true">'
	. '<span class="awt-color-scheme-toggle__icon--sun"' . ( $is_dark ? ' hidden' : '' ) . '>'
	. '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" fill="currentColor" focusable="false">'
	. '<path d="M7.5 1H8.5V3.5H7.5z"/><path d="M10.8 3.4H13.3V4.4H10.8z" transform="rotate(-45 12.041 3.923)"/>'
	. '<path d="M12.5 7.5H15V8.5H12.5z"/><path d="M11.6 10.8H12.6V13.3H11.6z" transform="rotate(-45 12.075 12.04)"/>'
	. '<path d="M7.5 12.5H8.5V15H7.5z"/><path d="M2.7 11.6H5.2V12.6H2.7z" transform="rotate(-45 3.96 12.078)"/>'
	. '<path d="M1 7.5H3.5V8.5H1z"/><path d="M3.4 2.7H4.4V5.2H3.4z" transform="rotate(-45 3.925 3.961)"/>'
	. '<path d="M8,6c1.1,0,2,0.9,2,2s-0.9,2-2,2S6,9.1,6,8S6.9,6,8,6 M8,5C6.3,5,5,6.3,5,8s1.3,3,3,3s3-1.3,3-3S9.7,5,8,5z"/>'
	. '</svg></span>'
	. '<span class="awt-color-scheme-toggle__icon--moon"' . ( $is_dark ? '' : ' hidden' ) . '>'
	. '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20" fill="currentColor" focusable="false">'
	. '<path d="M7.2,2.3c-1,4.4,1.7,8.7,6.1,9.8c0.1,0,0.1,0,0.2,0c-1.1,1.2-2.7,1.8-4.3,1.8c-0.1,0-0.2,0-0.2,0C5.6,13.8,3,11,3.2,7.7 C3.2,5.3,4.8,3.1,7.2,2.3 M8,1L8,1C4.1,1.6,1.5,5.3,2.1,9.1c0.6,3.3,3.4,5.8,6.8,5.9c0.1,0,0.2,0,0.3,0c2.3,0,4.4-1.1,5.8-3 c0.2-0.2,0.1-0.6-0.1-0.7c-0.1-0.1-0.2-0.1-0.3-0.1c-3.9-0.3-6.7-3.8-6.4-7.6C8.3,3,8.4,2.4,8.6,1.8c0.1-0.3,0-0.6-0.3-0.7 C8.1,1,8.1,1,8,1z"/>'
	. '</svg></span>'
	. '</span>';

$label_html = $kind === 'with-label'
	? '<span class="awt-color-scheme-toggle__label">' . esc_html( $dark_label ) . '</span>'
	: '';

printf( '<button %1$s>%2$s%3$s</button>', $wrapper, $icon, $label_html ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core; static plugin-authored SVG; dynamic classes escaped with esc_attr() above; built above with all dynamic parts escaped.
