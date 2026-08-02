/**
 * Color-scheme toggle — view-side store.
 *
 * Cooperates with the inline pre-paint script in the theme that runs before
 * first paint to resolve the active scheme. This view-side store handles
 * runtime user-initiated changes (click handlers, polite announce, cookie
 * write).
 */

import { store, getElement, getContext } from '@wordpress/interactivity';

const COOKIE_NAME = 'awt_color_scheme';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const REGION_ID = 'awt-color-scheme-announcer';
const BUTTON_SEL =
	'.awt-color-scheme-toggle--icon-only, .awt-color-scheme-toggle--with-label';
const GROUP_SEL = '.awt-color-scheme-toggle--segmented';

function writeCookie( value ) {
	const secure = window.location.protocol === 'https:' ? '; Secure' : '';
	document.cookie = `${ COOKIE_NAME }=${ value }; Path=/; Max-Age=${ COOKIE_MAX_AGE }; SameSite=Lax${ secure }`;
}

function readCookie() {
	const m = document.cookie.match(
		/(?:^|; )awt_color_scheme=(light|dark|auto)/
	);
	return m ? m[ 1 ] : '';
}

function activeScheme() {
	return document.documentElement.dataset.awtColorScheme === 'dark'
		? 'dark'
		: 'light';
}

function applyScheme( scheme ) {
	const variants = window.AWT_THEME_SCOPES || {
		light: 'white',
		dark: 'g100',
	};
	const root = document.documentElement;
	const body = document.body;

	root.dataset.awtColorScheme = scheme;

	// Remove all cds--<variant> scope classes and apply the active one.
	[ 'white', 'g10', 'g90', 'g100' ].forEach( ( v ) =>
		body.classList.remove( `cds--${ v }` )
	);
	const variant = scheme === 'dark' ? variants.dark : variants.light;
	body.classList.add( `cds--${ variant }` );
}

/**
 * render.php prints the region — empty — into the footer of every page that
 * has a toggle. This only builds one when the block is rendered by something
 * that skipped that, and deliberately builds it EMPTY: a region that enters the
 * accessibility tree with its message already in it is read as pre-existing
 * content, not as an update, and goes unannounced.
 *
 * @return {HTMLElement} The live region.
 */
function ensureRegion() {
	let region = document.getElementById( REGION_ID );
	if ( region ) {
		return region;
	}
	region = document.createElement( 'div' );
	region.id = REGION_ID;
	region.setAttribute( 'role', 'status' );
	region.setAttribute( 'aria-live', 'polite' );
	region.style.cssText =
		'position:absolute;inline-size:1px;block-size:1px;margin:-1px;padding:0;' +
		'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0';
	document.body.appendChild( region );
	return region;
}

/**
 * Announce a scheme change politely.
 *
 * Clear, then write on a later task. Screen readers announce a *change* to the
 * text, so writing the same string twice — re-selecting the option you are
 * already on — would otherwise be silent, and a region created moments earlier
 * needs a beat to be picked up.
 *
 * @param {string} message Text to announce.
 */
function announce( message ) {
	const region = ensureRegion();
	region.textContent = '';
	window.setTimeout( () => {
		region.textContent = message;
	}, 100 );
}

function syncButton( button, scheme ) {
	const isDark = scheme === 'dark';
	button.setAttribute( 'aria-pressed', isDark ? 'true' : 'false' );
	const sun = button.querySelector( '.awt-color-scheme-toggle__icon--sun' );
	const moon = button.querySelector( '.awt-color-scheme-toggle__icon--moon' );
	if ( sun ) {
		sun.hidden = isDark;
	}
	if ( moon ) {
		moon.hidden = ! isDark;
	}
}

function syncGroup( group, selected ) {
	group.querySelectorAll( '[data-awt-scheme]' ).forEach( ( b ) => {
		b.setAttribute(
			'aria-pressed',
			b.dataset.awtScheme === selected ? 'true' : 'false'
		);
	} );
}

/**
 * Bring every toggle on the page into line, not just the one that was clicked:
 * a header toggle and a footer toggle must not disagree about the state they
 * both report.
 *
 * @param {string} scheme   Resolved scheme, 'light' or 'dark'.
 * @param {string} selected Stored preference, 'light' | 'dark' | 'auto'.
 */
function syncAll( scheme, selected ) {
	document
		.querySelectorAll( BUTTON_SEL )
		.forEach( ( b ) => syncButton( b, scheme ) );
	document
		.querySelectorAll( GROUP_SEL )
		.forEach( ( g ) => syncGroup( g, selected ) );
}

function choose( scheme, ctx ) {
	applyScheme( scheme );
	writeCookie( scheme );
	syncAll( scheme, scheme );
	announce( scheme === 'dark' ? ctx.announceDark : ctx.announceLight );
}

store( 'awt/color-scheme-toggle', {
	actions: {
		toggle() {
			choose(
				activeScheme() === 'dark' ? 'light' : 'dark',
				getContext()
			);
		},
		setLight() {
			choose( 'light', getContext() );
		},
		setDark() {
			choose( 'dark', getContext() );
		},
		setAuto() {
			const ctx = getContext();
			writeCookie( 'auto' );
			const scheme = window.matchMedia( '(prefers-color-scheme: dark)' )
				.matches
				? 'dark'
				: 'light';
			applyScheme( scheme );
			syncAll( scheme, 'auto' );
			// Two sentences: which mode the site is following, and which one
			// that resolved to right now. Either alone leaves the question open.
			announce(
				`${ ctx.announceAuto } ${
					scheme === 'dark' ? ctx.announceDark : ctx.announceLight
				}`
			);
		},
	},
	callbacks: {
		init() {
			syncButton( getElement().ref, activeScheme() );
		},
		initGroup() {
			// The live cookie wins, so a choice made in another tab — or after
			// a page cache served this HTML — is reflected. `selected` is the
			// server's answer for a visitor who has never chosen.
			syncGroup(
				getElement().ref,
				readCookie() || getContext().selected
			);
		},
	},
} );
