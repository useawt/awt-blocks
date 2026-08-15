<?php
/**
 * AWT Text area — server-rendered output.
 *
 * Carbon textarea structure:
 *
 *   <div class="cds--form-item cds--text-area-wrapper [--readonly]">
 *     <label class="cds--label">{label}</label>
 *     <div class="cds--text-area__wrapper [--invalid|--warn]">
 *       <textarea class="cds--text-area [--invalid|--warn]" ...>{value}</textarea>
 *     </div>
 *     {invalid or warn requirement message}
 *     <div class="cds--form__helper-text">{helperText}</div>
 *   </div>
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\classnames;
use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\Render\describedby;
use function AWT\Blocks\Render\field_frame_class;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$label        = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Description', 'awt-blocks' );
$name         = isset( $attributes['name'] ) ? (string) $attributes['name'] : '';
$placeholder  = isset( $attributes['placeholder'] ) ? (string) $attributes['placeholder'] : '';
$value        = isset( $attributes['value'] ) ? (string) $attributes['value'] : '';
$rows         = isset( $attributes['rows'] ) ? (int) $attributes['rows'] : 4;
$cols         = isset( $attributes['cols'] ) ? (int) $attributes['cols'] : 0;
$helper_text  = isset( $attributes['helperText'] ) ? (string) $attributes['helperText'] : '';
$invalid      = ! empty( $attributes['invalid'] );
$invalid_text = isset( $attributes['invalidText'] ) ? (string) $attributes['invalidText'] : '';
$warn         = ! empty( $attributes['warn'] );
$warn_text    = isset( $attributes['warnText'] ) ? (string) $attributes['warnText'] : '';
$disabled     = ! empty( $attributes['disabled'] );
$readonly     = ! empty( $attributes['readonly'] );
$required     = ! empty( $attributes['required'] );
$maxlength    = isset( $attributes['maxlength'] ) ? (int) $attributes['maxlength'] : 0;
$hide_label   = ! empty( $attributes['hideLabel'] );

$textarea_id = unique_id( 'awt-textarea' );
$helper_id   = $helper_text !== '' ? $textarea_id . '-helper' : '';
$invalid_id  = ( $invalid && $invalid_text !== '' ) ? $textarea_id . '-error' : '';
$warn_id     = ( $warn && $warn_text !== '' ) ? $textarea_id . '-warn' : '';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$_wrapper_class_fallback = 'cds--form-item ' . classnames( 'cds--text-area-wrapper', array( $readonly ? 'readonly' : '' ) );
$wrapper_class           = $ds
	? $ds->classes_for( 'text-area', array( 'readonly' => $readonly ) )
	: $_wrapper_class_fallback;

$_inner_wrapper_class_fallback = classnames(
	'cds--text-area__wrapper',
	array( $invalid ? 'invalid' : '', $warn ? 'warn' : '' )
);
$inner_wrapper_class           = $ds
	? $ds->classes_for(
		'text-area',
		array(
			'element' => 'inner-wrapper',
			'invalid' => $invalid,
			'warn'    => $warn,
		)
	)
	: $_inner_wrapper_class_fallback;

$_textarea_class_fallback = classnames(
	'cds--text-area',
	array( $invalid ? 'invalid' : '', $warn ? 'warn' : '' )
);
$textarea_class           = $ds
	? $ds->classes_for(
		'text-area',
		array(
			'element' => 'textarea',
			'invalid' => $invalid,
			'warn'    => $warn,
		)
	)
	: $_textarea_class_fallback;

$_label_class_fallback = 'cds--label' . ( $hide_label ? ' cds--visually-hidden' : '' );
$label_class           = $ds
	? $ds->classes_for(
		'text-area',
		array(
			'element'   => 'label',
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

$textarea_attrs = html_attrs(
	array(
		'id'               => $textarea_id,
		'name'             => $name,
		'class'            => $textarea_class,
		'placeholder'      => $placeholder,
		'rows'             => $rows,
		'cols'             => $cols > 0 ? $cols : null,
		'disabled'         => $disabled,
		'readonly'         => $readonly,
		'required'         => $required,
		'maxlength'        => $maxlength > 0 ? $maxlength : null,
		'aria-invalid'     => $invalid ? 'true' : null,
		'aria-describedby' => describedby( array( $helper_id, $invalid_id, $warn_id ) ),
	)
);

$requirement_html = '';
if ( $invalid && $invalid_text !== '' ) {
	$requirement_html = sprintf( '<div id="%1$s" class="cds--form-requirement">%2$s</div>', esc_attr( $invalid_id ), wp_kses_post( $invalid_text ) );
} elseif ( $warn && $warn_text !== '' ) {
	$requirement_html = sprintf( '<div id="%1$s" class="cds--form-requirement">%2$s</div>', esc_attr( $warn_id ), wp_kses_post( $warn_text ) );
}

$helper_html = $helper_text !== ''
	? sprintf( '<div id="%1$s" class="cds--form__helper-text">%2$s</div>', esc_attr( $helper_id ), wp_kses_post( $helper_text ) )
	: '';

// Status icon inside the inner wrapper, matching Carbon's reference. Carbon's
// invalid-icon class doubles as the warn icon (with `--warning` modifier).
// Both Carbon SVGs are 16×16, positioned absolute via the `.cds--text-area__invalid-icon`
// rule in carbon.min.css (top: .5rem, inset-inline-end: 1rem).
//
// Carbon's CSS only paints the red outline / red error text when the wrapper
// has the `data-invalid="true"` attribute (selector:
// `.cds--text-area__wrapper[data-invalid] > .cds--text-area--invalid:not(:focus)`).
// The class-modifier `--invalid` we already emit isn't enough on its own —
// add `data-invalid` / `data-warn` attributes for Carbon's selectors to fire.
$status_icon_html = '';
if ( $invalid ) {
	// Carbon's invalid icon = `warning--filled` style (red circle with `!`).
	$status_icon_html = '<svg focusable="false" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" class="cds--text-area__invalid-icon" xmlns="http://www.w3.org/2000/svg"><path d="M8,1C4.2,1,1,4.2,1,8s3.2,7,7,7s7-3.1,7-7S11.9,1,8,1z M7.5,4h1v5h-1V4z M8,12.2 c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z"/></svg>';
} elseif ( $warn ) {
	// Carbon's warn icon = `warning--alt--filled` (yellow filled triangle with `!`).
	// The inner-path `data-icon-path="inner-path"` with `fill="none"` carves out
	// the `!` so the triangle's currentColor (yellow) doesn't fill it; Carbon's
	// CSS `.cds--text-area__invalid-icon--warning path[fill]{fill:#000;opacity:1}`
	// repaints the inner `!` glyph black.
	$status_icon_html = '<svg focusable="false" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="cds--text-area__invalid-icon cds--text-area__invalid-icon--warning" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Zm-1.125-5h2.25V12h-2.25Z" data-icon-path="inner-path"/><path d="M16.002,6.1714h-.004L4.6487,27.9966,4.6506,28H27.3494l.0019-.0034ZM14.875,12h2.25v9h-2.25ZM16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Z"/><path d="M29,30H3a1,1,0,0,1-.8872-1.4614l13-25a1,1,0,0,1,1.7744,0l13,25A1,1,0,0,1,29,30ZM4.6507,28H27.3493l.0019-.0034L16.002,6.1714h-.004L4.6487,27.9966Z"/></svg>';
}

// data-invalid / data-warn attributes drive Carbon's wrapper-level selectors.
$inner_wrapper_data = '';
if ( $invalid ) {
	$inner_wrapper_data = ' data-invalid="true"';
} elseif ( $warn ) {
	$inner_wrapper_data = ' data-warn="true"';
}

ob_start();
?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core. ?>>
	<label for="<?php echo esc_attr( $textarea_id ); ?>" class="<?php echo esc_attr( $label_class ); ?>"><?php echo wp_kses_post( $label ); ?></label>
	<div class="<?php echo esc_attr( $inner_wrapper_class ); ?>"<?php echo $inner_wrapper_data; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static literal attribute string. ?>>
		<textarea <?php echo $textarea_attrs; ?>><?php echo esc_textarea( $value ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built by html_attrs(), which escapes every attribute name and value. ?></textarea>
		<?php echo $status_icon_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above. ?>
	</div>
	<?php echo $requirement_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped. ?>
	<?php echo $helper_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped. ?>
</div>
<?php
echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- buffer built above with every dynamic part escaped.
