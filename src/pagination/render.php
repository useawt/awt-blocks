<?php
/**
 * AWT Pagination — server-rendered output.
 *
 * On archive / blog templates, totalPages = 0 means "derive from the main
 * WP_Query." On a static page, the author sets totalPages + currentPage
 * explicitly and pagination renders linkless if baseUrl is also blank.
 *
 * @var array $attributes
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

use function AWT\Blocks\Render\icon;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ds = function_exists( '\AWT\Theme\DesignSystem\get_active' ) ? \AWT\Theme\DesignSystem\get_active() : null;

$total_pages  = isset( $attributes['totalPages'] ) ? (int) $attributes['totalPages'] : 0;
$current_page = isset( $attributes['currentPage'] ) ? (int) $attributes['currentPage'] : 1;
$base_url     = isset( $attributes['baseUrl'] ) ? (string) $attributes['baseUrl'] : '';
$aria_label   = isset( $attributes['ariaLabel'] ) ? (string) $attributes['ariaLabel'] : __( 'Pagination', 'awt-blocks' );

// Auto-detect from main query when totalPages = 0.
if ( $total_pages === 0 ) {
	global $wp_query;
	if ( $wp_query instanceof \WP_Query && $wp_query->max_num_pages > 1 ) {
		$total_pages  = (int) $wp_query->max_num_pages;
		$current_page = max( 1, (int) get_query_var( 'paged' ) );
	} else {
		$total_pages  = 1;
		$current_page = 1;
	}
}

if ( $total_pages <= 1 ) {
	return; // No pagination needed.
}

$current_page = max( 1, min( $current_page, $total_pages ) );

// Allowed page-link generation: if baseUrl is set, use it with %d placeholder;
// otherwise use WordPress's paginate_links() format.
$page_link = static function ( int $page ) use ( $base_url ): string {
	if ( $base_url !== '' ) {
		if ( str_contains( $base_url, '%d' ) ) {
			return str_replace( '%d', (string) $page, $base_url );
		}
		return rtrim( $base_url, '/' ) . '/page/' . $page . '/';
	}
	if ( function_exists( 'get_pagenum_link' ) ) {
		return get_pagenum_link( $page );
	}
	return '#';
};

// Visible page window — show all pages if ≤ 7, otherwise show first, current
// ± 2, and last with ellipses.
$pages_to_render = array();
if ( $total_pages <= 7 ) {
	for ( $p = 1; $p <= $total_pages; $p++ ) {
		$pages_to_render[] = $p;
	}
} else {
	$pages_to_render[] = 1;
	if ( $current_page > 3 ) {
		$pages_to_render[] = '…';
	}
	$start = max( 2, $current_page - 1 );
	$end   = min( $total_pages - 1, $current_page + 1 );
	for ( $p = $start; $p <= $end; $p++ ) {
		$pages_to_render[] = $p;
	}
	if ( $current_page < $total_pages - 2 ) {
		$pages_to_render[] = '…';
	}
	$pages_to_render[] = $total_pages;
}

$pagination_nav_class        = $ds ? $ds->classes_for( 'pagination' ) : 'cds--pagination-nav';
$pagination_list_class       = $ds ? $ds->classes_for( 'pagination', array( 'element' => 'list' ) ) : 'cds--pagination-nav__list';
$pagination_list_item_class  = $ds ? $ds->classes_for( 'pagination', array( 'element' => 'list-item' ) ) : 'cds--pagination-nav__list-item';
$pagination_page_class       = $ds ? $ds->classes_for( 'pagination', array( 'element' => 'page' ) ) : 'cds--pagination-nav__page';
$pagination_page_dis_class   = $ds ? $ds->classes_for(
	'pagination',
	array(
		'element'  => 'page',
		'disabled' => true,
	)
) : 'cds--pagination-nav__page cds--pagination-nav__page--disabled';
$pagination_page_cur_class   = $ds ? $ds->classes_for(
	'pagination',
	array(
		'element' => 'page',
		'current' => true,
	)
) : 'cds--pagination-nav__page cds--pagination-nav__page--current';
$pagination_page_ell_class   = $ds ? $ds->classes_for(
	'pagination',
	array(
		'element'  => 'page',
		'ellipsis' => true,
	)
) : 'cds--pagination-nav__page cds--pagination-nav__page--ellipsis';
$pagination_vis_hidden_class = $ds ? $ds->classes_for( 'pagination', array( 'element' => 'visually-hidden' ) ) : 'cds--visually-hidden';

$wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'      => $pagination_nav_class,
		'aria-label' => $aria_label,
	)
);

$prev_disabled = $current_page <= 1;
$next_disabled = $current_page >= $total_pages;

$prev_html = sprintf(
	'<li class="%2$s">%1$s</li>',
	$prev_disabled
		? sprintf(
			'<span class="%4$s" aria-disabled="true">%1$s<span class="%3$s">%2$s</span></span>',
			icon( 'chevron--left', 16 ),
			esc_html__( 'Previous page', 'awt-blocks' ),
			esc_attr( $pagination_vis_hidden_class ),
			esc_attr( $pagination_page_dis_class )
		)
		: sprintf(
			'<a class="%3$s" href="%1$s" aria-label="%2$s">%4$s</a>',
			esc_url( $page_link( $current_page - 1 ) ),
			esc_attr__( 'Previous page', 'awt-blocks' ),
			esc_attr( $pagination_page_class ),
			icon( 'chevron--left', 16 )
		),
	esc_attr( $pagination_list_item_class )
);

$next_html = sprintf(
	'<li class="%2$s">%1$s</li>',
	$next_disabled
		? sprintf(
			'<span class="%4$s" aria-disabled="true">%1$s<span class="%3$s">%2$s</span></span>',
			icon( 'chevron--right', 16 ),
			esc_html__( 'Next page', 'awt-blocks' ),
			esc_attr( $pagination_vis_hidden_class ),
			esc_attr( $pagination_page_dis_class )
		)
		: sprintf(
			'<a class="%3$s" href="%1$s" aria-label="%2$s">%4$s</a>',
			esc_url( $page_link( $current_page + 1 ) ),
			esc_attr__( 'Next page', 'awt-blocks' ),
			esc_attr( $pagination_page_class ),
			icon( 'chevron--right', 16 )
		),
	esc_attr( $pagination_list_item_class )
);

$items_html = '';
foreach ( $pages_to_render as $item ) {
	if ( $item === '…' ) {
		$items_html .= sprintf(
			'<li class="%1$s"><span class="%2$s" aria-hidden="true">…</span></li>',
			esc_attr( $pagination_list_item_class ),
			esc_attr( $pagination_page_ell_class )
		);
		continue;
	}
	$is_current = ( $item === $current_page );
	if ( $is_current ) {
		$items_html .= sprintf(
			'<li class="%3$s"><span class="%4$s" aria-current="page" aria-label="%1$s">%2$d</span></li>',
			// translators: %d — the page number of the current page.
			esc_attr( sprintf( __( 'Page %d, current page', 'awt-blocks' ), $item ) ),
			$item,
			esc_attr( $pagination_list_item_class ),
			esc_attr( $pagination_page_cur_class )
		);
	} else {
		$items_html .= sprintf(
			'<li class="%4$s"><a class="%5$s" href="%1$s" aria-label="%2$s">%3$d</a></li>',
			esc_url( $page_link( $item ) ),
			// translators: %d — the page number the link navigates to.
			esc_attr( sprintf( __( 'Page %d', 'awt-blocks' ), $item ) ),
			$item,
			esc_attr( $pagination_list_item_class ),
			esc_attr( $pagination_page_class )
		);
	}
}

printf(
	'<nav %1$s><ul class="%5$s">%2$s%3$s%4$s</ul></nav>',
	$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() output is pre-escaped by core.
	$prev_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$items_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	$next_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built above with all dynamic parts escaped.
	esc_attr( $pagination_list_class )
);
