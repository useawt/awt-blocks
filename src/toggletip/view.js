/**
 * AWT Toggletip — view-side store.
 *
 * Carbon's click-not-hover tooltip variant: a small info button that opens an
 * anchored popover on click. Unlike the hover-driven Tooltip, the Toggletip's
 * content can include links and longer copy because the visitor controls
 * dismissal explicitly.
 *
 * Positioning is pure CSS: the popover container carries Carbon's
 * `cds--popover--<align>` class and open state is the
 * `cds--toggletip--open cds--popover--open` class pair — exactly how Carbon's
 * own (non-autoAlign) Toggletip works. Because Carbon's CSS placement has no
 * viewport awareness, opening also runs a collision check: if the author's
 * alignment would push the popover off-screen, the nearest Carbon alignment
 * class that fits is swapped in (still classes only — no inline styles — so
 * the caret keeps tracking the trigger through Carbon's own rules).
 *
 * Dismissal goes through installOutsideDismiss so click-outside, Escape, and
 * Tab-out all close cleanly; Escape returns focus to the trigger.
 */

import { store, getElement } from '@wordpress/interactivity';
import { installOutsideDismiss } from '../shared/floating-ui';

const OPEN_CLASSES = [ 'cds--toggletip--open', 'cds--popover--open' ];

// Trigger-to-popover gap (Carbon's --cds-popover-offset for toggletips) and
// the viewport padding to keep clear, matching the old shift() padding.
const GAP = 13;
const VIEW_PAD = 8;

const dismissers = new WeakMap();
const authorAligns = new WeakMap();

function getParts( ref ) {
	const root = ref.closest( '.cds--toggletip' );
	if ( ! root ) {
		return null;
	}
	const trigger = root.querySelector( '.cds--toggletip-button' );
	const content = root.querySelector( '.cds--popover-content' );
	return trigger && content ? { root, trigger, content } : null;
}

function parseAlign( root ) {
	for ( const c of root.classList ) {
		const m = c.match(
			/^cds--popover--(top|bottom|left|right)(-start|-end)?$/
		);
		if ( m ) {
			return m[ 1 ] + ( m[ 2 ] || '' );
		}
	}
	return 'bottom';
}

function setAlign( root, align ) {
	const current = parseAlign( root );
	if ( current !== align ) {
		root.classList.remove( `cds--popover--${ current }` );
		root.classList.add( `cds--popover--${ align }` );
	}
}

/**
 * Pick the Carbon alignment closest to the author's choice that keeps the
 * popover inside the viewport. Only the content's box size is read from the
 * open popover; candidate positions are derived from the trigger's rect.
 *
 * @param {HTMLElement} root    Popover container (carries the align class).
 * @param {HTMLElement} trigger Info button the popover anchors to.
 * @param {HTMLElement} content Open popover content (measured for size).
 * @param {string}      author  The author-chosen alignment.
 * @return {string} Alignment to apply.
 */
function bestAlign( root, trigger, content, author ) {
	let [ , side, suffix = '' ] =
		author.match( /^(top|bottom|left|right)(-start|-end)?$/ ) || [];
	if ( ! side ) {
		return author;
	}

	const t = trigger.getBoundingClientRect();
	const { width: w, height: h } = content.getBoundingClientRect();
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const rtl = getComputedStyle( root ).direction === 'rtl';

	if ( side === 'left' || side === 'right' ) {
		const fitsLeft = t.left - GAP - w >= VIEW_PAD;
		const fitsRight = t.right + GAP + w <= vw - VIEW_PAD;
		if ( side === 'left' && ! fitsLeft && fitsRight ) {
			return 'right';
		}
		if ( side === 'right' && ! fitsRight && fitsLeft ) {
			return 'left';
		}
		if (
			( side === 'left' && fitsLeft ) ||
			( side === 'right' && fitsRight )
		) {
			return author;
		}
		// Fits on neither side — fall through to a stacked placement.
		side = 'bottom';
		suffix = '';
	}

	const centerX = t.left + t.width / 2;
	const overLeft = centerX - w / 2 < VIEW_PAD;
	const overRight = centerX + w / 2 > vw - VIEW_PAD;
	if ( overLeft && ! overRight ) {
		suffix = rtl ? '-end' : '-start';
	} else if ( overRight && ! overLeft ) {
		suffix = rtl ? '-start' : '-end';
	}

	const fitsBelow = t.bottom + GAP + h <= vh - VIEW_PAD;
	const fitsAbove = t.top - GAP - h >= VIEW_PAD;
	if ( side === 'bottom' && ! fitsBelow && fitsAbove ) {
		side = 'top';
	} else if ( side === 'top' && ! fitsAbove && fitsBelow ) {
		side = 'bottom';
	}

	return side + suffix;
}

function openTip( parts ) {
	const { root, trigger, content } = parts;

	let author = authorAligns.get( root );
	if ( ! author ) {
		author = parseAlign( root );
		authorAligns.set( root, author );
	}

	setAlign( root, author );
	root.classList.add( ...OPEN_CLASSES );
	trigger.setAttribute( 'aria-expanded', 'true' );
	setAlign( root, bestAlign( root, trigger, content, author ) );

	if ( ! dismissers.has( root ) ) {
		dismissers.set(
			root,
			installOutsideDismiss( root, trigger, ( reason ) =>
				closeTip( parts, /* returnFocus */ reason === 'escape' )
			)
		);
	}
}

function closeTip( parts, returnFocus = false ) {
	const { root, trigger } = parts;
	root.classList.remove( ...OPEN_CLASSES );
	trigger.setAttribute( 'aria-expanded', 'false' );

	const author = authorAligns.get( root );
	if ( author ) {
		setAlign( root, author );
	}

	const disposeDismiss = dismissers.get( root );
	if ( disposeDismiss ) {
		disposeDismiss();
		dismissers.delete( root );
	}
	if ( returnFocus && trigger ) {
		trigger.focus();
	}
}

store( 'awt/toggletip', {
	actions: {
		toggle() {
			const parts = getParts( getElement().ref );
			if ( ! parts ) {
				return;
			}
			const isOpen =
				parts.trigger.getAttribute( 'aria-expanded' ) === 'true';
			if ( isOpen ) {
				closeTip( parts );
			} else {
				openTip( parts );
			}
		},
	},
} );
