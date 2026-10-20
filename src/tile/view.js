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

// Carbon's SelectableTile icons: Checkbox while unselected (the server
// renders it), CheckboxCheckedFilled once selected. Static markup, swapped
// whole the way Carbon's React re-render swaps the icon.
const SVG_OPEN =
	'<svg focusable="false" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">';
const CHECKBOX = `${ SVG_OPEN }<path d="M26,4H6A2,2,0,0,0,4,6V26a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V6A2,2,0,0,0,26,4ZM6,26V6H26V26Z"/></svg>`;
const CHECKBOX_CHECKED = `${ SVG_OPEN }<path d="M26,4H6A2,2,0,0,0,4,6V26a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V6A2,2,0,0,0,26,4ZM14,21.5,9,16.5427,10.5908,15,14,18.3456,21.4087,11l1.5918,1.5772Z"/><path fill="none" d="M14,21.5,9,16.5427,10.5908,15,14,18.3456,21.4087,11l1.5918,1.5772Z" data-icon-path="inner-path"/></svg>`;

store( 'awt/tile', {
	actions: {
		toggle() {
			const ref = getElement().ref;
			const current = ref.getAttribute( 'aria-checked' ) === 'true';
			ref.setAttribute( 'aria-checked', current ? 'false' : 'true' );
			ref.classList.toggle( 'cds--tile--is-selected', ! current );
			const mark = ref.querySelector( ':scope > .cds--tile__checkmark' );
			if ( mark ) {
				mark.innerHTML = current ? CHECKBOX : CHECKBOX_CHECKED;
			}
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
