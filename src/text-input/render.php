<?php
/**
 * AWT Text input — server-rendered output.
 *
 * Structure mirrors Carbon's TextInput React component:
 *
 *   <div class="cds--form-item cds--text-input-wrapper [--inline|--readonly|--fluid] [--invalid|--warning]">
 *     <label class="cds--label">{label}</label>
 *     <div class="cds--text-input__field-outer-wrapper">
 *       <div class="cds--text-input__field-wrapper [--warning|--invalid]">
 *         <input class="cds--text-input [--invalid|--warning] cds--text-input--{size}" />
 *         {warning or invalid icon SVG inside the field}
 *       </div>
 *       {invalid or warn text — cds--form-requirement, below the field}
 *     </div>
 *     <div class="cds--form__helper-text">{helperText}</div>  -- AT THE BOTTOM
 *   </div>
 *
 * Helper text is at the bottom (Stage 0 spec had it above the input — that
 * was a Stage 0 mistake; Carbon's actual reference places helper below).
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\classnames;
use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\Render\describedby;
use function AWT\Blocks\Render\icon;
use function AWT\Blocks\Render\field_frame_class;

$label        = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Label', 'awt' );
$name         = isset( $attributes['name'] ) ? (string) $attributes['name'] : '';
$input_type   = isset( $attributes['type'] ) ? (string) $attributes['type'] : 'text';
$placeholder  = isset( $attributes['placeholder'] ) ? (string) $attributes['placeholder'] : '';
$value        = isset( $attributes['value'] ) ? (string) $attributes['value'] : '';
$helper_text  = isset( $attributes['helperText'] ) ? (string) $attributes['helperText'] : '';
$invalid      = ! empty( $attributes['invalid'] );
$invalid_text = isset( $attributes['invalidText'] ) ? (string) $attributes['invalidText'] : '';
$warn         = ! empty( $attributes['warn'] );
$warn_text    = isset( $attributes['warnText'] ) ? (string) $attributes['warnText'] : '';
$disabled     = ! empty( $attributes['disabled'] );
$readonly     = ! empty( $attributes['readonly'] );
$required     = ! empty( $attributes['required'] );
$size         = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$hide_label   = ! empty( $attributes['hideLabel'] );
$inline       = ! empty( $attributes['inline'] );
$fluid        = ! empty( $attributes['fluid'] );
$maxlength    = isset( $attributes['maxlength'] ) ? (int) $attributes['maxlength'] : 0;
$pattern      = isset( $attributes['pattern'] ) ? (string) $attributes['pattern'] : '';
$autocomplete = isset( $attributes['autocomplete'] ) ? (string) $attributes['autocomplete'] : '';

$input_id   = unique_id( 'awt-text-input' );
$helper_id  = $helper_text !== '' ? $input_id . '-helper' : '';
$invalid_id = ( $invalid && $invalid_text !== '' ) ? $input_id . '-error' : '';
$warn_id    = ( $warn && $warn_text !== '' ) ? $input_id . '-warn' : '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

// Outer wrapper carries the variant modifiers Carbon's CSS hangs styling off.
$wrapper_modifiers       = array(
	$inline ? 'inline' : '',
	$readonly ? 'readonly' : '',
);
$wrapper_modifiers       = array_values( array_filter( $wrapper_modifiers, static fn( $m ) => $m !== '' ) );
$_wrapper_class_fallback = 'cds--form-item ' . classnames( 'cds--text-input-wrapper', $wrapper_modifiers );
// Fluid: Carbon's selector is `.cds--text-input--fluid.cds--text-input-wrapper`
// (the `--fluid` modifier is on the base `cds--text-input` namespace, not on
// `--wrapper`). The wrapper needs BOTH `cds--text-input-wrapper` AND
// `cds--text-input--fluid` so child selectors like
// `.cds--text-input--fluid .cds--label { position: absolute }` fire and float
// the label inside the field area.
if ( $fluid ) {
	$_wrapper_class_fallback .= ' cds--text-input--fluid';
}
$wrapper_class = $ds
	? $ds->classes_for(
		'text-input',
		array(
			'inline'   => $inline,
			'readonly' => $readonly,
			'fluid'    => $fluid,
		)
	)
	: $_wrapper_class_fallback;

// Field wrapper carries the invalid/warning modifier so Carbon's CSS can
// reposition the icon and target the field for focus styling.
$field_wrapper_modifiers       = array(
	$invalid ? 'invalid' : '',
	$warn ? 'warning' : '',
);
$field_wrapper_modifiers       = array_values( array_filter( $field_wrapper_modifiers, static fn( $m ) => $m !== '' ) );
$_field_wrapper_class_fallback = classnames( 'cds--text-input__field-wrapper', $field_wrapper_modifiers );
$field_wrapper_class           = $ds
	? $ds->classes_for(
		'text-input',
		array(
			'element' => 'field-wrapper',
			'invalid' => $invalid,
			'warn'    => $warn,
		)
	)
	: $_field_wrapper_class_fallback;

// Input element keeps its own copies of the modifier classes (Carbon uses
// both `cds--text-input--invalid` and the field-wrapper modifier).
$input_modifiers = array(
	$size,
	$invalid ? 'invalid' : '',
	$warn ? 'warning' : '',
);
$input_modifiers = array_values( array_filter( $input_modifiers, static fn( $m ) => $m !== '' ) );

// Carbon's text-input height comes from `--cds-layout-size-height` (clamped
// via `--cds-layout-size-height-local`). The `cds--text-input--{size}`
// modifier class doesn't set that variable — that's the job of the
// `cds--layout--size-{size}` utility class. Without it every input renders
// at the default md (2.5rem / 40px) regardless of the size prop.
// Same issue we hit on the button block; same fix.
$layout_size_class = in_array( $size, array( 'sm', 'md', 'lg' ), true )
	? 'cds--layout--size-' . $size
	: '';

$_input_class_fallback = classnames( 'cds--text-input', $input_modifiers, $layout_size_class );
$input_class           = $ds
	? $ds->classes_for(
		'text-input',
		array(
			'element' => 'input',
			'size'    => $size,
			'invalid' => $invalid,
			'warn'    => $warn,
		)
	)
	: $_input_class_fallback;

// Carbon's inline variant relies on the label carrying an extra `cds--label--inline`
// class: that's the selector Carbon's flex-sizing rule (`flex: 0 1 auto`)
// targets. Without it the wrapper's flex container gives the label whatever
// default flex-basis the browser picks and the layout looks lopsided.
$_label_class_fallback = 'cds--label';
if ( $inline ) {
	$_label_class_fallback .= ' cds--label--inline';
}
if ( $hide_label ) {
	$_label_class_fallback .= ' cds--visually-hidden';
}
$label_class = $ds
	? $ds->classes_for(
		'text-input',
		array(
			'element'   => 'label',
			'inline'    => $inline,
			'hideLabel' => $hide_label,
		)
	)
	: $_label_class_fallback;

// `field_frame_class()` draws the field's border on all four sides instead of
// Carbon's single bottom rule, unless this block's "Carbon default" is on.
$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class' => implode(
			' ',
			array_filter(
				array(
					$wrapper_class,
					field_frame_class( $attributes ),
					(string) ( $attributes['className'] ?? '' ),
				)
			)
		),
	)
);

$input_attrs = html_attrs(
	array(
		'id'               => $input_id,
		'type'             => $input_type,
		'name'             => $name,
		'class'            => $input_class,
		'placeholder'      => $placeholder,
		'value'            => $value,
		'disabled'         => $disabled,
		'readonly'         => $readonly,
		'required'         => $required,
		'maxlength'        => $maxlength > 0 ? $maxlength : null,
		'pattern'          => $pattern,
		'autocomplete'     => $autocomplete,
		'aria-invalid'     => $invalid ? 'true' : null,
		'aria-describedby' => describedby( array( $helper_id, $invalid_id, $warn_id ) ),
	)
);

// Status icons come from Carbon's own SVGs via the icon helper. Inline
// hardcoded SVGs (Stage 0 approach) had `fill="…"` baked onto each path,
// which overrode Carbon's CSS — the warning triangle ended up rendering as
// a dark empty shape instead of the yellow-with-black-glyph Carbon look.
// Carbon's filled-warning icon has the inner-path pattern (`fill="none"` on
// the inner shape) that Carbon's CSS rules color via
// `.cds--text-input__invalid-icon--warning path:first-of-type { fill: #000 }`.
$status_icon_html = '';
if ( $invalid ) {
	$status_icon_html = icon( 'warning--filled', 16, 'cds--text-input__invalid-icon' );
} elseif ( $warn ) {
	$status_icon_html = icon( 'warning--alt--filled', 16, 'cds--text-input__invalid-icon cds--text-input__invalid-icon--warning' );
}

$requirement_html = '';
if ( $invalid && $invalid_text !== '' ) {
	$requirement_html = sprintf(
		'<div id="%1$s" class="cds--form-requirement">%2$s</div>',
		esc_attr( $invalid_id ),
		wp_kses_post( $invalid_text )
	);
} elseif ( $warn && $warn_text !== '' ) {
	$requirement_html = sprintf(
		'<div id="%1$s" class="cds--form-requirement">%2$s</div>',
		esc_attr( $warn_id ),
		wp_kses_post( $warn_text )
	);
}

$helper_html = $helper_text !== ''
	? sprintf( '<div id="%1$s" class="cds--form__helper-text">%2$s</div>', esc_attr( $helper_id ), wp_kses_post( $helper_text ) )
	: '';

ob_start();
?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core. ?>>
	<label for="<?php echo esc_attr( $input_id ); ?>" class="<?php echo esc_attr( $label_class ); ?>"><?php echo wp_kses_post( $label ); ?></label>
	<div class="cds--text-input__field-outer-wrapper">
		<div class="<?php echo esc_attr( $field_wrapper_class ); ?>">
			<input <?php echo $input_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value. ?> />
			<?php echo $status_icon_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above. ?>
		</div>
		<?php echo $requirement_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped. ?>
	</div>
	<?php echo $helper_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped. ?>
</div>
<?php
echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- buffer built above with every dynamic part escaped.
