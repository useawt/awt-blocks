/**
 * AWT Tabs — view-side store.
 *
 * Pairs tabs with panels by DOM order: the Nth tab activates the Nth panel.
 * The server renders the first usable tab selected and its panel visible, so
 * the block works without JavaScript; clicking or keyboard-navigating
 * (Left/Right/Home/End) updates the selected tab + reveals the matching
 * panel. Keyboard pattern follows WAI-ARIA's "automatic activation" tabs
 * pattern (arrow keys move + activate immediately).
 */

import { store, getElement, withSyncEvent } from '@wordpress/interactivity';

function getRoot( ref ) {
	return ref.closest( '.cds--tabs' );
}

function getTabList( root ) {
	// For horizontal tabs, the <ul> is now nested inside `.awt-tabs__strip`.
	// For vertical it remains a direct child. A bare descendant query
	// finds both — there's never a nested tablist inside a tab.
	return root.querySelector( '.cds--tab--list' );
}

function getTabs( root ) {
	// `role="tab"` lives on the inner button, not on the wrapping `<li>`
	// (the LI carries `role="presentation"` to take it out of the
	// accessibility tree). Loosened from the old `:scope > .cds--tab--list`
	// path now that horizontal tabs wrap the <ul> in `.awt-tabs__strip` —
	// the tab buttons are still uniquely the only `[role="tab"]` descendants.
	return Array.from(
		root.querySelectorAll( '.cds--tab--list [role="tab"]' )
	);
}

function getPanels( root ) {
	return Array.from( root.querySelectorAll( ':scope > [role="tabpanel"]' ) );
}

function activate( root, target ) {
	const tabs = getTabs( root );
	const panels = getPanels( root );
	tabs.forEach( ( t, i ) => {
		const isTarget = t === target;
		t.setAttribute( 'aria-selected', isTarget ? 'true' : 'false' );
		t.setAttribute( 'tabindex', isTarget ? '0' : '-1' );
		t.classList.toggle( 'cds--tabs__nav-item--selected', isTarget );
		if ( panels[ i ] ) {
			panels[ i ].toggleAttribute( 'hidden', ! isTarget );
		}
	} );
}

/**
 * Update the visibility of the prev/next overflow buttons based on the
 * tablist's scroll position. Mirrors Carbon's behavior:
 *
 *   - prev button hidden when scrolled fully to the start
 *   - next button hidden when scrolled fully to the end
 *   - both hidden when content fits without scrolling
 *
 * Carbon's `--hidden` modifier already provides `display: none`, so
 * we just toggle that class. Called from init, on the list's scroll
 * event, and on window resize.
 * @param {HTMLElement} root Tabs block root element.
 */
function updateOverflowButtons( root ) {
	const strip = root.querySelector( ':scope > .awt-tabs__strip' );
	if ( ! strip ) {
		return;
	} // vertical tabs — no strip wrapper
	const list = strip.querySelector( '.cds--tab--list' );
	const prev = strip.querySelector(
		'.cds--tab--overflow-nav-button--previous'
	);
	const next = strip.querySelector( '.cds--tab--overflow-nav-button--next' );
	if ( ! list || ! prev || ! next ) {
		return;
	}

	const overflowing = list.scrollWidth > list.clientWidth + 1;
	if ( ! overflowing ) {
		prev.classList.add( 'cds--tab--overflow-nav-button--hidden' );
		next.classList.add( 'cds--tab--overflow-nav-button--hidden' );
		return;
	}
	const atStart = list.scrollLeft <= 0;
	const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;
	prev.classList.toggle( 'cds--tab--overflow-nav-button--hidden', atStart );
	next.classList.toggle( 'cds--tab--overflow-nav-button--hidden', atEnd );
}

/**
 * Scroll the tablist by ~80% of its visible width in the given direction.
 * 80% (not 100%) keeps a sliver of the previous viewport visible so the
 * user retains spatial context across paging — same heuristic Carbon uses.
 * @param {HTMLElement} root      Tabs block root element.
 * @param {number}      direction -1 for back, 1 for forward.
 */
function scrollBy( root, direction ) {
	const list = getTabList( root );
	if ( ! list ) {
		return;
	}
	const delta = list.clientWidth * 0.8 * direction;
	list.scrollBy( { left: delta, behavior: 'smooth' } );
}

store( 'awt/tabs', {
	callbacks: {
		init() {
			const root = getElement().ref;
			const tabs = getTabs( root );
			const panels = getPanels( root );
			// Pair by DOM-ordinal: tab N controls panel N. Wires the
			// aria-controls + aria-labelledby pair + activates the first tab.
			tabs.forEach( ( tab, i ) => {
				const panel = panels[ i ];
				if ( panel ) {
					tab.setAttribute( 'aria-controls', panel.id );
					panel.setAttribute( 'aria-labelledby', tab.id );
				}
			} );
			// The server already renders one tab selected and its panel
			// visible, so honour that rather than resetting to the first
			// tab. Only pick one here when the markup has none selected.
			if ( tabs.length > 0 ) {
				const already = tabs.find(
					( t ) => t.getAttribute( 'aria-selected' ) === 'true'
				);
				const fallback =
					tabs.find( ( t ) => ! t.disabled ) || tabs[ 0 ];
				activate( root, already || fallback );
			}

			// Wire overflow-nav state. The tablist may not have its
			// final width yet (fonts, images, late layout), so update
			// once now and once after the next frame to catch settled
			// dimensions. Also re-check on scroll + on resize.
			updateOverflowButtons( root );
			requestAnimationFrame( () => updateOverflowButtons( root ) );
			const list = getTabList( root );
			if ( list ) {
				list.addEventListener(
					'scroll',
					() => updateOverflowButtons( root ),
					{ passive: true }
				);
			}
			// Resize listener is attached to window — one per tabs
			// instance, that's fine; modern browsers de-dupe identical
			// handler refs and the cost is negligible.
			window.addEventListener( 'resize', () =>
				updateOverflowButtons( root )
			);
		},
	},
	actions: {
		choose() {
			const btn = getElement().ref;
			const root = getRoot( btn );
			if ( root ) {
				activate( root, btn );
				btn.focus();
				// Selected tab might be outside the visible scroll
				// window — pull it into view. `nearest` keeps the
				// selected tab from re-centering on every click.
				btn.scrollIntoView( {
					block: 'nearest',
					inline: 'nearest',
					behavior: 'smooth',
				} );
			}
		},
		scrollPrev() {
			const root = getRoot( getElement().ref );
			if ( root ) {
				scrollBy( root, -1 );
			}
		},
		scrollNext() {
			const root = getRoot( getElement().ref );
			if ( root ) {
				scrollBy( root, 1 );
			}
		},
		keydown: withSyncEvent( ( event ) => {
			if (
				! [
					'ArrowLeft',
					'ArrowRight',
					'ArrowUp',
					'ArrowDown',
					'Home',
					'End',
				].includes( event.key )
			) {
				return;
			}
			event.preventDefault();
			const btn = getElement().ref;
			const root = getRoot( btn );
			if ( ! root ) {
				return;
			}
			const tabs = getTabs( root );
			let idx = tabs.indexOf( btn );
			const horizontal = root.classList.contains(
				'cds--tabs--horizontal'
			);
			const prev = horizontal ? 'ArrowLeft' : 'ArrowUp';
			const next = horizontal ? 'ArrowRight' : 'ArrowDown';
			if ( event.key === prev ) {
				idx = ( idx - 1 + tabs.length ) % tabs.length;
			} else if ( event.key === next ) {
				idx = ( idx + 1 ) % tabs.length;
			} else if ( event.key === 'Home' ) {
				idx = 0;
			} else if ( event.key === 'End' ) {
				idx = tabs.length - 1;
			}
			const target = tabs[ idx ];
			if ( target ) {
				activate( root, target );
				target.focus();
			}
		} ),
	},
} );
