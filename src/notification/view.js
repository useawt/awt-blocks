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
import { nextFocus } from '../shared/next-focus';

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
