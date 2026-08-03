<?php
/**
 * AWT Data table — server-rendered output.
 *
 * Carbon table class grammar with read-only + sortable + sticky-header +
 * zebra striping. Cells carry data-key="..." so the view-side sort can
 * locate column values cheaply.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\kses_inline;
use function AWT\Blocks\Render\unique_id;

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$headers          = isset( $attributes['headers'] ) && is_array( $attributes['headers'] ) ? $attributes['headers'] : array();
$rows             = isset( $attributes['rows'] ) && is_array( $attributes['rows'] ) ? $attributes['rows'] : array();
$size             = isset( $attributes['size'] ) ? (string) $attributes['size'] : 'md';
$zebra            = ! empty( $attributes['zebra'] );
$use_static_width = ! empty( $attributes['useStaticWidth'] );
$sticky_header    = ! empty( $attributes['stickyHeader'] );
$sortable         = ! empty( $attributes['sortable'] );
$default_sort_key = isset( $attributes['defaultSortKey'] ) ? (string) $attributes['defaultSortKey'] : '';
$default_sort_dir = isset( $attributes['defaultSortDirection'] ) ? (string) $attributes['defaultSortDirection'] : 'asc';
$caption          = isset( $attributes['caption'] ) ? (string) $attributes['caption'] : '';

$container_class = $ds
	? $ds->classes_for( 'data-table', array( 'stickyHeader' => $sticky_header ) )
	: ( 'cds--data-table-container' . ( $sticky_header ? ' cds--data-table-container--sticky-header' : '' ) );

$caption_id = $caption !== '' ? unique_id( 'awt-table-caption' ) : '';

/*
 * The container scrolls horizontally whenever the table is wider than its box:
 * `theme.css` adds `overflow-x: auto` here, which Carbon does not ship. A box
 * that scrolls must be reachable by keyboard, or the columns off the right edge
 * cannot be read without a mouse or touch (WCAG 2.1.1 Keyboard; axe flags it as
 * `scrollable-region-focusable`). `tabindex="0"` is set unconditionally so it
 * holds with no JavaScript; the cost is one tab stop on tables that happen to
 * fit, which is the cheaper trade.
 *
 * `role="group"` rather than `role="region"` on purpose: a region is a landmark,
 * and pages in the block catalog carry up to three tables each, which would
 * otherwise sprout three landmarks with nothing gained. The group takes its
 * name from the caption, so focus announces which table it just entered. With
 * no caption there is nothing truthful to name it, so the role is left off and
 * only the tab stop remains.
 */
$table_attrs = array(
	'class'                       => $container_class,
	'tabindex'                    => '0',
	'data-wp-interactive'         => 'awt/data-table',
	'data-wp-init'                => 'callbacks.init',
	'data-default-sort-key'       => $default_sort_key,
	'data-default-sort-direction' => $default_sort_dir,
);

if ( $caption_id !== '' ) {
	$table_attrs['role']            = 'group';
	$table_attrs['aria-labelledby'] = $caption_id;
}

$wrapper_attrs = get_block_wrapper_attributes( $table_attrs );

$table_class = $ds
	? $ds->classes_for(
		'data-table',
		array(
			'element'        => 'table',
			'size'           => $size,
			'zebra'          => $zebra,
			'useStaticWidth' => $use_static_width,
			'stickyHeader'   => $sticky_header,
			'sortable'       => $sortable,
		)
	)
	: ( 'cds--data-table cds--data-table--' . $size
		. ( $zebra ? ' cds--data-table--zebra' : '' )
		. ( $use_static_width ? ' cds--data-table--static' : '' )
		// sticky-header is a CONTAINER modifier only — Carbon's table-level
		// sticky rules reflow plain tables into broken flex layout.
		. ( $sortable ? ' cds--data-table--sort' : '' ) );

// Carbon's sortable header structure mirrors its React component:
// <th scope="col">
// <button class="cds--table-sort">
// <span class="cds--table-sort__flex">
// <span class="cds--table-header-label">{label}</span>
// <svg class="cds--table-sort__icon" .../>
// </span>
// </button>
// </th>
//
// Critically `.cds--table-sort` belongs on the BUTTON, not the <th>.
// Carbon's rule sets `display: flex` on that class — putting it on the
// <th> overrides the cell's default `display: table-cell`, which
// collapses the header row into a single vertical column (the bug the
// user reported). The earlier Stage-0 invented `cds--table-sort__button`
// / `__label` class names don't exist in Carbon's stylesheet, so the
// elements landed unstyled.
// Sortable-header SVGs follow Carbon's reference: two icons rendered side
// by side in the DOM, CSS toggles which is visible based on the button's
// state classes.
//
// `.cds--table-sort__icon-unsorted` (Carbon: `arrows--vertical` glyph) is
// visible in the IDLE state — it tells the user this column can be sorted.
//
// `.cds--table-sort__icon` (Carbon: `arrow--down` glyph) is visible in the
// ACTIVE state (asc or desc). For desc Carbon's CSS rotates it 180° via
// the `.cds--table-sort--descending` modifier on the button.
//
// view.js toggles `cds--table-sort--active` and `cds--table-sort--descending`
// on the button (plus `aria-sort` on the parent <th> for screen readers).
$sort_icon_unsorted = '<svg class="cds--table-sort__icon-unsorted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M11.5 11.793L13.146 10.146 13.854 10.854 11 13.707 8.146 10.854 8.854 10.146 10.5 11.793 10.5 2 11.5 2zM4.5 4.207L2.854 5.854 2.146 5.146 5 2.293 7.854 5.146 7.146 5.854 5.5 4.207 5.5 14 4.5 14z"/></svg>';
$sort_icon_active   = '<svg class="cds--table-sort__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M13 8l-.7-.7L9 10.6V1H8v9.6L4.7 7.3 4 8l4.5 4.5z"/></svg>';

$sort_btn_class        = $ds ? $ds->classes_for( 'data-table', array( 'element' => 'sort-btn' ) ) : 'cds--table-sort';
$sort_flex_class       = $ds ? $ds->classes_for( 'data-table', array( 'element' => 'sort-flex' ) ) : 'cds--table-sort__flex';
$header_label_class    = $ds ? $ds->classes_for( 'data-table', array( 'element' => 'header-label' ) ) : 'cds--table-header-label';
$visually_hidden_class = $ds ? $ds->classes_for( 'data-table', array( 'element' => 'visually-hidden' ) ) : 'cds--visually-hidden';

$headers_html = '';
foreach ( $headers as $h ) {
	if ( ! is_array( $h ) ) {
		continue;
	}
	$key  = isset( $h['key'] ) ? (string) $h['key'] : '';
	$text = isset( $h['text'] ) ? (string) $h['text'] : $key;
	if ( $sortable ) {
		// Accessible name on the button: tells SR users what clicking will do.
		// view.js updates it on every click so the announcement reflects the
		// NEXT state, not the current one (which `aria-sort` already covers).
		$initial_aria_label = sprintf(
			/* translators: %s: column header text */
			__( 'Sort by %s', 'awt' ),
			wp_strip_all_tags( $text )
		);
		$headers_html .= sprintf(
			'<th scope="col" data-key="%1$s" aria-sort="none"><button type="button" class="%7$s" aria-label="%4$s" data-wp-on--click="actions.sortColumn" data-column-label="%5$s"><span class="%8$s"><span class="%9$s">%2$s</span>%3$s%6$s</span></button></th>',
			esc_attr( $key ),
			kses_inline( $text ),
			$sort_icon_unsorted,
			esc_attr( $initial_aria_label ),
			esc_attr( wp_strip_all_tags( $text ) ),
			$sort_icon_active,
			esc_attr( $sort_btn_class ),
			esc_attr( $sort_flex_class ),
			esc_attr( $header_label_class )
		);
	} else {
		$headers_html .= sprintf( '<th scope="col" data-key="%1$s"><span class="%3$s">%2$s</span></th>', esc_attr( $key ), kses_inline( $text ), esc_attr( $header_label_class ) );
	}
}

// Cell-type rendering. Per-column `cellType` on each header switches the
// cell render path. `text` (default) writes the value as plain text. `boolean`
// interprets the value as truthy/falsy and renders a Carbon checkmark SVG
// when true, an em-dash glyph when false; both carry an aria-label so screen
// readers hear "Included" / "Not included" instead of nothing. Used by the
// Pricing-table section pattern's comparison matrix below a row of
// `awt/pricing-tile` blocks.
$check_svg = '<svg class="awt-data-table__check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M6.5 11.7L2.8 8l1.1-1 2.6 2.5L11.9 4 13 5.1z"/></svg>';

$rows_html = '';
foreach ( $rows as $row ) {
	if ( ! is_array( $row ) ) {
		continue;
	}
	$rows_html .= '<tr>';
	foreach ( $headers as $h ) {
		if ( ! is_array( $h ) ) {
			continue;
		}
		$key       = isset( $h['key'] ) ? (string) $h['key'] : '';
		$cell_type = isset( $h['cellType'] ) ? (string) $h['cellType'] : 'text';
		$raw       = $row[ $key ] ?? '';

		if ( $cell_type === 'boolean' ) {
			// Truthy interpretation: true / 1 / "true" / "yes" / "✓" all count
			// as "included"; everything else (including empty string) as "not".
			$truthy_strings = array( '1', 'true', 'yes', '✓', 'y', 'on' );
			$is_included    = is_bool( $raw )
				? $raw
				: in_array( strtolower( trim( (string) $raw ) ), $truthy_strings, true );
			$label          = $is_included ? __( 'Included', 'awt' ) : __( 'Not included', 'awt' );
			$content        = $is_included
				? $check_svg
				: '<span class="awt-data-table__not-included" aria-hidden="true">—</span>';
			$rows_html     .= sprintf(
				'<td data-key="%1$s" class="awt-data-table__cell--boolean"><span class="%4$s">%2$s</span>%3$s</td>',
				esc_attr( $key ),
				esc_html( $label ),
				$content,
				esc_attr( $visually_hidden_class )
			);
			continue;
		}

		// Default: text cell — keep allowlisted inline formatting (links, bold,
		// italic, code, images), drop everything else. kses_inline() is the
		// security boundary: stored attributes are untrusted.
		$value      = (string) $raw;
		$rows_html .= sprintf( '<td data-key="%1$s">%2$s</td>', esc_attr( $key ), kses_inline( $value ) );
	}
	$rows_html .= '</tr>';
}

ob_start();
?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core. ?>>
	<table class="<?php echo esc_attr( $table_class ); ?>">
		<?php
		if ( $caption !== '' ) :
			?>
			<caption id="<?php echo esc_attr( $caption_id ); ?>"><?php echo esc_html( $caption ); ?></caption><?php endif; ?>
		<thead><tr><?php echo $headers_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with esc_attr()/kses_inline() on every dynamic part. ?></tr></thead>
		<tbody><?php echo $rows_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with esc_attr()/kses_inline() on every dynamic part. ?></tbody>
	</table>
	<?php if ( $sortable ) : ?>
		<?php
		// Visually-hidden ARIA live region. view.js writes a short message
				// ("Table sorted by Amount ascending.") on every sort change so
				// screen-reader users hear the result of their click. aria-sort
				// on the <th> tells SRs the current state, but doesn't announce
				// CHANGES — the live region fills that gap.
		?>
		<div class="awt-data-table__sort-announce <?php echo esc_attr( $visually_hidden_class ); ?>" aria-live="polite" aria-atomic="true" data-wp-text="state.sortAnnouncement"></div>
	<?php endif; ?>
</div>
<?php
echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- buffer built above with every dynamic part escaped.
