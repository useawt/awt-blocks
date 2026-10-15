/**
 * AWT Code snippet — view-side store.
 *
 * Click the copy button → write the snippet text to the clipboard via the
 * async navigator.clipboard API. On success, swap the button label to the
 * "copied" string for ~1.5s and back. Falls back to a hidden textarea
 * select+execCommand("copy") path when navigator.clipboard isn't available
 * (older Safari, non-HTTPS dev pages).
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
			const ctx = getContext();
			copyText( text ).then( () => {
				const original =
					btn.getAttribute( 'aria-label' ) || ctx.copyLabel;
				btn.setAttribute( 'aria-label', ctx.copiedLabel );
				btn.classList.add( 'cds--snippet-button--copied' );
				setTimeout( () => {
					btn.setAttribute( 'aria-label', original );
					btn.classList.remove( 'cds--snippet-button--copied' );
				}, 1500 );
			} );
		},
	},
} );
