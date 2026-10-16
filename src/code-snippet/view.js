/**
 * AWT Code snippet — view-side store.
 *
 * Click the copy button → write the snippet text to the clipboard via the
 * async navigator.clipboard API. On success, open Carbon's tooltip beside the
 * button with the "Copied" text and put the same text in the snippet's status
 * message, for 2s (Carbon's feedback timeout). The button keeps its name: it
 * used to swap it to "Copied", which most screen readers do not announce on
 * the button you are on, and nothing showed on screen but a colour (reported
 * by the outside accessibility review, 2026-10-15). Falls back to a hidden
 * textarea select+execCommand("copy") path when navigator.clipboard isn't
 * available (older Safari, non-HTTPS dev pages).
 *
 * It also keeps the snippet's scrolling box a tab stop only while the code
 * overflows. The box arrives with `tabindex="0"`; while the code fits, the
 * stop is taken away, since there is nothing to scroll (reported by the
 * outside accessibility review, 2026-10-15). While it is a stop it is a
 * region named "Code snippet", unless the author named it in the
 * Accessibility panel; a role or name the author set is never touched. The
 * check runs again whenever the box changes size: a narrow screen, zoom, or a
 * font that loads late.
 */

import { store, getElement, getContext } from '@wordpress/interactivity';

// The pending close of each button's confirmation, so a second copy
// restarts it.
const timers = new WeakMap();

function scrolls( box ) {
	return (
		box.scrollWidth > box.clientWidth + 1 ||
		box.scrollHeight > box.clientHeight + 1
	);
}

function copyText( text ) {
	if ( navigator && navigator.clipboard && navigator.clipboard.writeText ) {
		return navigator.clipboard.writeText( text );
	}
	return new Promise( ( resolve, reject ) => {
		try {
			const ta = document.createElement( 'textarea' );
			ta.value = text;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild( ta );
			ta.select();
			const ok = document.execCommand( 'copy' );
			document.body.removeChild( ta );
			if ( ok ) {
				resolve();
			} else {
				reject( new Error( 'execCommand failed' ) );
			}
		} catch ( e ) {
			reject( e );
		}
	} );
}

store( 'awt/code-snippet', {
	callbacks: {
		watchScroll() {
			const root = getElement().ref;
			const box = root.querySelector( '[tabindex="0"]' );
			if ( ! box ) {
				return;
			}
			const { regionLabel } = getContext();
			const ownRole = ! box.hasAttribute( 'role' );
			const ownName =
				! box.hasAttribute( 'aria-label' ) &&
				! box.hasAttribute( 'aria-labelledby' );
			const update = () => {
				if ( scrolls( box ) ) {
					box.setAttribute( 'tabindex', '0' );
					if ( ownRole ) {
						box.setAttribute( 'role', 'region' );
					}
					if ( ownName ) {
						box.setAttribute( 'aria-label', regionLabel );
					}
				} else {
					box.removeAttribute( 'tabindex' );
					if ( ownRole ) {
						box.removeAttribute( 'role' );
					}
					if ( ownName ) {
						box.removeAttribute( 'aria-label' );
					}
				}
			};
			update();
			const view = box.ownerDocument.defaultView;
			if ( view.ResizeObserver ) {
				new view.ResizeObserver( update ).observe( box );
			}
			box.ownerDocument.fonts?.ready.then( update );
		},
	},
	actions: {
		copy() {
			const btn = getElement().ref;
			const root = btn.closest( '.cds--snippet' );
			if ( ! root ) {
				return;
			}
			const codeEl = root.querySelector( 'code' );
			const text = codeEl ? codeEl.textContent : '';
			const { copiedLabel } = getContext();
			const tip = btn.closest( '.awt-snippet-copy' );
			const status = root.querySelector( '[role="status"]' );
			copyText( text ).then( () => {
				btn.classList.add( 'cds--snippet-button--copied' );
				tip?.classList.add( 'cds--popover--open' );
				if ( status ) {
					// Emptied first, so a second copy is announced again.
					status.textContent = '';
					requestAnimationFrame( () => {
						status.textContent = copiedLabel;
					} );
				}
				clearTimeout( timers.get( btn ) );
				timers.set(
					btn,
					setTimeout( () => {
						btn.classList.remove( 'cds--snippet-button--copied' );
						tip?.classList.remove( 'cds--popover--open' );
						if ( status ) {
							status.textContent = '';
						}
					}, 2000 )
				);
			} );
		},
	},
} );
