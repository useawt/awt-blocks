/**
 * AWT Dropdown — view-side store.
 *
 * Carbon dropdown pattern: a button that opens a listbox below. Floating-ui
 * positions the listbox; installOutsideDismiss closes on outside-click,
 * Escape, or focus moving outside. Selection updates the trigger's display
 * value + the hidden <input> that participates in form submission.
 */

import { store, getElement, withSyncEvent } from '@wordpress/interactivity';
import { attach, installOutsideDismiss } from '../shared/floating-ui';

const handles = new WeakMap();
const dismissers = new WeakMap();

const HIGHLIGHTED = 'cds--list-box__menu-item--highlighted';
const ACTIVE = 'cds--list-box__menu-item--active';

/**
 * Type-to-select state, per dropdown.
 *
 * Screen readers announce `role="combobox"` as something you can type into, so
 * the role itself promises this. Carbon keeps that promise — measured on its
 * live component: typing "o" opens the list and lands on "Option 1", "op" keeps
 * matching, and the buffer clears after about a second. Ours promised it and did
 * nothing, which is worse than either supporting it or not claiming it.
 *
 * @type {WeakMap<HTMLElement, {buffer: string, timer: number}>}
 */
const typeahead = new WeakMap();

/** How long a typed prefix stays live. Downshift, which Carbon uses, waits 500ms. */
const TYPEAHEAD_MS = 500;

/**
 * The options, in DOM order.
 *
 * @param {Object} parts Result of getParts().
 * @return {HTMLElement[]} The `role="option"` elements.
 */
function itemsOf( parts ) {
	return [ ...parts.listbox.querySelectorAll( '[role="option"]' ) ];
}

/**
 * Index of the option carrying the moving highlight, or -1.
 *
 * @param {Object} parts Result of getParts().
 * @return {number} Index into itemsOf(), or -1 when nothing is highlighted.
 */
function highlightedIndex( parts ) {
	return itemsOf( parts ).findIndex( ( el ) =>
		el.classList.contains( HIGHLIGHTED )
	);
}

/**
 * Move the highlight to one option.
 *
 * The highlight is NOT focus. Focus stays on the combobox for the whole
 * interaction and the option is pointed at with `aria-activedescendant` — the
 * listbox pattern, and what Carbon does. Moving real focus into the list is
 * what the old markup did (via a button per option) and what this replaces.
 *
 * @param {Object} parts Result of getParts().
 * @param {number} index Index into itemsOf().
 */
function highlight( parts, index ) {
	const items = itemsOf( parts );
	items.forEach( ( el ) => el.classList.remove( HIGHLIGHTED ) );
	const el = items[ index ];
	if ( ! el ) {
		parts.trigger.setAttribute( 'aria-activedescendant', '' );
		return;
	}
	el.classList.add( HIGHLIGHTED );
	parts.trigger.setAttribute( 'aria-activedescendant', el.id );
	el.scrollIntoView( { block: 'nearest' } );
}

/**
 * Index of the chosen option, or -1 when nothing has been chosen yet.
 *
 * @param {Object} parts Result of getParts().
 * @return {number} Index into itemsOf(), or -1.
 */
function selectedIndex( parts ) {
	return itemsOf( parts ).findIndex(
		( el ) => el.getAttribute( 'aria-selected' ) === 'true'
	);
}

/**
 * Extend the typed prefix and move the highlight to the first option matching it.
 *
 * @param {Object} parts Result of getParts().
 * @param {string} char  The character just typed.
 * @return {boolean} True when a matching option was found.
 */
function typeToSelect( parts, char ) {
	const state = typeahead.get( parts.root ) || { buffer: '', timer: 0 };
	window.clearTimeout( state.timer );
	state.buffer += char.toLowerCase();
	state.timer = window.setTimeout( () => {
		state.buffer = '';
	}, TYPEAHEAD_MS );
	typeahead.set( parts.root, state );

	const items = itemsOf( parts );
	let index = items.findIndex( ( el ) =>
		el.textContent.trim().toLowerCase().startsWith( state.buffer )
	);

	// A repeated single character cycles through the options starting with it —
	// the standard behavior when someone presses the same key again rather than
	// spelling a longer prefix.
	const repeated =
		state.buffer.length > 1 &&
		state.buffer === state.buffer[ 0 ].repeat( state.buffer.length );
	if ( index < 0 && repeated ) {
		const letter = state.buffer[ 0 ];
		const matches = items.filter( ( el ) =>
			el.textContent.trim().toLowerCase().startsWith( letter )
		);
		if ( matches.length ) {
			const nth = ( state.buffer.length - 1 ) % matches.length;
			index = items.indexOf( matches[ nth ] );
		}
	}

	if ( index < 0 ) {
		return false;
	}
	highlight( parts, index );
	return true;
}

/**
 * Choose an option: update the trigger's shown text, the hidden input that
 * takes part in form submission, and `aria-selected` on the options.
 *
 * @param {Object}      parts Result of getParts().
 * @param {HTMLElement} el    The `role="option"` element to choose.
 */
function selectOption( parts, el ) {
	if ( ! el ) {
		return;
	}
	const items = itemsOf( parts );
	items.forEach( ( o ) => {
		o.setAttribute( 'aria-selected', String( o === el ) );
		o.classList.toggle( ACTIVE, o === el );
	} );
	const labelEl = parts.root.querySelector( '.cds--list-box__label' );
	if ( labelEl ) {
		labelEl.textContent = el.textContent.trim();
	}
	if ( parts.hidden ) {
		parts.hidden.value = el.dataset.value || '';
	}
	close( parts, /* returnFocus */ true );
}

function getParts( ref ) {
	const root = ref.closest( '.cds--dropdown' );
	if ( ! root ) {
		return null;
	}
	const trigger = root.querySelector( '.cds--list-box__field' );
	const listbox = root.querySelector( '.cds--list-box__menu' );
	const hidden = root.querySelector( 'input[type="hidden"]' );
	return trigger && listbox ? { root, trigger, listbox, hidden } : null;
}

function open( parts ) {
	const { root, trigger, listbox } = parts;
	// Match the menu's width to the trigger so it doesn't grow to whatever
	// the closest positioned ancestor allows. With `position: fixed` (from
	// the floating-ui helper) the menu's natural containing block is the
	// viewport, which made the menu render at full window width — Carbon's
	// `.cds--list-box__menu` rule has `inline-size: 100%`, so 100% became
	// 100vw. Pinning width here keeps it locked to the trigger.
	listbox.style.width = `${ trigger.offsetWidth }px`;
	listbox.removeAttribute( 'hidden' );
	trigger.setAttribute( 'aria-expanded', 'true' );
	root.classList.add( 'cds--list-box--expanded' );
	if ( ! handles.has( root ) ) {
		handles.set(
			root,
			attach( trigger, listbox, {
				placement: 'bottom-start',
				offsetPx: 0,
			} )
		);
	}
	if ( ! dismissers.has( root ) ) {
		dismissers.set(
			root,
			installOutsideDismiss( listbox, trigger, () =>
				close( parts, false )
			)
		);
	}
}

function close( parts, returnFocus = true ) {
	const { root, trigger, listbox } = parts;
	listbox.setAttribute( 'hidden', '' );
	listbox.style.width = '';
	trigger.setAttribute( 'aria-expanded', 'false' );
	// A closed listbox has no active option to point at. Carbon empties this
	// too — there, because React unmounts the options; here, because they stay
	// in the DOM behind `hidden` and a stale id would outlive what it named.
	trigger.setAttribute( 'aria-activedescendant', '' );
	// Closing also drops any typed prefix. Without this, a prefix typed just
	// before closing survives into the next keystroke, so typing "s" after a
	// stray "v" searches for "vs" and appears to do nothing at all.
	const typed = typeahead.get( root );
	if ( typed ) {
		window.clearTimeout( typed.timer );
		typed.buffer = '';
	}
	listbox
		.querySelectorAll( `.${ HIGHLIGHTED }` )
		.forEach( ( el ) => el.classList.remove( HIGHLIGHTED ) );
	root.classList.remove( 'cds--list-box--expanded' );
	const h = handles.get( root );
	if ( h ) {
		h.dispose();
		handles.delete( root );
	}
	const d = dismissers.get( root );
	if ( d ) {
		d();
		dismissers.delete( root );
	}
	if ( returnFocus && trigger ) {
		trigger.focus();
	}
}

store( 'awt/dropdown', {
	actions: {
		toggle() {
			const parts = getParts( getElement().ref );
			if ( ! parts ) {
				return;
			}
			if ( parts.trigger.getAttribute( 'aria-expanded' ) === 'true' ) {
				close( parts, /* returnFocus */ false );
			} else {
				open( parts );
			}
		},
		choose() {
			const el = getElement().ref;
			const parts = getParts( el );
			if ( parts ) {
				selectOption( parts, el );
			}
		},
		keydown: withSyncEvent( ( event ) => {
			const parts = getParts( getElement().ref );
			if ( ! parts ) {
				return;
			}
			const expanded =
				parts.trigger.getAttribute( 'aria-expanded' ) === 'true';
			const { key } = event;

			// Every branch below calls preventDefault(). On a <button>, Enter
			// fires a click on keydown and Space on keyup, so without it the
			// trigger's own click action would run a second time and undo what
			// the key just did. It also stops Home/End/arrows scrolling the page.
			if ( key === 'Escape' ) {
				if ( expanded ) {
					event.preventDefault();
					close( parts );
				}
				return;
			}

			if ( key === 'Enter' || key === ' ' ) {
				event.preventDefault();
				if ( ! expanded ) {
					open( parts );
					highlight( parts, Math.max( selectedIndex( parts ), 0 ) );
					return;
				}
				const i = highlightedIndex( parts );
				if ( i >= 0 ) {
					selectOption( parts, itemsOf( parts )[ i ] );
				} else {
					close( parts );
				}
				return;
			}

			if (
				key !== 'ArrowDown' &&
				key !== 'ArrowUp' &&
				key !== 'Home' &&
				key !== 'End'
			) {
				// Type to select. Single printable characters only, and never with
				// a modifier held, so browser and screen-reader shortcuts still
				// reach the page. Space is deliberately excluded: it is handled
				// above as open/select, which is what Carbon's does too.
				if (
					key.length === 1 &&
					key !== ' ' &&
					! event.ctrlKey &&
					! event.metaKey &&
					! event.altKey
				) {
					if ( ! expanded ) {
						open( parts );
					}
					if ( typeToSelect( parts, key ) ) {
						event.preventDefault();
					}
				}
				return;
			}
			event.preventDefault();
			const items = itemsOf( parts );
			if ( ! items.length ) {
				return;
			}
			if ( ! expanded ) {
				// Opening with an arrow lands on the chosen option if there is
				// one, so re-opening does not lose the visitor's place.
				open( parts );
				const chosen = selectedIndex( parts );
				let from = 0;
				if ( chosen >= 0 ) {
					from = chosen;
				} else if ( key === 'ArrowUp' ) {
					from = items.length - 1;
				}
				highlight( parts, from );
				return;
			}
			const cur = highlightedIndex( parts );
			let next;
			if ( key === 'Home' ) {
				next = 0;
			} else if ( key === 'End' ) {
				next = items.length - 1;
			} else if ( key === 'ArrowDown' ) {
				next = cur < 0 ? 0 : Math.min( cur + 1, items.length - 1 );
			} else {
				next = cur < 0 ? items.length - 1 : Math.max( cur - 1, 0 );
			}
			highlight( parts, next );
		} ),
	},
} );
