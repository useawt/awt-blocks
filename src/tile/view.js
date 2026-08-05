/**
 * AWT Tile — view-side store.
 *
 * Only ONE interactive variant needs script: the ungrouped selectable tile,
 * which is `role="checkbox"` + `aria-checked` because HTML has no native
 * element for "a box-shaped checkbox with arbitrary content inside". Carbon
 * makes the same choice for the same case.
 *
 * Grouped selectable tiles used to be handled here too — a `role="radio"` store
 * that walked the document to deselect siblings. They are now a real
 * `<input type="radio">` with the tile as its `<label>`, so the browser does
 * exclusive selection, arrow-key navigation, the single tab stop, and the
 * submitted value, and theme.css draws the selected state from `:checked`.
 * That branch was deleted rather than reimplemented.
 *
 * Expandable tiles use native `<details>`, so they need nothing here either.
 */

import { store, getElement, withSyncEvent } from '@wordpress/interactivity';

store( 'awt/tile', {
	actions: {
		toggle() {
			const ref = getElement().ref;
			const current = ref.getAttribute( 'aria-checked' ) === 'true';
			ref.setAttribute( 'aria-checked', current ? 'false' : 'true' );
			ref.classList.toggle( 'cds--tile--is-selected', ! current );
		},
		keydown: withSyncEvent( ( event ) => {
			if ( event.key !== ' ' && event.key !== 'Enter' ) {
				return;
			}
			event.preventDefault();
			getElement().ref.click();
		} ),
	},
} );
