<?php
/**
 * AWT Modal — server-rendered output.
 *
 * Always-rendered, hidden by default. An awt/modal-opener (or any control
 * dispatching `awt:toggle-panel` with this modal's id) opens it. view.js
 * owns focus management, Escape close, backdrop dismiss, and focus return.
 *
 * @var array  $attributes
 * @var string $content
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\icon;
use function AWT\Blocks\Render\unique_id;
use function AWT\Blocks\Render\html_attrs;
use function AWT\Blocks\Render\compute_rel;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$modal_id         = isset( $attributes['id'] ) && $attributes['id'] !== '' ? (string) $attributes['id'] : unique_id( 'awt-modal' );
$heading          = isset( $attributes['heading'] ) ? (string) $attributes['heading'] : '';
$label            = isset( $attributes['label'] ) ? (string) $attributes['label'] : '';
$size             = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$primary_action   = isset( $attributes['primaryAction'] ) ? (string) $attributes['primaryAction'] : __( 'Continue', 'awt-blocks' );
$secondary_action = isset( $attributes['secondaryAction'] ) ? (string) $attributes['secondaryAction'] : __( 'Cancel', 'awt-blocks' );
$danger           = ! empty( $attributes['danger'] );
$primary_href     = isset( $attributes['primaryHref'] ) ? (string) $attributes['primaryHref'] : '';
$primary_target   = isset( $attributes['primaryTarget'] ) ? (string) $attributes['primaryTarget'] : '';
$primary_rel      = isset( $attributes['primaryRel'] ) ? (string) $attributes['primaryRel'] : '';

$heading_id = $modal_id . '-heading';

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$root_class           = $ds ? $ds->classes_for(
	'modal',
	array(
		'size'   => $size,
		'danger' => $danger,
	)
) : 'cds--modal cds--modal--' . $size . ( $danger ? ' cds--modal--danger' : '' );
$container_class      = $ds ? $ds->classes_for(
	'modal',
	array(
		'element' => 'container',
		'size'    => $size,
	)
) : 'cds--modal-container cds--modal-container--' . $size;
$header_class         = $ds ? $ds->classes_for( 'modal', array( 'element' => 'header' ) ) : 'cds--modal-header';
$header_label_class   = $ds ? $ds->classes_for( 'modal', array( 'element' => 'header-label' ) ) : 'cds--modal-header__label';
$header_heading_class = $ds ? $ds->classes_for( 'modal', array( 'element' => 'header-heading' ) ) : 'cds--modal-header__heading';
$close_button_class   = $ds ? $ds->classes_for( 'modal', array( 'element' => 'close-button' ) ) : 'cds--modal-close-button cds--modal-close';
$modal_content_class  = $ds ? $ds->classes_for( 'modal', array( 'element' => 'content' ) ) : 'cds--modal-content';
$footer_class         = $ds ? $ds->classes_for( 'modal', array( 'element' => 'footer' ) ) : 'cds--modal-footer';
$cancel_btn_class     = $ds ? $ds->classes_for( 'modal', array( 'element' => 'cancel-button' ) ) : 'cds--btn cds--btn--secondary cds--modal-cancel-button';
$primary_btn_class    = $ds ? $ds->classes_for(
	'modal',
	array(
		'element' => 'primary-button',
		'danger'  => $danger,
	)
) : 'cds--btn cds--btn--' . ( $danger ? 'danger' : 'primary' ) . ' cds--modal-primary-button';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'id'                  => $modal_id,
		'class'               => $root_class,
		'role'                => 'presentation',
		'data-wp-interactive' => 'awt/modal',
		'data-wp-init'        => 'callbacks.init',
		'data-wp-on--click'   => 'actions.backdropClick',
	)
);

$close_icon = icon( 'close', 20 );

// Primary action: a link (<a>) when a URL is set, otherwise a button that just
// closes the modal. A linked primary action navigates instead of closing.
if ( $primary_href !== '' ) {
	$primary_attrs       = html_attrs(
		array(
			'href'   => $primary_href,
			'target' => $primary_target,
			'rel'    => compute_rel( $primary_target, $primary_rel ),
		)
	);
	$primary_button_html = sprintf(
		'<a class="%1$s"%2$s>%3$s</a>',
		esc_attr( $primary_btn_class ),
		$primary_attrs,
		esc_html( $primary_action )
	);
} else {
	$primary_button_html = sprintf(
		'<button type="button" class="%1$s" data-wp-on--click="actions.close">%2$s</button>',
		esc_attr( $primary_btn_class ),
		esc_html( $primary_action )
	);
}

ob_start();
?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core. ?>>
	<div class="<?php echo esc_attr( $container_class ); ?>" role="dialog" aria-modal="true" aria-labelledby="<?php echo esc_attr( $heading_id ); ?>">
		<div class="<?php echo esc_attr( $header_class ); ?>">
			<?php if ( $label !== '' ) : ?>
				<p class="<?php echo esc_attr( $header_label_class ); ?>"><?php echo wp_kses_post( $label ); ?></p>
			<?php endif; ?>
			<h2 class="<?php echo esc_attr( $header_heading_class ); ?>" id="<?php echo esc_attr( $heading_id ); ?>"><?php echo wp_kses_post( $heading ); ?></h2>
		</div>
		<?php
		// X close button is a SIBLING of the header, not a child. Carbon's
		// `.cds--modal-close-button { position: absolute; inset-block-start: 0;
		// inset-inline-end: 0 }` floats it in the container's top-right corner;
		// the matching header has `padding-inline-end: 3rem` so the heading
		// text wraps before reaching it. Putting it INSIDE the header (Stage 0
		// approach) made it flow as a regular block child below the heading.
		?>
		<button type="button" class="<?php echo esc_attr( $close_button_class ); ?>" aria-label="<?php echo esc_attr__( 'Close', 'awt-blocks' ); ?>" data-wp-on--click="actions.close"><?php echo $close_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static plugin-authored SVG; dynamic classes escaped with esc_attr() above. ?></button>
		<div class="<?php echo esc_attr( $modal_content_class ); ?>"><?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- inner-block markup, escaped by each inner block on render. ?></div>
		<div class="<?php echo esc_attr( $footer_class ); ?>">
			<button type="button" class="<?php echo esc_attr( $cancel_btn_class ); ?>" data-wp-on--click="actions.close"><?php echo esc_html( $secondary_action ); ?></button>
			<?php echo $primary_button_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built + escaped above. ?>
		</div>
	</div>
</div>
<?php
echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- buffer built above with every dynamic part escaped.
