/**
 * AWT Data table — view-side sorting.
 *
 * Click any sortable column header to toggle sort direction on that column.
 * First click = ascending, second = descending, third = none (rows restored
 * to the original DOM order, cached on init).
 *
 * Accessibility:
 *
 *   - `aria-sort` on the <th> reflects the current state ("ascending" /
 *     "descending" / "none"). Screen readers announce this on focus.
 *
 *   - The sort button is named by its visible column label alone. It used
 *     to carry "Sort by Amount, currently ascending. Click to sort
 *     descending.", which repeated `aria-sort`, and a header's name is read
 *     before every cell in its column (outside accessibility review,
 *     2026-10-15).
 *
 *   - A visually-hidden live region (`.awt-data-table__sort-announce`)
 *     announces sort changes when they happen — aria-sort alone only tells
 *     SRs the state on FOCUS, not on activation. The live region fills that
 *     gap with a short message after every click.
 *
 *   - The button's active state is reflected with `cds--table-sort--active`
 *     and `cds--table-sort--descending` classes, which Carbon's CSS keys off
 *     to swap the unsorted icon (Carbon `arrows--vertical`) for the active
 *     sort-direction icon (Carbon `arrow--down`, rotated 180° for descending).
 *
 * Sort is client-side only; rows live in the DOM. Tables filled from a live
 * source (the `awt_data_table_data` filter) render the same rows and sort here
 * too.
 */

import { store, getContext, getElement } from '@wordpress/interactivity';

const original = new WeakMap();

function snapshot( tbody ) {
	if ( original.has( tbody ) ) {
		return;
	}
	original.set( tbody, Array.from( tbody.children ) );
}

function compareCell( a, b, key, direction ) {
	const av =
		a.querySelector( `td[data-key="${ key }"]` )?.textContent.trim() || '';
	const bv =
		b.querySelector( `td[data-key="${ key }"]` )?.textContent.trim() || '';
	const an = parseFloat( av );
	const bn = parseFloat( bv );
	if ( ! Number.isNaN( an ) && ! Number.isNaN( bn ) ) {
		return direction === 'asc' ? an - bn : bn - an;
	}
	return direction === 'asc'
		? av.localeCompare( bv )
		: bv.localeCompare( av );
}

function applySort( table, key, direction ) {
	const tbody = table.querySelector( 'tbody' );
	if ( ! tbody ) {
		return;
	}
	snapshot( tbody );
	if ( direction === 'none' ) {
		original.get( tbody ).forEach( ( row ) => tbody.appendChild( row ) );
		return;
	}
	const rows = Array.from( tbody.children );
	rows.sort( ( a, b ) => compareCell( a, b, key, direction ) );
	rows.forEach( ( row ) => tbody.appendChild( row ) );
}

/**
 * Update both DOM ARIA and CSS active-state classes after a sort change.
 *
 * - `aria-sort` on the <th> reflects current state (announced on focus).
 * - `cds--table-sort--active` + `cds--table-sort--descending` on the <button>
 *   drive Carbon's CSS that swaps the unsorted icon for the active icon and
 *   rotates the active icon 180° for descending.
 * @param {HTMLElement} table     The table element.
 * @param {string}      activeKey Column key of the active sort.
 * @param {string}      direction 'ascending' or 'descending'.
 */
function setIndicators( table, activeKey, direction ) {
	table.querySelectorAll( 'thead th[data-key]' ).forEach( ( th ) => {
		const isActive = th.dataset.key === activeKey;
		const btn = th.querySelector( '.cds--table-sort' );

		if ( isActive && direction !== 'none' ) {
			const ariaSort = direction === 'asc' ? 'ascending' : 'descending';
			th.setAttribute( 'aria-sort', ariaSort );
			if ( btn ) {
				btn.classList.add( 'cds--table-sort--active' );
				btn.classList.toggle(
					'cds--table-sort--descending',
					direction === 'desc'
				);
			}
		} else {
			th.setAttribute( 'aria-sort', 'none' );
			if ( btn ) {
				btn.classList.remove(
					'cds--table-sort--active',
					'cds--table-sort--descending'
				);
			}
		}
	} );
}

/**
 * The live region's message after a sort, from the translated messages
 * render.php puts in the store's state.
 *
 * @param {HTMLElement} table     The table element.
 * @param {string}      key       Column key of the active sort.
 * @param {string}      direction 'asc', 'desc' or 'none'.
 * @return {string} The message.
 */
function announcementFor( table, key, direction ) {
	const { state } = store( 'awt/data-table' );
	if ( ! key || direction === 'none' ) {
		return state.sortCleared;
	}
	const btn = table.querySelector(
		`thead th[data-key="${ key }"] .cds--table-sort`
	);
	const columnLabel = btn?.dataset.columnLabel || key;
	const message =
		direction === 'asc' ? state.sortedAscending : state.sortedDescending;
	// A translation may number the placeholder ("%1$s").
	return message.replace( /%(1\$)?s/, () => columnLabel );
}

store( 'awt/data-table', {
	callbacks: {
		init() {
			const root = getElement().ref;
			const table = root.querySelector( 'table' );
			if ( ! table ) {
				return;
			}
			const defaultKey = root.dataset.defaultSortKey || '';
			const defaultDir = root.dataset.defaultSortDirection || 'asc';
			if ( defaultKey ) {
				applySort( table, defaultKey, defaultDir );
				setIndicators( table, defaultKey, defaultDir );
				// Don't announce defaults — they aren't user-initiated.
			}
		},
	},
	actions: {
		sortColumn() {
			// getElement().ref returns the element carrying `data-wp-on--click`
			// — that's the <button class="cds--table-sort">, NOT the <th>.
			// data-key + aria-sort live on the parent <th>; walk up.
			const btn = getElement().ref;
			const th = btn.closest( 'th' );
			if ( ! th ) {
				return;
			}
			const table = th.closest( 'table' );
			if ( ! table ) {
				return;
			}
			const key = th.dataset.key;
			const current = th.getAttribute( 'aria-sort' );
			// aria-sort cycle: ascending → descending → none → ascending.
			const next =
				{ ascending: 'descending', descending: 'none' }[ current ] ||
				'ascending';
			const direction =
				{ ascending: 'asc', descending: 'desc' }[ next ] || 'none';
			applySort( table, key, direction );
			setIndicators( table, key, direction );
			// Trigger the live-region announcement. Writing to this table's
			// context.sortAnnouncement re-renders its `data-wp-text` element,
			// which screen readers pick up via aria-live="polite".
			getContext().sortAnnouncement = announcementFor(
				table,
				key,
				direction
			);
		},
	},
} );
