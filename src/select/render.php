<?php
/**
 * AWT Select — server-rendered native <select> with Carbon styling.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\Render\describedby;
use function AWT\Blocks\Render\field_frame_class;
use function AWT\Blocks\Render\icon;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$label        = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Select', 'awt-blocks' );
$name         = isset( $attributes['name'] ) ? (string) $attributes['name'] : '';
$helper_text  = isset( $attributes['helperText'] ) ? (string) $attributes['helperText'] : '';
$invalid      = ! empty( $attributes['invalid'] );
$invalid_text = isset( $attributes['invalidText'] ) ? (string) $attributes['invalidText'] : '';
$disabled     = ! empty( $attributes['disabled'] );
$required     = ! empty( $attributes['required'] );
$size         = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$hide_label   = ! empty( $attributes['hideLabel'] );
$placeholder  = isset( $attributes['placeholder'] ) ? (string) $attributes['placeholder'] : __( 'Choose…', 'awt-blocks' );
$options      = isset( $attributes['options'] ) && is_array( $attributes['options'] ) ? $attributes['options'] : array();

$select_id  = unique_id( 'awt-select' );
$helper_id  = $helper_text !== '' ? $select_id . '-helper' : '';
$invalid_id = ( $invalid && $invalid_text !== '' ) ? $select_id . '-error' : '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

// `cds--layout--size-{size}` supplies the `--cds-layout-size-height` CSS
// variable that drives `.cds--select-input` height (Carbon's --{size}
// modifier doesn't set it). Without this class every select renders at
// the default md baseline. Same fix as awt/button and awt/text-input.
$layout_size            = in_array( $size, array( 'sm', 'md', 'lg' ), true ) ? ' cds--layout--size-' . $size : '';
$_select_class_fallback = 'cds--select-input cds--select-input--' . $size . ( $invalid ? ' cds--select-input--invalid' : '' ) . $layout_size;
$select_class           = $ds
	? $ds->classes_for(
		'select',
		array(
			'element' => 'input',
			'size'    => $size,
			'invalid' => $invalid,
		)
	)
	: $_select_class_fallback;

$_label_class_fallback = 'cds--label' . ( $hide_label ? ' cds--visually-hidden' : '' );
$label_class           = $ds
	? $ds->classes_for(
		'select',
		array(
			'element'   => 'label',
			'hideLabel' => $hide_label,
		)
	)
	: $_label_class_fallback;

$_wrapper_class_fallback = 'cds--form-item cds--select' . ( $invalid ? ' cds--select--invalid' : '' );
$wrapper_class           = $ds
	? $ds->classes_for( 'select', array( 'invalid' => $invalid ) )
	: $_wrapper_class_fallback;

// `field_frame_class()` draws the field's border on all four sides instead of
// Carbon's single bottom rule, unless this block's "Carbon default" is on.
$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => implode( ' ', array_filter( array( $wrapper_class, field_frame_class( $attributes ) ) ) ),
	)
);

$select_attrs = html_attrs(
	array(
		'id'               => $select_id,
		'name'             => $name,
		'class'            => $select_class,
		'disabled'         => $disabled,
		'required'         => $required,
		'aria-invalid'     => $invalid ? 'true' : null,
		'aria-describedby' => describedby( array( $helper_id, $invalid_id ) ),
	)
);

/*
 * Carbon's error icon, missing here until 2026-08-07. Without it the only mark
 * on the field itself was the red outline — colour alone (WCAG 1.4.1) — and the
 * focus indicator replaces that outline, so a keyboard user lost the last
 * visual trace of the error exactly while the field was focused. The icon is
 * decorative (`aria-hidden`); the announced error stays the
 * `cds--form-requirement` text wired up through `aria-describedby`. The
 * `data-invalid` on the wrapper below is what Carbon's CSS keys the icon's red
 * fill and the field's extra inline-end padding off.
 */
$invalid_icon_html = $invalid ? icon( 'warning--filled', 16, 'cds--select__invalid-icon' ) : '';

ob_start();
?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core. ?>>
	<label for="<?php echo esc_attr( $select_id ); ?>" class="<?php echo esc_attr( $label_class ); ?>"><?php echo wp_kses_post( $label ); ?></label>
	<div class="cds--select-input__wrapper"<?php echo $invalid ? ' data-invalid' : ''; ?>>
		<select<?php echo $select_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value. ?>>
			<?php
			/*
			 * The placeholder is a real, visible, disabled first option — it must
			 * NOT carry `hidden`. Browsers drop a hidden <option> from the popup a
			 * sighted user sees but still expose it in the accessibility tree, so
			 * the option count screen readers announce came out one too high
			 * ("3 of 5" on a select offering four choices). Verified in Chromium's
			 * AX tree: all five options non-ignored. Carbon's own Storybook example
			 * uses `disabled hidden` here; we deliberately diverge. `disabled`
			 * alone already makes it unpickable, and with `required` it still
			 * blocks submission. Matches edit.js, which never emitted `hidden`.
			 */
			if ( $placeholder !== '' ) :
				?>
			<option value="" disabled selected><?php echo esc_html( $placeholder ); ?></option>
				<?php
			endif;

			foreach ( $options as $opt ) :
				if ( ! is_array( $opt ) ) {
					continue; }
				$val       = isset( $opt['value'] ) ? (string) $opt['value'] : '';
				$opt_label = isset( $opt['label'] ) ? (string) $opt['label'] : $val;
				?>
				<option value="<?php echo esc_attr( $val ); ?>"><?php echo esc_html( $opt_label ); ?></option>
			<?php endforeach; ?>
		</select>
		<svg class="cds--select__arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
			<path d="M8 11L3 6l.7-.7L8 9.6l4.3-4.3.7.7z"/>
		</svg><?php echo $invalid_icon_html . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- icon() returns Carbon's own SVG markup read from disk. The explicit "\n" replaces the one PHP swallows after the closing tag, so a select with no error renders byte-identically to before. ?>
	</div>
	<?php if ( $invalid && $invalid_text !== '' ) : ?>
		<div id="<?php echo esc_attr( $invalid_id ); ?>" class="cds--form-requirement"><?php echo wp_kses_post( $invalid_text ); ?></div>
	<?php endif; ?>
	<?php if ( $helper_text !== '' ) : ?>
		<div id="<?php echo esc_attr( $helper_id ); ?>" class="cds--form__helper-text"><?php echo wp_kses_post( $helper_text ); ?></div>
	<?php endif; ?>
</div>
<?php
echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- buffer built above with every dynamic part escaped.
