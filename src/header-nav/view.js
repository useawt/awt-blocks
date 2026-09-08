/**
 * AWT Header navigation — view-side store.
 *
 * Two responsibilities:
 *
 *   1. Mobile drawer. Below Carbon's `lg` breakpoint (66rem) the bundled
 *      Carbon CSS hides `.cds--header__nav` and shows the hamburger
 *      (`.cds--header__menu-trigger`). `toggleNav` flips the shared
 *      `state.navOpen`, which adds `.awt-nav-open` to the <nav> + backdrop →
 *      theme.css turns the nav into a left slide-in panel. Escape closes it
 *      and restores focus to the trigger.
 *
 *      `navOpen` is shared store STATE (not element context) so the hamburger
 *      trigger can be relocated before the brand (see `relocateTrigger`) and
 *      still control the nav from a different part of the DOM.
 *
 *   2. Multi-level menus (awt/header-menu). Each submenu <li> provides its own
 *      `submenuOpen` CONTEXT. Toggling it flips `aria-expanded` on the title;
 *      Carbon's adjacency rule reveals the submenu (desktop dropdown) and the
 *      drawer CSS makes it an inline accordion on mobile. Closes on outside
 *      click, on Escape, and via keyboard (Enter / Space) on the title.
 *
 * `relocateTrigger` moves the hamburger to sit right after the skip-link
 * (before the brand) so keyboard focus reaches it before the logo on mobile
 * (WCAG 2.4.3) — mirroring Carbon's DOM order. The trigger is its own
 * Interactivity region, so moving the node doesn't disturb the nav region.
 *
 * Actions that read the event synchronously or call event.preventDefault()
 * are wrapped in `withSyncEvent()` (required by the Interactivity API).
 */

import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

const SPACE_KEYS = [ ' ', 'Spacebar', 'Space' ];

/**
 * Collapse the header when the menu does not fit, rather than at a width.
 *
 * How wide the row needs to be depends on how many items the menu has and how
 * long their labels are, which no breakpoint can know. Carbon's is 66rem — the
 * width its own short menu needs — and a nine-item menu overflowed it, wrapping
 * the last item and pushing the sign-in button off the edge of the screen.
 *
 * The menu bar never wraps (theme.css), so an overflowing header is a real
 * overflow and can be measured. The class goes on <html> because the drawer,
 * its backdrop and the header itself all react to it.
 */
const COLLAPSED = 'awt-header-collapsed';

// Worn only while the header is being measured. theme.css turns off every
// transition in the header underneath it — see the note there.
const MEASURING = 'awt-header-measuring';

function fitHeader() {
	const header = document.querySelector( '.cds--header' );
	if ( ! header ) {
		return;
	}
	const root = document.documentElement;

	// Measure in the row state, whatever the current state is. Reading a
	// layout property forces the browser to resolve it now, and nothing is
	// painted in between, so this does not flicker.
	//
	// Every call measures, including the height-only resizes a phone fires
	// while the URL bar hides. Skipping those was tried and reverted: width is
	// not the only input — a menu that gains an item has to collapse at the
	// same window size — and measuring rather than assuming a width is the
	// whole point of this header.
	const wasCollapsed = root.classList.contains( COLLAPSED );
	root.classList.add( MEASURING );
	root.classList.remove( COLLAPSED );

	// Measure as a scroll container. On a box that overflows visibly,
	// `scrollWidth` counts only content that escapes the PADDING box — so a
	// header contained to the content width (AWT Settings → Appearance →
	// Header) reported no overflow at all while its menu spilled into the
	// gutter it was supposed to stay out of. Under `overflow: hidden` the
	// padding is part of the scroll area and the row is measured against the
	// width it actually has. Set and undone between two layout reads, so
	// nothing paints in between.
	const previousOverflow = header.style.overflow;
	header.style.overflow = 'hidden';
	const overflows = header.scrollWidth > header.clientWidth + 1;
	header.style.overflow = previousOverflow;

	root.classList.toggle( COLLAPSED, overflows );

	// Settle the header back into its real state while transitions are still
	// suppressed. Without this read the browser never sees that state on its
	// own: it would go straight from the measured one to a header whose
	// transitions are back on, and animate the difference — which is the
	// drawer sliding out, on every scroll of the page.
	void header.offsetWidth;
	root.classList.remove( MEASURING );

	// A drawer left open while the header goes back to a row would strand the
	// panel on screen with nothing to close it.
	if ( wasCollapsed && ! overflows && state.navOpen ) {
		state.navOpen = false;
	}
}

let fitQueued = false;
function scheduleFit() {
	if ( fitQueued ) {
		return;
	}
	fitQueued = true;
	requestAnimationFrame( () => {
		fitQueued = false;
		fitHeader();
	} );
}

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Visible (rendered) focusable items inside the open drawer — excludes links
// in collapsed submenus (display:none).
const isVisible = ( el ) =>
	!! ( el.offsetWidth || el.offsetHeight || el.getClientRects().length );
const menuItems = ( nav ) =>
	[ ...nav.querySelectorAll( FOCUSABLE ) ].filter( isVisible );
const triggerOf = ( el ) =>
	el?.closest( '.cds--header' )?.querySelector( '.awt-header-nav__trigger' );

// Move focus to the first focusable element in the main content (or the main
// landmark itself). Used when Tab leaves the bottom of the open menu.
const focusMain = ( doc ) => {
	const main = doc.querySelector(
		'main, [role="main"], #main-content, .cds--content'
	);
	if ( ! main ) {
		return;
	}
	const first = [ ...main.querySelectorAll( FOCUSABLE ) ].find( isVisible );
	if ( first ) {
		first.focus();
		return;
	}
	if ( ! main.hasAttribute( 'tabindex' ) ) {
		main.setAttribute( 'tabindex', '-1' );
	}
	main.focus();
};

const { state } = store( 'awt/header-nav', {
	state: {
		navOpen: false,
		// `labelOpen` / `labelClose` are seeded server-side (translated).
		get navClosed() {
			return ! state.navOpen;
		},
		get triggerLabel() {
			return state.navOpen ? state.labelClose : state.labelOpen;
		},
	},
	actions: {
		toggleNav() {
			state.navOpen = ! state.navOpen;
		},
		closeNav() {
			state.navOpen = false;
		},
		onWindowKey: withSyncEvent( ( event ) => {
			if ( event.key !== 'Escape' || ! state.navOpen ) {
				return;
			}
			// focusManage returns focus to the trigger once navOpen flips false.
			state.navOpen = false;
		} ),
		// Focus is NOT moved on open — it stays on the trigger. Pressing Tab
		// then routes INTO the open menu (instead of the brand that follows the
		// trigger in the DOM). Shift+Tab from the trigger is left to default
		// (→ skip-link), so the reverse path is natural.
		onTriggerKey: withSyncEvent( ( event ) => {
			if ( event.key !== 'Tab' || event.shiftKey || ! state.navOpen ) {
				return;
			}
			const nav = getElement()
				.ref?.closest( '.cds--header' )
				?.querySelector( '.cds--header__nav' );
			const items = nav ? menuItems( nav ) : [];
			if ( ! items.length ) {
				return;
			}
			event.preventDefault();
			items[ 0 ].focus();
		} ),
		onMenuKey: withSyncEvent( ( event ) => {
			if ( event.key !== 'Tab' || ! state.navOpen ) {
				return;
			}
			const nav = getElement().ref;
			const items = menuItems( nav );
			if ( ! items.length ) {
				return;
			}
			const active = nav.ownerDocument.activeElement;
			if ( event.shiftKey && active === items[ 0 ] ) {
				// Shift+Tab off the first item → back to the trigger.
				event.preventDefault();
				triggerOf( nav )?.focus();
			} else if (
				! event.shiftKey &&
				active === items[ items.length - 1 ]
			) {
				// Tab off the last item → close the menu and move focus to the
				// first focusable element in the main content (Carbon behavior).
				event.preventDefault();
				const doc = nav.ownerDocument;
				state.navOpen = false;
				focusMain( doc );
			}
		} ),

		toggleSubmenu: withSyncEvent( ( event ) => {
			event.preventDefault();
			const ctx = getContext();
			ctx.submenuOpen = ! ctx.submenuOpen;
		} ),
		onSubmenuKey: withSyncEvent( ( event ) => {
			if ( event.key === 'Enter' || SPACE_KEYS.includes( event.key ) ) {
				event.preventDefault();
				const ctx = getContext();
				ctx.submenuOpen = ! ctx.submenuOpen;
			} else if ( event.key === 'Escape' ) {
				getContext().submenuOpen = false;
			}
		} ),
		onSubmenuOutside: withSyncEvent( ( event ) => {
			const ctx = getContext();
			if ( ! ctx.submenuOpen ) {
				return;
			}
			const li = getElement().ref;
			if ( li && ! li.contains( event.target ) ) {
				ctx.submenuOpen = false;
			}
		} ),
		// Close the open desktop dropdown when keyboard focus leaves the
		// submenu entirely — Tab off the last item, or Shift+Tab off the title
		// (Carbon's HeaderMenu closes as focus moves to an element outside it).
		// Scoped to the desktop layout; on mobile the submenu is an inline
		// accordion inside the drawer, which manages its own focus.
		onSubmenuFocusOut: withSyncEvent( ( event ) => {
			const ctx = getContext();
			if ( ! ctx.submenuOpen ) {
				return;
			}
			const li = getElement().ref;
			if ( ! li ) {
				return;
			}
			// Mobile drawer (below Carbon's lg breakpoint) keeps its accordion
			// behavior — don't auto-close there.
			if (
				! li.ownerDocument.defaultView.matchMedia(
					'(min-width: 66rem)'
				).matches
			) {
				return;
			}
			// `relatedTarget` is the element receiving focus. Null = focus left
			// the document/window. Either way, if it's not inside this submenu,
			// the dropdown should close.
			const next = event.relatedTarget;
			if ( ! next || ! li.contains( next ) ) {
				ctx.submenuOpen = false;
			}
		} ),
		onSubmenuWindowKey: withSyncEvent( ( event ) => {
			if ( event.key !== 'Escape' ) {
				return;
			}
			const ctx = getContext();
			if ( ! ctx.submenuOpen ) {
				return;
			}
			ctx.submenuOpen = false;
			getElement()
				.ref?.querySelector( '.cds--header__menu-title' )
				?.focus();
		} ),
	},
	callbacks: {
		// Focus management for the mobile drawer (Carbon parity):
		//  - On open, move focus to the first focusable item inside the menu.
		//  - On close, if focus is still inside the menu, return it to the
		//    trigger. Runs on init + whenever navOpen changes.
		focusManage() {
			// Focus stays on the trigger when the drawer OPENS (Carbon
			// behavior) — Tab moves into the menu, see onTriggerKey. On CLOSE,
			// if focus is still inside the menu, return it to the trigger.
			const nav = getElement().ref;
			if ( ! nav || state.navOpen ) {
				return;
			}
			if ( nav.contains( nav.ownerDocument.activeElement ) ) {
				triggerOf( nav )?.focus();
			}
		},
		// Move the hamburger to just after the skip-link (before the brand) so
		// it's reached first by keyboard on mobile. Runs once on init.
		// Decide the header's shape on load, and again whenever the space or
		// the text in it changes. Fonts matter: a menu measured before the
		// webfont arrives is measured at the wrong width.
		fitHeader() {
			scheduleFit();
			window.addEventListener( 'resize', scheduleFit );
			if ( document.fonts && document.fonts.ready ) {
				document.fonts.ready.then( scheduleFit );
			}
		},

		relocateTrigger() {
			const el = getElement().ref;
			const header = el?.closest( '.cds--header' );
			if ( ! header ) {
				return;
			}
			const skip = header.querySelector(
				'.cds--skip-to-content, .awt-skip-link, a[class*="skip"]'
			);
			const anchor =
				skip && skip.parentElement === header
					? skip.nextSibling
					: header.firstChild;
			if ( el !== anchor && el.nextSibling !== anchor ) {
				header.insertBefore( el, anchor );
			}
		},
	},
} );
