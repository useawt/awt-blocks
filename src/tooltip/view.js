/**
 * AWT Tooltip — view-side Interactivity store.
 *
 * Hover: show after enterDelayMs, hide after leaveDelayMs.
 * Focus: show immediately, hide on blur immediately.
 * Tap, Enter or Space: toggle. A mouse click only keeps it open, since hover
 * has already shown it.
 * Escape: hide when focused.
 *
 * Positioning runs through the shared floating-ui helper so the tooltip flips
 * + shifts at viewport edges — fixing the Stage 0 clipping limitation. The
 * helper engages lazily (only while the tooltip is open) so closed tooltips
 * don't carry the autoUpdate listener cost.
 */

import { store, getContext, getElement } from '@wordpress/interactivity';
import { attach } from '../shared/floating-ui';

// Per-trigger floating handle. Lives outside Interactivity reactive state
// because @floating-ui/dom's handle is non-serializable.
const handles = new WeakMap();

function resolveTooltipEl( triggerEl ) {
	return triggerEl.nextElementSibling;
}

function resolvePlacement( triggerEl ) {
	const wrapper = triggerEl.closest( '.cds--tooltip' );
	if ( ! wrapper ) {
		return 'top';
	}
	for ( const cls of wrapper.classList ) {
		if ( cls.startsWith( 'cds--tooltip--' ) ) {
			const slug = cls.replace( 'cds--tooltip--', '' );
			// Carbon's CSS slugs (top, top-start, top-end, etc.) are already
			// valid floating-ui placement strings.
			return slug;
		}
	}
	return 'top';
}

function isOpen( triggerEl ) {
	const tooltipEl = resolveTooltipEl( triggerEl );
	return !! tooltipEl && ! tooltipEl.hidden;
}

function clearTimers( ctx ) {
	clearTimeout( ctx._showTimer );
	clearTimeout( ctx._hideTimer );
	ctx._showTimer = null;
	ctx._hideTimer = null;
}

function open( triggerEl ) {
	const tooltipEl = resolveTooltipEl( triggerEl );
	if ( ! tooltipEl ) {
		return;
	}
	tooltipEl.removeAttribute( 'hidden' );
	triggerEl.setAttribute( 'aria-expanded', 'true' );
	if ( handles.has( triggerEl ) ) {
		return;
	}
	const handle = attach( triggerEl, tooltipEl, {
		placement: resolvePlacement( triggerEl ),
		offsetPx: 8,
	} );
	handles.set( triggerEl, handle );
}

function close( triggerEl ) {
	const tooltipEl = resolveTooltipEl( triggerEl );
	if ( tooltipEl ) {
		tooltipEl.setAttribute( 'hidden', '' );
	}
	triggerEl.setAttribute( 'aria-expanded', 'false' );
	const handle = handles.get( triggerEl );
	if ( handle ) {
		handle.dispose();
		handles.delete( triggerEl );
	}
}

store( 'awt/tooltip', {
	callbacks: {
		// "Open by default": position + reveal on hydration via floating-ui so the
		// tooltip lands in the right place with its caret, instead of rendering
		// unpositioned (the front-end has no CSS placement — floating-ui owns it).
		init() {
			const ctx = getContext();
			if ( ctx.open ) {
				open( getElement().ref );
			}
		},
	},
	actions: {
		scheduleShow() {
			const ctx = getContext();
			const trigger = getElement().ref;
			if ( ctx._hideTimer ) {
				clearTimeout( ctx._hideTimer );
				ctx._hideTimer = null;
			}
			ctx._showTimer = setTimeout( () => {
				open( trigger );
				ctx._showTimer = null;
			}, ctx.enterDelayMs ?? 100 );
		},
		scheduleHide() {
			const ctx = getContext();
			const trigger = getElement().ref;
			if ( ctx._showTimer ) {
				clearTimeout( ctx._showTimer );
				ctx._showTimer = null;
			}
			ctx._hideTimer = setTimeout( () => {
				close( trigger );
				ctx._hideTimer = null;
			}, ctx.leaveDelayMs ?? 300 );
		},
		showNow() {
			const ctx = getContext();
			const trigger = getElement().ref;
			if ( ctx._hideTimer ) {
				clearTimeout( ctx._hideTimer );
				ctx._hideTimer = null;
			}
			open( trigger );
		},
		hideNow() {
			const ctx = getContext();
			const trigger = getElement().ref;
			if ( ctx._showTimer ) {
				clearTimeout( ctx._showTimer );
				ctx._showTimer = null;
			}
			close( trigger );
		},
		keydown( event ) {
			if ( event.key === 'Escape' ) {
				close( getElement().ref );
			}
		},
		// A tap or click can focus the button before its click arrives, and
		// focus opens the tooltip, so the toggle reads the state from here.
		press( event ) {
			const ctx = getContext();
			ctx._press = {
				pointer: event.pointerType,
				wasOpen: isOpen( getElement().ref ),
			};
		},
		toggle( event ) {
			const ctx = getContext();
			const trigger = getElement().ref;
			// Enter and Space click with no pointer press (detail 0).
			const press = event.detail ? ctx._press : null;
			ctx._press = null;
			clearTimers( ctx );
			if ( press?.pointer === 'mouse' ) {
				open( trigger );
				return;
			}
			const wasOpen = press ? press.wasOpen : isOpen( trigger );
			if ( wasOpen ) {
				close( trigger );
			} else {
				open( trigger );
			}
		},
	},
} );
