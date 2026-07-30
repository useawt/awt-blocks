/**
 * AWT Side nav — view-side store.
 *
 * One job: keep the side nav's links reachable on a narrow screen.
 *
 * A persistent side nav is a 16rem fixed panel. Below Carbon's `lg` breakpoint
 * (66rem) there is no room for it, so theme.css hides it outright — see the
 * comment there for why `display: none` beats Carbon's own `inline-size: 0`
 * (0-width plus `overflow: hidden` leaves the links focusable and invisible, a
 * WCAG 2.4.7 failure). Hiding it, though, is only half an answer: the links go
 * with it, and on the Documentation preset those links are the site's docs
 * pages. Carbon's guidance is that a persistent side nav collapses into the
 * header's menu button on small screens, so that is what this does — below the
 * breakpoint the nav's `<nav>` element moves into the header's slide-out menu,
 * and moves back when the viewport gets wide enough for the docked panel again.
 *
 * Why move the node rather than mirror Carbon's DOM: Carbon's React UI Shell
 * makes the SIDE NAV the small-screen panel and folds the header's items into it
 * (`HeaderSideNavItems`). Reaching that arrangement here would mean replacing
 * the header drawer `awt/header-nav` already ships — its backdrop, Escape
 * handling, Tab loop and focus restoration — and running two different
 * small-screen mechanisms depending on whether a side nav happens to be present.
 * Moving into the existing drawer keeps one mechanism and inherits all of that
 * behavior for free: `awt/header-nav`'s keyboard handling queries
 * `.cds--header__nav` for focusable children, so the folded-in links join the
 * Tab loop with no extra code. The side nav's own CSS comes along unchanged —
 * Carbon's `__link` / `__item` / `__menu` rules are not scoped to
 * `.cds--side-nav`, so the links look the same inside the drawer.
 *
 * The moved element is the whole `<nav aria-label="…">`, not the bare list, so
 * the links keep their own accessible name instead of being absorbed into the
 * primary navigation's. Two named navigation landmarks nest, which is what a
 * screen-reader user wants here: "Primary" and "Side navigation" both stay in
 * the landmarks list.
 *
 * Limitation, deliberate: if the page's header has no `awt/header-nav` there is
 * no menu button and no panel to fold into, and the links stay unreachable below
 * the breakpoint. All four shipped header presets pair the two.
 */

import { store, getElement } from '@wordpress/interactivity';

// Carbon's `lg` breakpoint, expressed the way Carbon's own compiled media
// queries do (`max-width: 65.98rem`), so the JS flips on exactly the same edge
// the CSS does. Off-by-one here would either double up the nav or drop it.
const NARROW = '(max-width: 65.98rem)';

store( 'awt/side-nav', {
	callbacks: {
		foldIntoHeaderMenu() {
			const aside = getElement().ref;
			if ( ! aside ) {
				return;
			}
			const nav = aside.querySelector( '.cds--side-nav__navigation' );
			const header = aside.closest( '.cds--header' );
			const drawer = header?.querySelector( '.cds--header__nav' );
			if ( ! nav || ! drawer ) {
				return;
			}

			const mq = aside.ownerDocument.defaultView.matchMedia( NARROW );
			const sync = () => {
				if ( mq.matches ) {
					if ( nav.parentElement !== drawer ) {
						nav.classList.add( 'awt-side-nav--in-header-menu' );
						drawer.append( nav );
					}
				} else if ( nav.parentElement !== aside ) {
					nav.classList.remove( 'awt-side-nav--in-header-menu' );
					aside.append( nav );
				}
			};

			sync();
			mq.addEventListener( 'change', sync );
		},
	},
} );
