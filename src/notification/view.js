/**
 * AWT Notification — Interactivity API view-side store.
 *
 * Wires the close button. Matches Carbon's reference dismiss behavior
 * (verified against the React Storybook): a dismissed notification leaves
 * the accessibility tree entirely, and Carbon does no focus management —
 * focus falls back to the page. We hide via a reactive `hidden` binding on
 * the root (theme.css gives `[hidden]` display:none precedence over the
 * component's display:flex) instead of removing the node, keeping the
 * Interactivity API in charge of the DOM.
 */

import { store, getContext } from '@wordpress/interactivity';

store( 'awt/notification', {
	actions: {
		dismiss( event ) {
			getContext().dismissed = true;
			// Hiding the notification can leave focus on its (now
			// display:none) close button until the browser's focus fixup
			// runs — blur deterministically so focus lands on the page,
			// the same place Carbon's unmount leaves it.
			event?.currentTarget?.blur();
		},
	},
} );
