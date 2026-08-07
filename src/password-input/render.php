<?php
/**
 * AWT Password input — server-rendered output.
 *
 * Carbon's password-input variant of text-input. The visibility toggle button
 * sits inside the field wrapper, anchored to the right edge. view.js handles
 * the type swap + icon swap on click.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\classnames;
use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\Render\describedby;
use function AWT\Blocks\Render\field_frame_class;

$label         = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Password', 'awt' );
$name          = isset( $attributes['name'] ) ? (string) $attributes['name'] : 'password';
$placeholder   = isset( $attributes['placeholder'] ) ? (string) $attributes['placeholder'] : '';
$helper_text   = isset( $attributes['helperText'] ) ? (string) $attributes['helperText'] : '';
$invalid       = ! empty( $attributes['invalid'] );
$invalid_text  = isset( $attributes['invalidText'] ) ? (string) $attributes['invalidText'] : '';
$warn          = ! empty( $attributes['warn'] );
$warn_text     = isset( $attributes['warnText'] ) ? (string) $attributes['warnText'] : '';
$disabled      = ! empty( $attributes['disabled'] );
$required      = ! empty( $attributes['required'] );
$size          = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$hide_label    = ! empty( $attributes['hideLabel'] );
$show_label    = isset( $attributes['showLabel'] ) ? (string) $attributes['showLabel'] : __( 'Show password', 'awt' );
$hide_pw_label = isset( $attributes['hidePasswordLabel'] ) ? (string) $attributes['hidePasswordLabel'] : __( 'Hide password', 'awt' );
$autocomplete  = isset( $attributes['autocomplete'] ) ? (string) $attributes['autocomplete'] : 'current-password';

$input_id   = unique_id( 'awt-pwd' );
$helper_id  = $helper_text !== '' ? $input_id . '-helper' : '';
$invalid_id = ( $invalid && $invalid_text !== '' ) ? $input_id . '-error' : '';
$warn_id    = ( $warn && $warn_text !== '' ) ? $input_id . '-warn' : '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$_wrapper_class_fallback = 'cds--form-item cds--text-input-wrapper cds--password-input-wrapper';
$wrapper_class           = $ds
	? $ds->classes_for( 'password-input' )
	: $_wrapper_class_fallback;

// `data-invalid` on the field wrapper below is what Carbon keys the error
// message off — `.cds--text-input__field-wrapper[data-invalid] ~
// .cds--form-requirement`, against a message that is `display: none` by
// default. Missing here until 2026-08-07, with the same consequence as in
// `text-input/render.php` (see the longer note there): the message was hidden,
// and hidden from screen readers too, because `aria-describedby` cannot reach a
// `display:none` element. The `--invalid` modifier below is ours; Carbon
// defines no rule for it.
$field_wrapper_modifiers       = array(
	$invalid ? 'invalid' : '',
	$warn ? 'warning' : '',
);
$field_wrapper_modifiers       = array_values( array_filter( $field_wrapper_modifiers, static fn( $m ) => $m !== '' ) );
$_field_wrapper_class_fallback = classnames( 'cds--text-input__field-wrapper', $field_wrapper_modifiers );
$field_wrapper_class           = $ds
	? $ds->classes_for(
		'password-input',
		array(
			'element' => 'field-wrapper',
			'invalid' => $invalid,
			'warn'    => $warn,
		)
	)
	: $_field_wrapper_class_fallback;

// `cds--layout--size-{size}` supplies `--cds-layout-size-height`, which
// drives the input's `block-size`. The `cds--text-input--{size}` modifier
// alone leaves every variant at the default md height. Same root-cause +
// fix as the awt/button and awt/text-input size variants.
$layout_size_class = in_array( $size, array( 'sm', 'md', 'lg' ), true ) ? 'cds--layout--size-' . $size : '';

$_input_class_fallback = classnames(
	'cds--text-input',
	array( $size, $invalid ? 'invalid' : '', $warn ? 'warning' : '' ),
	trim( 'cds--password-input ' . $layout_size_class )
);
$input_class           = $ds
	? $ds->classes_for(
		'password-input',
		array(
			'element' => 'input',
			'size'    => $size,
			'invalid' => $invalid,
			'warn'    => $warn,
		)
	)
	: $_input_class_fallback;

$_label_class_fallback = 'cds--label' . ( $hide_label ? ' cds--visually-hidden' : '' );
$label_class           = $ds
	? $ds->classes_for(
		'password-input',
		array(
			'element'   => 'label',
			'hideLabel' => $hide_label,
		)
	)
	: $_label_class_fallback;

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		// `field_frame_class()` draws the field's border on all four sides
		// instead of Carbon's single bottom rule, unless "Carbon default" is on.
		'class'               => implode(
			' ',
			array_filter(
				array(
					$wrapper_class,
					field_frame_class( $attributes ),
					(string) ( $attributes['className'] ?? '' ),
				)
			)
		),
		'data-wp-interactive' => 'awt/password-input',
		'data-wp-context'     => wp_json_encode(
			array(
				'showLabel' => $show_label,
				'hideLabel' => $hide_pw_label,
			)
		),
	)
);

$input_attrs = html_attrs(
	array(
		'id'               => $input_id,
		'type'             => 'password',
		'name'             => $name,
		'class'            => $input_class,
		'placeholder'      => $placeholder,
		'disabled'         => $disabled,
		'required'         => $required,
		'autocomplete'     => $autocomplete,
		'aria-invalid'     => $invalid ? 'true' : null,
		'aria-describedby' => describedby( array( $helper_id, $invalid_id, $warn_id ) ),
	)
);

$eye_open_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 3C4.5 3 1.7 5 .3 8 1.7 11 4.5 13 8 13c3.5 0 6.3-2 7.7-5C14.3 5 11.5 3 8 3zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5S6.1 4.5 8 4.5s3.5 1.6 3.5 3.5S9.9 11.5 8 11.5z"/><circle cx="8" cy="8" r="2"/></svg>';

$requirement_html = '';
if ( $invalid && $invalid_text !== '' ) {
	$requirement_html = sprintf( '<div id="%1$s" class="cds--form-requirement">%2$s</div>', esc_attr( $invalid_id ), wp_kses_post( $invalid_text ) );
} elseif ( $warn && $warn_text !== '' ) {
	$requirement_html = sprintf( '<div id="%1$s" class="cds--form-requirement">%2$s</div>', esc_attr( $warn_id ), wp_kses_post( $warn_text ) );
}

$helper_html = $helper_text !== ''
	? sprintf( '<div id="%1$s" class="cds--form__helper-text">%2$s</div>', esc_attr( $helper_id ), wp_kses_post( $helper_text ) )
	: '';

ob_start();
?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core. ?>>
	<label for="<?php echo esc_attr( $input_id ); ?>" class="<?php echo esc_attr( $label_class ); ?>"><?php echo wp_kses_post( $label ); ?></label>
	<div class="cds--text-input__field-outer-wrapper">
		<div class="<?php echo esc_attr( $field_wrapper_class ); ?>"<?php echo $invalid ? ' data-invalid="true"' : ''; ?>>
			<input <?php echo $input_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value. ?> />
			<button type="button" class="cds--text-input--password__visibility__toggle" aria-label="<?php echo esc_attr( $show_label ); ?>" aria-controls="<?php echo esc_attr( $input_id ); ?>"<?php echo $disabled ? ' disabled' : ''; ?> data-wp-on--click="actions.toggle">
				<?php echo $eye_open_svg; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above. ?>
			</button>
		</div>
		<?php echo $requirement_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped. ?>
	</div>
	<?php echo $helper_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped. ?>
</div>
<?php
echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- buffer built above with every dynamic part escaped.
