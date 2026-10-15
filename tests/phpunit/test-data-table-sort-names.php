<?php
/**
 * A sortable column's button is named by its visible label alone.
 *
 * The button carried "Sort by Name", which became "Sort by Name, currently
 * ascending. Click to sort descending." after a sort, and a header's name is
 * what a screen reader reads before every cell in its column (outside
 * accessibility review, 2026-10-15). `aria-sort` on the header carries the
 * state, and the table's live region announces each change.
 *
 * @package AWT\Blocks
 */

/**
 * Checks the sortable header markup.
 */
class Test_Data_Table_Sort_Names extends WP_UnitTestCase {

	/**
	 * Renders a table.
	 *
	 * @param bool $sortable Whether the columns sort.
	 * @return string Rendered HTML.
	 */
	private function render( bool $sortable ): string {
		$attrs = array(
			'headers'  => array(
				array(
					'key'  => 'name',
					'text' => 'Name',
				),
				array(
					'key'  => 'status',
					'text' => 'Status',
				),
			),
			'rows'     => array(
				array(
					'name'   => 'Acme',
					'status' => 'Healthy',
				),
			),
			'sortable' => $sortable,
		);
		return do_blocks( '<!-- wp:awt/data-table ' . wp_json_encode( $attrs ) . ' /-->' );
	}

	/**
	 * Each sort button has no name of its own, so its label names it.
	 */
	public function test_sort_button_named_by_its_label() {
		$html = $this->render( true );
		$this->assertSame( 2, preg_match_all( '#<th scope="col" data-key="\w+" aria-sort="none"><button type="button" class="[^"]*cds--table-sort[^"]*"#', $html ) );
		$this->assertStringNotContainsString( 'Sort by', $html );
		$this->assertDoesNotMatchRegularExpression( '#<button[^>]*cds--table-sort[^>]*aria-label#', $html );
		$this->assertMatchesRegularExpression( '#<span class="cds--table-header-label">Name</span>#', $html );
	}

	/**
	 * The live region the sort state is announced through is still there.
	 */
	public function test_live_region_stays() {
		$this->assertMatchesRegularExpression( '#<div class="awt-data-table__sort-announce [^"]*" aria-live="polite" aria-atomic="true"#', $this->render( true ) );
	}

	/**
	 * A table that does not sort has plain headers.
	 */
	public function test_plain_headers_without_sort() {
		$html = $this->render( false );
		$this->assertStringNotContainsString( '<button', $html );
		$this->assertStringNotContainsString( 'aria-sort', $html );
	}
}
