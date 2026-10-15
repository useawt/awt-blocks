/**
 * Where focus goes when a control hides the thing it sits in.
 *
 * Closing a notification or dismissing a filter tag hides the button that
 * had focus, and focus fell to the page: Safari went back to the top and
 * screen readers lost their place (reported by the outside accessibility
 * review, 2026-10-13). Both now move focus to the next control after the
 * hidden element, or, with none, to the region around it.
 */

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
 * Where focus goes when an element is hidden.
 *
 * @param {HTMLElement} gone The element about to be hidden.
 * @return {HTMLElement|null} The next control after it, or the region
 *                            around it.
 */
export function nextFocus( gone ) {
	const doc = gone.ownerDocument;
	const next = Array.from( doc.querySelectorAll( FOCUSABLE ) ).find(
		( el ) =>
			! gone.contains( el ) &&
			// eslint-disable-next-line no-bitwise
			gone.compareDocumentPosition( el ) &
				doc.defaultView.Node.DOCUMENT_POSITION_FOLLOWING &&
			canTakeFocus( el )
	);
	if ( next ) {
		return next;
	}
	const region =
		gone.parentElement?.closest( 'section, main, [role="main"]' ) ||
		doc.querySelector( 'main' );
	if ( region && ! region.hasAttribute( 'tabindex' ) ) {
		region.setAttribute( 'tabindex', '-1' );
	}
	return region;
}
