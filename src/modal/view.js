/**
 * AWT Modal — view-side store.
 *
 * Open / close mechanics:
 *   - Listens for the `awt:toggle-panel` CustomEvent on document. When the
 *     event's `detail.id` matches this modal's id, the modal opens (or
 *     toggles if already open).
 *   - Escape closes; clicking the backdrop closes; focus returns to the
 *     element that opened the modal (provided via `event.detail.source`).
 *   - Focus trap: Tab from the last focusable wraps to the first, and
 *     Shift+Tab from the first wraps to the last.
 *
 *   - The rest of the page is `inert` while the modal is open, so a screen
 *     reader cannot read it either (see `makeRestInert`). Text the dialog
 *     is named or described by out there is copied in until it closes (see
 *     `borrowOutsideText`).
 *
 * The modal doesn't re-render itself when toggled; it just mutates
 * `aria-hidden`, the inline `display`, body scroll lock, `inert` on the rest
 * of the page, and focus.
 */

import { store, getElement } from '@wordpress/interactivity';

const FOCUSABLE = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
].join( ',' );

const handlers = new WeakMap();

// Where each open modal came from, so it can be put back exactly there.
const origins = new WeakMap();

/**
 * Lift the modal out to the end of <body> while it is open.
 *
 * Tokens are only half of what an ancestor can do to a dialog. The same move
 * into the footer put the forms inside every rule that site writes for its
 * footer: a white heading colour (invisible on the dialog), emptied list
 * markers, and a white focus ring — on a white dialog, which is a focus
 * indicator nobody can see. None of that is reachable by fixing tokens,
 * because those rules name an ancestor.
 *
 * A dialog covers the page, so the page is where it belongs. The overlay is
 * `position: fixed` and out of flow already, so nothing reflows where it left.
 *
 * @param {HTMLElement} modal The modal root.
 */
function liftToBody( modal ) {
	if ( modal.parentElement === document.body ) {
		return;
	}
	origins.set( modal, {
		parent: modal.parentElement,
		next: modal.nextSibling,
	} );
	document.body.appendChild( modal );
}

/**
 * Put it back where the page rendered it.
 *
 * @param {HTMLElement} modal The modal root.
 */
function returnToOrigin( modal ) {
	const origin = origins.get( modal );
	if ( ! origin || ! origin.parent || ! origin.parent.isConnected ) {
		return;
	}
	origin.parent.insertBefore( modal, origin.next );
	origins.delete( modal );
}

// What each open modal made inert, so closing it undoes exactly that.
const inerted = new WeakMap();

const NOT_CONTENT = [ 'SCRIPT', 'STYLE', 'TEMPLATE', 'LINK', 'NOSCRIPT' ];

/**
 * Make everything on the page but the open modal `inert`.
 *
 * `aria-modal` alone left the page behind the dialog readable: VoiceOver in
 * Safari does not honour it, and its reading cursor walked out of the dialog
 * into the page, while Tab, which the trap below holds, stayed in (reported
 * by the outside accessibility review, 2026-10-13). The modal is lifted to
 * the end of <body> first, so its siblings there are the whole page.
 * Anything already inert is left alone, so a modal opened from another one
 * makes the first inert and gives it back on close.
 *
 * @param {HTMLElement} modal The modal root.
 */
function makeRestInert( modal ) {
	const made = [];
	for ( const el of modal.ownerDocument.body.children ) {
		if ( el === modal || el.inert || NOT_CONTENT.includes( el.tagName ) ) {
			continue;
		}
		el.inert = true;
		made.push( el );
	}
	inerted.set( modal, made );
}

/**
 * Give the page back. Before focus returns to the opener, which is in it.
 *
 * @param {HTMLElement} modal The modal root.
 */
function restoreRest( modal ) {
	( inerted.get( modal ) || [] ).forEach( ( el ) => {
		el.inert = false;
	} );
	inerted.delete( modal );
}

// What each open modal copied in, so closing it puts the page back as it was.
const borrowed = new WeakMap();

const REFERENCES = [ 'aria-labelledby', 'aria-describedby' ];

/**
 * Copy into the dialog any text it is named or described by from outside it.
 *
 * An author can point a modal's Labelled by or Described by (Accessibility
 * panel) at text anywhere on the page. While the modal is open that page is
 * inert, and Chrome will not take a name or a description from inert text:
 * the dialog came out with no name at all, since the panel's Labelled by had
 * replaced its heading's (found testing the panel-names fix, 2026-10-14). So
 * each outside reference, on the dialog or on anything in it, is pointed at
 * a hidden copy inside the dialog while it is open. `hidden` keeps the copy
 * off the screen and out of the reading order; a name or description is
 * still taken from it, which is what `hidden` text referenced this way is
 * for. References inside the modal are left alone.
 *
 * @param {HTMLElement} modal The modal root.
 */
function borrowOutsideText( modal ) {
	const doc = modal.ownerDocument;
	const host = modal.querySelector( '[role="dialog"]' ) || modal;
	const made = { attrs: [], copies: [] };
	const copyOf = new Map();
	const holders = [
		modal,
		...modal.querySelectorAll( '[aria-labelledby], [aria-describedby]' ),
	];
	for ( const el of holders ) {
		for ( const attr of REFERENCES ) {
			const value = el.getAttribute( attr );
			if ( ! value ) {
				continue;
			}
			let changed = false;
			const ids = value
				.trim()
				.split( /\s+/ )
				.map( ( id ) => {
					const source = doc.getElementById( id );
					if ( ! source || modal.contains( source ) ) {
						return id;
					}
					if ( ! copyOf.has( id ) ) {
						const copy = doc.createElement( 'span' );
						copy.id = `${ id }--awt-modal-copy`;
						copy.hidden = true;
						copy.textContent = (
							source.getAttribute( 'aria-label' ) ||
							source.textContent ||
							''
						)
							.replace( /\s+/g, ' ' )
							.trim();
						host.appendChild( copy );
						made.copies.push( copy );
						copyOf.set( id, copy.id );
					}
					changed = true;
					return copyOf.get( id );
				} );
			if ( changed ) {
				made.attrs.push( [ el, attr, value ] );
				el.setAttribute( attr, ids.join( ' ' ) );
			}
		}
	}
	borrowed.set( modal, made );
}

/**
 * Point every reference back at the page and remove the copies.
 *
 * @param {HTMLElement} modal The modal root.
 */
function returnOutsideText( modal ) {
	const made = borrowed.get( modal );
	if ( ! made ) {
		return;
	}
	made.attrs.forEach( ( [ el, attr, value ] ) =>
		el.setAttribute( attr, value )
	);
	made.copies.forEach( ( copy ) => copy.remove() );
	borrowed.delete( modal );
}

function focusableIn( modal ) {
	return Array.from( modal.querySelectorAll( FOCUSABLE ) ).filter( ( el ) => {
		if ( el.hasAttribute( 'aria-hidden' ) || el.closest( '[hidden]' ) ) {
			return false;
		}
		// Something the selector matches but Tab never reaches would become a
		// "last" element that focus never lands on, and the wrap back to the
		// first would never fire — the trap silently stops trapping. A form's
		// honeypot field is exactly this: a real input, taken out of the tab
		// order with tabindex="-1".
		if ( el.tabIndex < 0 ) {
			return false;
		}
		// display:none and friends. A visually hidden control that is still
		// reachable by keyboard — a skip link — keeps its rects and stays.
		return el.getClientRects().length > 0;
	} );
}

function open( modal, returnTo ) {
	if ( modal.classList.contains( 'is-visible' ) ) {
		return;
	}
	modal.classList.add( 'is-visible' );
	modal.removeAttribute( 'aria-hidden' );
	document.body.style.overflow = 'hidden';

	liftToBody( modal );
	borrowOutsideText( modal );
	makeRestInert( modal );

	const items = focusableIn( modal );
	if ( items.length > 0 ) {
		queueMicrotask( () => items[ 0 ].focus() );
	}

	const onKey = ( e ) => {
		if ( e.key === 'Escape' ) {
			e.stopPropagation();
			close( modal );
			return;
		}
		if ( e.key === 'Tab' ) {
			const list = focusableIn( modal );
			if ( list.length === 0 ) {
				return;
			}
			const first = list[ 0 ];
			const last = list[ list.length - 1 ];
			const active = modal.ownerDocument.activeElement;
			if ( e.shiftKey && active === first ) {
				e.preventDefault();
				last.focus();
			} else if ( ! e.shiftKey && active === last ) {
				e.preventDefault();
				first.focus();
			}
		}
	};
	document.addEventListener( 'keydown', onKey );
	handlers.set( modal, { onKey, returnTo } );
}

function close( modal ) {
	if ( ! modal.classList.contains( 'is-visible' ) ) {
		return;
	}
	modal.classList.remove( 'is-visible' );
	modal.setAttribute( 'aria-hidden', 'true' );
	document.body.style.overflow = '';
	returnOutsideText( modal );
	restoreRest( modal );
	returnToOrigin( modal );

	const h = handlers.get( modal );
	if ( h ) {
		document.removeEventListener( 'keydown', h.onKey );
		if ( h.returnTo && typeof h.returnTo.focus === 'function' ) {
			h.returnTo.focus();
		}
		handlers.delete( modal );
	}
	document.dispatchEvent(
		new CustomEvent( 'awt:panel-state', {
			detail: { id: modal.id, open: false },
		} )
	);
}

store( 'awt/modal', {
	callbacks: {
		init() {
			const modal = getElement().ref;
			modal.setAttribute( 'aria-hidden', 'true' );
			document.addEventListener( 'awt:toggle-panel', ( e ) => {
				if ( ! e.detail || e.detail.id !== modal.id ) {
					return;
				}
				if ( modal.classList.contains( 'is-visible' ) ) {
					close( modal );
				} else {
					open( modal, e.detail.source || null );
					document.dispatchEvent(
						new CustomEvent( 'awt:panel-state', {
							detail: { id: modal.id, open: true },
						} )
					);
				}
			} );
		},
	},
	actions: {
		close() {
			close( getElement().ref.closest( '.cds--modal' ) );
		},
		backdropClick( event ) {
			if ( event.target === getElement().ref ) {
				close( getElement().ref );
			}
		},
	},
} );
