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
 *     reader cannot read it either (see `makeRestInert`).
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
