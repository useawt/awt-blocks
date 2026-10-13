/**
 * AWT Notification — Interactivity API view-side store.
 *
 * Wires the close button. A dismissed notification leaves the accessibility
 * tree entirely, as in Carbon (verified against the React Storybook). We hide
 * via a reactive `hidden` binding on the root (theme.css gives `[hidden]`
 * display:none precedence over the component's display:flex) instead of
 * removing the node, keeping the Interactivity API in charge of the DOM.
 *
 * Focus is where we depart from Carbon, which does nothing: hiding the
 * notification took the close button, and focus with it, so focus fell to
 * the page. Chrome happens to continue Tab from about the right place;
 * Safari went back to the top of the page, and screen readers lost their
 * place in every browser (reported by the outside accessibility review,
 * 2026-10-13). Focus now moves to the next control after the notification,
 * or, with none, to the region around it.
 */

import { store, getContext } from '@wordpress/interactivity';

const FOCUSABLE = [
	'a[href]',
	'area[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'summary',
	'iframe',
	'audio[controls]',
	'video[controls]',
	'[contenteditable="true"]',
	'[tabindex]',
].join( ',' );

function canTakeFocus( el ) {
	return (
		el.tabIndex >= 0 &&
		! el.closest( '[hidden], [inert]' ) &&
		el.getClientRects().length > 0 &&
		getComputedStyle( el ).visibility !== 'hidden'
	);
}

/**
 * Where focus goes when a notification closes.
 *
 * @param {HTMLElement} note The notification being dismissed.
 * @return {HTMLElement|null} The next control after it, or the region
 *                            around it.
 */
function nextFocus( note ) {
	const doc = note.ownerDocument;
	const next = Array.from( doc.querySelectorAll( FOCUSABLE ) ).find(
		( el ) =>
			! note.contains( el ) &&
			// eslint-disable-next-line no-bitwise
			note.compareDocumentPosition( el ) &
				doc.defaultView.Node.DOCUMENT_POSITION_FOLLOWING &&
			canTakeFocus( el )
	);
	if ( next ) {
		return next;
	}
	const region =
		note.parentElement?.closest( 'section, main, [role="main"]' ) ||
		doc.querySelector( 'main' );
	if ( region && ! region.hasAttribute( 'tabindex' ) ) {
		region.setAttribute( 'tabindex', '-1' );
	}
	return region;
}

store( 'awt/notification', {
	actions: {
		dismiss( event ) {
			const button = event?.currentTarget;
			const note = button?.closest(
				'[data-wp-interactive="awt/notification"]'
			);
			// Found before hiding: a hidden notification has no layout,
			// and nothing inside it can be measured.
			const target = note ? nextFocus( note ) : null;
			getContext().dismissed = true;
			if ( target ) {
				target.focus();
			} else {
				button?.blur();
			}
		},
	},
} );
