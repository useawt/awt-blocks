<?php
/**
 * AWT Dropdown — server-rendered output.
 *
 * Carbon `.cds--dropdown` is a button + listbox pair. Selection is stored in
 * a sibling hidden <input>, so the dropdown participates in form submissions
 * just like a native <select>.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\Render\field_frame_class;

$label        = isset( $attributes['label'] ) ? (string) $attributes['label'] : __( 'Dropdown', 'awt' );
$placeholder  = isset( $attributes['placeholder'] ) ? (string) $attributes['placeholder'] : __( 'Choose…', 'awt' );
$helper_text  = isset( $attributes['helperText'] ) ? (string) $attributes['helperText'] : '';
$invalid      = ! empty( $attributes['invalid'] );
$invalid_text = isset( $attributes['invalidText'] ) ? (string) $attributes['invalidText'] : '';
$disabled     = ! empty( $attributes['disabled'] );
$size         = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$name         = isset( $attributes['name'] ) ? (string) $attributes['name'] : '';
$options      = isset( $attributes['options'] ) && is_array( $attributes['options'] ) ? $attributes['options'] : array();

$root_id    = unique_id( 'awt-dd' );
$trigger_id = $root_id . '-trigger';
$listbox_id = $root_id . '-listbox';
$label_id   = $root_id . '-label';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$dd_wrapper_class       = $ds ? $ds->classes_for( 'dropdown' ) : 'cds--dropdown__wrapper';
$dd_label_class         = $ds ? $ds->classes_for( 'dropdown', array( 'element' => 'label' ) ) : 'cds--label';
$dd_trigger_class       = $ds ? $ds->classes_for( 'dropdown', array( 'element' => 'trigger' ) ) : 'cds--list-box__field';
$dd_trigger_label_class = $ds ? $ds->classes_for( 'dropdown', array( 'element' => 'trigger-label' ) ) : 'cds--list-box__label';
$dd_menu_icon_class     = $ds ? $ds->classes_for( 'dropdown', array( 'element' => 'menu-icon' ) ) : 'cds--list-box__menu-icon';
$dd_menu_class          = $ds ? $ds->classes_for( 'dropdown', array( 'element' => 'menu' ) ) : 'cds--list-box__menu';
$dd_menu_item_class     = $ds ? $ds->classes_for( 'dropdown', array( 'element' => 'menu-item' ) ) : 'cds--list-box__menu-item';
$dd_menu_item_opt_class = $ds ? $ds->classes_for( 'dropdown', array( 'element' => 'menu-item-option' ) ) : 'cds--list-box__menu-item__option';
$dd_error_class         = $ds ? $ds->classes_for( 'dropdown', array( 'element' => 'error' ) ) : 'cds--form-requirement';
$dd_helper_class        = $ds ? $ds->classes_for( 'dropdown', array( 'element' => 'helper' ) ) : 'cds--form__helper-text';

// Build the root class with modifiers (size, invalid, disabled, layout-size).
if ( $ds ) {
	$_dd_root_variants = array(
		'element' => 'inner',
		'size'    => $size,
	);
	if ( $invalid ) {
		$_dd_root_variants['invalid'] = true; }
	if ( $disabled ) {
		$_dd_root_variants['disabled'] = true; }
	$root_class = $ds->classes_for( 'dropdown', $_dd_root_variants );
} else {
	$root_class = 'cds--dropdown cds--list-box cds--list-box--' . $size;
	if ( $invalid ) {
		$root_class .= ' cds--dropdown--invalid'; }
	if ( $disabled ) {
		$root_class .= ' cds--dropdown--disabled'; }
	// `cds--layout--size-{size}` supplies the `--cds-layout-size-height` CSS
	// variable Carbon uses for `.cds--list-box` height. The `--list-box--{size}`
	// modifier alone doesn't set it; every size renders at md without this.
	// Same fix pattern as awt/button + awt/text-input.
	if ( in_array( $size, array( 'sm', 'md', 'lg' ), true ) ) {
		$root_class .= ' cds--layout--size-' . $size;
	}
}

// `field_frame_class()` draws the field's border on all four sides instead of
// Carbon's single bottom rule, unless this block's "Carbon default" is on. It
// goes on this outer wrapper; the CSS reaches `.cds--dropdown` (the closed
// field, rendered below) as a descendant.
$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => implode( ' ', array_filter( array( $dd_wrapper_class, field_frame_class( $attributes ) ) ) ),
		'data-wp-interactive' => 'awt/dropdown',
	)
);

// Carbon's `.cds--list-box__menu-icon` rule sets the element to `block-size:
// 1.5rem; inline-size: 1.5rem` (24x24) — that class is meant for the icon's
// WRAPPER, not the SVG itself. Putting it directly on the SVG stretched the
// 16-viewBox glyph into a 24-pixel box, making the chevron look oversized.
// Wrap with a div instead so the wrapper takes the 24x24 footprint and the
// SVG renders at its native 16x16 (which Carbon's `> svg` selector picks up
// for fill colour). The chevron rotation on open is driven by Carbon's
// `.cds--list-box--expanded .cds--list-box__menu-icon { transform: rotate(180deg) }`,
// which acts on the wrapper — so rotation still works.
$arrow_svg = '<div class="' . esc_attr( $dd_menu_icon_class ) . '"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 11L3 6l.7-.7L8 9.6l4.3-4.3.7.7z"/></svg></div>';

ob_start();
?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core. ?>>
	<label id="<?php echo esc_attr( $label_id ); ?>" class="<?php echo esc_attr( $dd_label_class ); ?>" for="<?php echo esc_attr( $trigger_id ); ?>"><?php echo wp_kses_post( $label ); ?></label>
	<div class="<?php echo esc_attr( $root_class ); ?>" id="<?php echo esc_attr( $root_id ); ?>">
		<input type="hidden" name="<?php echo esc_attr( $name ); ?>" value="" />
		<button
			type="button"
			id="<?php echo esc_attr( $trigger_id ); ?>"
			class="<?php echo esc_attr( $dd_trigger_class ); ?>"
			role="combobox"
			aria-haspopup="listbox"
			aria-controls="<?php echo esc_attr( $listbox_id ); ?>"
			aria-expanded="false"
			aria-activedescendant=""
			aria-labelledby="<?php echo esc_attr( $label_id ); ?>"
			<?php echo $disabled ? 'disabled' : ''; ?>
			data-wp-on--click="actions.toggle"
			data-wp-on--keydown="actions.keydown"
		>
			<span class="<?php echo esc_attr( $dd_trigger_label_class ); ?>"><?php echo esc_html( $placeholder ); ?></span>
			<?php echo $arrow_svg; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above. ?>
		</button>
		<ul
			id="<?php echo esc_attr( $listbox_id ); ?>"
			class="<?php echo esc_attr( $dd_menu_class ); ?>"
			role="listbox"
			aria-labelledby="<?php echo esc_attr( $label_id ); ?>"
			hidden
		>
			<?php
			/*
			 * The option's content is a plain <div>, never a control. ARIA marks
			 * an `option`'s children presentational, but that stripping does not
			 * apply to focusable descendants — so a <button> in here stays in the
			 * accessibility tree and the option announces as "option, button".
			 * It also puts a tab stop inside a listbox, which is not how a
			 * listbox is operated. Focus belongs on the combobox for the whole
			 * interaction; the highlight travels via `aria-activedescendant`.
			 * This mirrors Carbon, whose options are <li> > <div> with no
			 * tabindex and no interactive descendants.
			 */
			$opt_index = 0;
			foreach ( $options as $opt ) :
				if ( ! is_array( $opt ) ) {
					continue;
				}
				$val       = isset( $opt['value'] ) ? (string) $opt['value'] : '';
				$opt_label = isset( $opt['label'] ) ? (string) $opt['label'] : $val;
				$opt_id    = $listbox_id . '-item-' . $opt_index;
				++$opt_index;
				?>
				<li
					id="<?php echo esc_attr( $opt_id ); ?>"
					class="<?php echo esc_attr( $dd_menu_item_class ); ?>"
					role="option"
					aria-selected="false"
					data-value="<?php echo esc_attr( $val ); ?>"
					data-wp-on--click="actions.choose"
				>
					<div class="<?php echo esc_attr( $dd_menu_item_opt_class ); ?>"><?php echo esc_html( $opt_label ); ?></div>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
	<?php if ( $invalid && $invalid_text !== '' ) : ?>
		<div class="<?php echo esc_attr( $dd_error_class ); ?>"><?php echo wp_kses_post( $invalid_text ); ?></div>
	<?php endif; ?>
	<?php if ( $helper_text !== '' ) : ?>
		<div class="<?php echo esc_attr( $dd_helper_class ); ?>"><?php echo wp_kses_post( $helper_text ); ?></div>
	<?php endif; ?>
</div>
<?php
echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- buffer built above with every dynamic part escaped.
