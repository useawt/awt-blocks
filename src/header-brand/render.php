<?php
/**
 * AWT Header brand — server-rendered output.
 *
 * Renders Carbon's `.cds--header__name` anchor with optional prefix span and
 * logo image. Kind controls which sub-elements render.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Theme-wide defaults from AWT Settings → Identity. Per-block attributes
// override these defaults (same model as the skip-link's text override).
// Guarded with function_exists so the block continues to work when the
// plugin is paired with a non-AWT theme (Premium scope).
$theme_kind      = '';
$theme_prefix    = '';
$theme_logo      = '';
$theme_logo_dark = '';
$theme_alt       = '';
if ( function_exists( '\\AWT\\Theme\\Settings\\get' ) ) {
	$theme_kind      = (string) \AWT\Theme\Settings\get( 'identity.brandMode' );
	$theme_prefix    = (string) \AWT\Theme\Settings\get( 'identity.prefix' );
	$theme_logo      = (string) \AWT\Theme\Settings\get( 'identity.logoUrl' );
	$theme_logo_dark = (string) \AWT\Theme\Settings\get( 'identity.logoUrlDark' );
	$theme_alt       = (string) \AWT\Theme\Settings\get( 'identity.logoAlt' );
}

$kind          = isset( $attributes['kind'] ) && $attributes['kind'] !== ''
	? (string) $attributes['kind']
	: ( $theme_kind !== '' ? $theme_kind : 'auto' );
$prefix        = isset( $attributes['prefix'] ) && $attributes['prefix'] !== ''
	? (string) $attributes['prefix']
	: $theme_prefix;
$site_title    = isset( $attributes['siteTitle'] ) && $attributes['siteTitle'] !== ''
	? (string) $attributes['siteTitle']
	: (string) get_bloginfo( 'name' );
$logo_url      = isset( $attributes['logoUrl'] ) && $attributes['logoUrl'] !== ''
	? (string) $attributes['logoUrl']
	: $theme_logo;
$logo_url_dark = isset( $attributes['logoUrlDark'] ) && $attributes['logoUrlDark'] !== ''
	? (string) $attributes['logoUrlDark']
	: $theme_logo_dark;
$logo_alt      = isset( $attributes['logoAlt'] ) && $attributes['logoAlt'] !== ''
	? (string) $attributes['logoAlt']
	: $theme_alt;
$href          = isset( $attributes['href'] ) && $attributes['href'] !== ''
	? (string) $attributes['href']
	: home_url( '/' );

// 'auto' — the default brand mode — means "show what has actually been set":
// draw the logo once a logo URL exists, and the prefix once a prefix exists.
// Anything else pins the brand to a fixed shape. Without this, a logo uploaded
// during the welcome wizard was saved but never drawn, because the mode that
// draws it is a separate setting on a different tab. `edit.js` mirrors this so
// the editor preview matches. Resolved from the *effective* logo and prefix
// (per-block attribute first, then the AWT Settings default), so a logo set on
// one block shows on that block even when the site has none.
if ( $kind === 'auto' ) {
	if ( $logo_url !== '' ) {
		$kind = $prefix !== '' ? 'logo-with-text-and-prefix' : 'logo-with-text';
	} else {
		$kind = $prefix !== '' ? 'text-with-prefix' : 'text-only';
	}
}

$show_logo   = in_array( $kind, array( 'logo-only', 'logo-with-text', 'logo-with-text-and-prefix' ), true ) && $logo_url !== '';
$show_text   = $kind !== 'logo-only';
$show_prefix = in_array( $kind, array( 'text-with-prefix', 'logo-with-text-and-prefix' ), true ) && $prefix !== '';

// Has a distinct dark-mode logo been configured? If so, render BOTH <img>
// elements; CSS in theme.css keys on the `data-awt-color-scheme` attribute
// (set by the pre-paint script on <html>) to show the right one. When only
// the light-mode URL is set, render a single img — works on both surfaces
// (may not be ideal contrast, but at least it's visible).
$has_dual_logos = $show_logo && $logo_url_dark !== '' && $logo_url_dark !== $logo_url;

// §A: CSS classes from the active design system (guarded for non-AWT themes).
$ds               = function_exists( '\\AWT\\Theme\\DesignSystem\\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;
$name_class       = $ds ? $ds->classes_for( 'header-brand' ) : 'cds--header__name';
$logo_class       = $ds ? $ds->classes_for( 'header-brand', array( 'element' => 'logo' ) ) : 'cds--header__logo';
$logo_light_class = $ds ? $ds->classes_for( 'header-brand', array( 'element' => 'logo-light' ) ) : 'cds--header__logo cds--header__logo--light';
$logo_dark_class  = $ds ? $ds->classes_for( 'header-brand', array( 'element' => 'logo-dark' ) ) : 'cds--header__logo cds--header__logo--dark';
$prefix_class     = $ds ? $ds->classes_for( 'header-brand', array( 'element' => 'prefix' ) ) : 'cds--header__name--prefix';
$name_text_class  = $ds ? $ds->classes_for( 'header-brand', array( 'element' => 'name-text' ) ) : 'cds--header__name--text';

// Flag brands that actually render a logo image. theme.css uses this to hide
// the Site Title (+ prefix) text on mobile ONLY when a logo is present to carry
// the brand — text-only / text-with-prefix brands keep their title on mobile.
$brand_class   = $name_class . ( $show_logo ? ' awt-brand--has-logo' : '' );
$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $brand_class ) );

ob_start();
?>
<a <?php echo $wrapper_attrs; ?> href="<?php echo esc_url( $href ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core. ?>">
	<?php if ( $show_logo ) : ?>
		<?php if ( $has_dual_logos ) : ?>
			<img class="<?php echo esc_attr( $logo_light_class ); ?>" src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $logo_alt ); ?>" />
			<img class="<?php echo esc_attr( $logo_dark_class ); ?>" src="<?php echo esc_url( $logo_url_dark ); ?>" alt="<?php echo esc_attr( $logo_alt ); ?>" />
		<?php else : ?>
			<img class="<?php echo esc_attr( $logo_class ); ?>" src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $logo_alt ); ?>" />
		<?php endif; ?>
	<?php endif; ?>
	<?php if ( $show_prefix ) : ?>
		<span class="<?php echo esc_attr( $prefix_class ); ?>"><?php echo esc_html( $prefix ); ?>&nbsp;</span>
	<?php endif; ?>
	<?php if ( $show_text ) : ?>
		<span class="<?php echo esc_attr( $name_text_class ); ?>"><?php echo esc_html( $site_title ); ?></span>
	<?php endif; ?>
</a>
<?php
echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- buffer built above with every dynamic part escaped.
