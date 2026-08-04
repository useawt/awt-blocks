/**
 * Computed-style snapshot gate.
 *
 * Measures a curated list of elements on the shared fixture pages — in BOTH
 * color schemes — and diffs the result against a committed snapshot. For each
 * element it records the values that carry meaning: text and background color,
 * the composited background actually behind the text, the resolved contrast
 * ratio, borders, outline, box-shadow, type metrics, and (where the box is set
 * by CSS) size and padding.
 *
 * What this gate is for
 * ---------------------
 * axe finds broken rules. It does not find a component that is styled wrongly
 * but legally: the skip link that rendered at half height wearing two focus
 * rings broke no axe rule, and a low-contrast notification that drops to 1.2:1
 * in dark mode is invisible to any gate that never resolves the cascade. Both
 * are changes in computed values, so both are caught here. Read the two gates
 * as complements, not substitutes.
 *
 * Why this is not screenshot diffing
 * ----------------------------------
 * Pixels rasterize differently on a dev Mac than in CI, so an image diff fails
 * for reasons nobody cares about — and a gate that cries wolf trains people to
 * re-approve baselines without looking. Computed values are deterministic. To
 * keep them that way:
 *
 *   • Geometry is opt-in per probe (`box: true`), and only on elements whose
 *     box CSS actually sets — buttons, inputs, the skip link, the password
 *     toggle. Never on text-flow boxes such as paragraphs or tiles, whose
 *     height depends on line breaking.
 *   • Width is opt-in again (`inline: true`), and only where a width is a
 *     designed value: square icon buttons, the checkbox and radio indicators.
 *     Every other width is really the label's text width, and text shaping is
 *     the one thing that genuinely differs between a Mac and a CI Linux box
 *     even when the font file is identical.
 *   • Fonts are the theme's own self-hosted woff2 files, so metrics match
 *     everywhere, and `document.fonts.ready` is awaited before measuring.
 *   • `font-family` is never recorded: it is the one type property whose
 *     resolved value depends on what is installed on the machine.
 *
 * If a probe ever churns between machines, drop `box` from that probe rather
 * than loosening the gate for everything.
 *
 * Snapshot
 * --------
 * `computed-styles.snap.json`, keyed by color scheme (so a run can never be
 * mistaken for the other scheme's) and then by `page/probe`. Regenerate a
 * deliberate change with:
 *
 *   UPDATE_SNAPSHOTS=1 npm run test:styles
 *
 * Same contract as the 37 PHP render snapshots, on purpose: one snapshot
 * workflow in this repo, not two. Review the diff before committing — the
 * point of the gate is the reading, not the regeneration.
 *
 * Five traps, all of which would produce a passing test that measures nothing.
 * The first three were hit for real during the 2026-08-01 skip-link work, and
 * the fifth was hit by this gate itself and committed for two days:
 *
 *   1. `:focus` does not match unless the window has focus, and `:focus-visible`
 *      additionally needs keyboard modality. Every focus probe asserts
 *      `el.matches(':focus')` before recording, and records whether
 *      `:focus-visible` matched — a control that silently stops drawing a
 *      keyboard focus ring is a WCAG 2.4.7 failure worth failing over.
 *   2. Styles read before layout settles are wrong. Gate on `readyState`,
 *      on `document.fonts.ready`, and — for anything that animates — on the
 *      animation having finished. `toBeVisible()` passes at `opacity: 0`.
 *   3. A run that does not verify which color scheme it is in can silently
 *      test light twice. `gotoWithScheme` asserts the resolved scope class,
 *      and the scheme is part of the snapshot's own structure.
 *   4. A selector that matches nothing must FAIL, not skip. A renamed class
 *      would otherwise quietly delete coverage while the gate stayed green.
 *   5. Probes share a page, so releasing an interaction state is not the same
 *      as it being gone: `:hover` and `:focus` stop matching immediately while
 *      the color keeps transitioning for another 110ms. This gate recorded a
 *      resting header nav link in Carbon's hover color that way — `hover:
 *      false` next to a hover value, entirely plausible, wrong for two days.
 *      Resting probes now clear and settle first, stateful ones settle after
 *      releasing, and a resting probe measured mid-interaction fails.
 *      Related: park the pointer OUTSIDE the viewport, never at `(0, 0)`,
 *      which is inside the fixed header and hovers the brand.
 */

const fs = require( 'fs' );
const path = require( 'path' );
const { test, expect } = require( './fixtures' );
const { PAGES } = require( './fixture-pages' );

const SNAPSHOT_PATH = path.join( __dirname, 'computed-styles.snap.json' );
const UPDATING = process.env.UPDATE_SNAPSHOTS === '1';

const SNAPSHOT_NOTE =
	'Computed styles for a curated element list, per color scheme. Written by ' +
	'UPDATE_SNAPSHOTS=1 npm run test:styles. A diff means a code change altered ' +
	'a rendered value — read it before regenerating.';

const SCHEMES = [ 'light', 'dark' ];

/* -------------------------------------------------------------------------
 * Probes
 *
 * key    unique within its page; stored as `page/key`.
 * sel    CSS selector. Must match at least one element or the run fails.
 * nth    index when the selector matches several (default 0).
 * pseudo '::before' / '::after' — Carbon draws checkbox and radio indicators
 *        as pseudo-elements, and their border is the non-text contrast that
 *        WCAG 1.4.11 cares about.
 * state  'focus' | 'hover'. Applied to this element, then undone.
 * box    record block-size and padding. Opt-in — see the header.
 * inline also record inline-size. Only where a width is designed, not typed.
 * group  'default' (page as loaded) or 'opened' (after GROUP_SETUP ran).
 * ---------------------------------------------------------------------- */

const PROBES = [
	/* --- Theme chrome. Present on every page; measured once, on `content`.
	   The skip link is the reason this gate exists: it is styled entirely by
	   the foundation, has no `.cds--*` block CSS of its own, and so no other
	   gate in the repo looks at it. --- */
	{
		page: 'content',
		key: 'skip-link (focused)',
		sel: '.cds--skip-to-content',
		state: 'focus',
		box: true,
	},
	{ page: 'content', key: 'header', sel: '.cds--header', box: true },
	{ page: 'content', key: 'header-brand', sel: '.cds--header__name' },
	{
		page: 'content',
		key: 'header-menu-item',
		sel: 'a.cds--header__menu-item',
		box: true,
	},
	{
		page: 'content',
		key: 'header-menu-item (hover)',
		sel: 'a.cds--header__menu-item',
		state: 'hover',
	},
	{
		page: 'content',
		key: 'header-menu-item (focused)',
		sel: 'a.cds--header__menu-item',
		state: 'focus',
	},
	{
		page: 'content',
		key: 'header-action',
		sel: 'a.cds--header__action',
		box: true,
		inline: true,
	},
	{
		page: 'content',
		key: 'color-scheme-toggle',
		sel: '.awt-color-scheme-toggle',
		box: true,
		inline: true,
	},
	{ page: 'content', key: 'footer-heading', sel: '.cds--footer__heading' },
	{
		page: 'content',
		key: 'footer-link',
		sel: '.cds--footer__link .cds--link',
		box: true,
	},

	/* --- Forms --- */
	{ page: 'forms', key: 'form-title', sel: '.cds--form__title' },
	{ page: 'forms', key: 'form-description', sel: '.cds--form__description' },
	{ page: 'forms', key: 'field-label', sel: '.cds--label' },
	{ page: 'forms', key: 'helper-text', sel: '.cds--form__helper-text' },
	{ page: 'forms', key: 'text-input', sel: '.cds--text-input', box: true },
	{
		page: 'forms',
		key: 'text-input (focused)',
		sel: '.cds--text-input',
		state: 'focus',
		box: true,
	},
	{
		page: 'forms',
		key: 'text-input (invalid)',
		sel: '.cds--text-input--invalid',
		box: true,
	},
	{ page: 'forms', key: 'invalid-text', sel: '.cds--form-requirement' },
	{
		page: 'forms',
		key: 'text-input (warning)',
		sel: '.cds--text-input--warning',
		box: true,
	},
	/* Difference D5: AWT draws a field's border on all four sides, and these
	   three probes are the parts of that no other probe can see.
	   - read-only and disabled are the two states where Carbon changes the
	     border, so they are the two the four-sided rule has to special-case;
	     get either wrong and the field shows three solid edges and one gap.
	   - the Carbon-default field is the opt-out path. It must measure as
	     Carbon's own bottom-only border. If someone ever "simplifies" this by
	     restyling `.cds--text-input` globally instead of via the frame class,
	     this is the probe that fails. */
	{
		page: 'forms',
		key: 'text-input (readonly)',
		sel: '.cds--text-input[readonly]',
		box: true,
	},
	/* Both read-only selectors are probed, because D7 writes one rule per
	   element type and a typo in either is invisible otherwise. Read-only has no
	   fill, so `borderContrast` here is measured against the page and is the
	   number D7 exists to keep above 3. */
	{
		page: 'forms',
		key: 'text-area (readonly)',
		sel: '.cds--text-area[readonly]',
		box: true,
	},
	{
		page: 'forms',
		key: 'text-input (disabled)',
		sel: '.cds--text-input:disabled',
		box: true,
	},
	{
		page: 'forms',
		key: 'text-input (carbon default)',
		sel: '.wp-block-awt-text-input:not(.awt-field--framed) .cds--text-input',
		box: true,
	},
	/* The 40x16 target that axe caught on 2026-08-01. Its height comes from
	   `inset-block: 0` on the field wrapper, which no rule states as a number —
	   exactly the kind of value that changes without anyone noticing. */
	{
		page: 'forms',
		key: 'password-toggle',
		sel: '.cds--text-input--password__visibility__toggle',
		box: true,
		inline: true,
	},
	{
		page: 'forms',
		key: 'password-toggle (focused)',
		sel: '.cds--text-input--password__visibility__toggle',
		state: 'focus',
		box: true,
		inline: true,
	},
	{ page: 'forms', key: 'text-area', sel: '.cds--text-area', box: true },
	{
		page: 'forms',
		key: 'select-input',
		sel: '.cds--select-input',
		box: true,
	},
	/* The indicator is the 16px box a person looks at; the label around it is
	   the target they have to hit. WCAG 1.4.11 judges the first, 2.5.8 the
	   second, so both are measured — reading only the indicator would report a
	   16x16 target that does not exist. */
	{
		page: 'forms',
		key: 'checkbox-indicator',
		sel: '.cds--checkbox-label',
		pseudo: '::before',
		box: true,
		inline: true,
	},
	{
		page: 'forms',
		key: 'checkbox-target',
		sel: '.cds--checkbox-label',
		box: true,
	},
	{ page: 'forms', key: 'checkbox-label', sel: '.cds--checkbox-label-text' },
	{
		page: 'forms',
		key: 'radio-indicator',
		sel: '.cds--radio-button__appearance',
		box: true,
		inline: true,
	},
	{
		page: 'forms',
		key: 'radio-target',
		sel: '.cds--radio-button__label',
		box: true,
	},
	{
		page: 'forms',
		key: 'toggle-switch (on)',
		sel: '.cds--toggle__switch',
		box: true,
		inline: true,
	},
	{
		page: 'forms',
		key: 'button-primary',
		sel: '.cds--btn--primary',
		box: true,
	},
	{
		page: 'forms',
		key: 'button-primary (hover)',
		sel: '.cds--btn--primary',
		state: 'hover',
	},
	{
		page: 'forms',
		key: 'button-primary (focused)',
		sel: '.cds--btn--primary',
		state: 'focus',
		box: true,
	},
	{
		page: 'forms',
		key: 'button-secondary',
		sel: '.cds--btn--secondary',
		box: true,
	},
	{
		page: 'forms',
		key: 'button-danger',
		sel: '.cds--btn--danger',
		box: true,
	},
	{ page: 'forms', key: 'button-ghost', sel: '.cds--btn--ghost', box: true },

	/* --- Interactive widgets --- */
	{
		page: 'widgets',
		key: 'accordion-heading',
		sel: '.cds--accordion__heading',
		box: true,
	},
	{
		page: 'widgets',
		key: 'accordion-heading (focused)',
		sel: '.cds--accordion__heading',
		state: 'focus',
		box: true,
	},
	{ page: 'widgets', key: 'accordion-title', sel: '.cds--accordion__title' },
	{
		page: 'widgets',
		key: 'faq-question',
		sel: '.awt-faq-item__trigger',
		box: true,
	},
	{
		page: 'widgets',
		key: 'tab (selected)',
		sel: '.cds--tabs__nav-link[aria-selected="true"]',
		box: true,
	},
	{
		page: 'widgets',
		key: 'tab (unselected)',
		sel: '.cds--tabs__nav-link[aria-selected="false"]',
		box: true,
	},
	{
		page: 'widgets',
		key: 'tab (focused)',
		sel: '.cds--tabs__nav-link[aria-selected="true"]',
		state: 'focus',
	},
	{
		page: 'widgets',
		key: 'content-switcher (selected)',
		sel: '.cds--content-switcher-btn[aria-selected="true"]',
		box: true,
	},
	{
		page: 'widgets',
		key: 'content-switcher (unselected)',
		sel: '.cds--content-switcher-btn[aria-selected="false"]',
		box: true,
	},
	{
		page: 'widgets',
		key: 'dropdown-field',
		sel: '.cds--list-box__field',
		box: true,
	},
	/* The dropdown's border lives on the `.cds--dropdown` root, not on the
	   `__field` button above — so without this probe nothing measures the
	   dropdown's boundary at all, and difference D5 could regress on this one
	   block unnoticed. */
	{
		page: 'widgets',
		key: 'dropdown-root',
		sel: '.cds--dropdown',
		box: true,
	},
	{
		page: 'widgets',
		key: 'menu-button-trigger',
		sel: '.cds--menu-button__trigger',
		box: true,
		inline: true,
	},
	{
		page: 'widgets',
		key: 'toggletip-button',
		sel: '.cds--toggletip-button',
		box: true,
		inline: true,
	},
	{ page: 'widgets', key: 'tile-summary', sel: '.cds--tile__summary-text' },

	/* --- Opened state. A closed panel and an unopened modal are the parts
	   most likely to be wrong and the parts nothing else measures. --- */
	{
		page: 'widgets',
		group: 'opened',
		key: 'accordion-content (open)',
		sel: '.cds--accordion__item--active .cds--accordion__content',
	},
	{
		page: 'widgets',
		group: 'opened',
		key: 'modal-container',
		sel: '#axe-modal .cds--modal-container',
	},
	{
		page: 'widgets',
		group: 'opened',
		key: 'modal-label',
		sel: '.cds--modal-header__label',
	},
	{
		page: 'widgets',
		group: 'opened',
		key: 'modal-heading',
		sel: '.cds--modal-header__heading',
	},
	{
		page: 'widgets',
		group: 'opened',
		key: 'modal-secondary-button',
		sel: '.cds--modal-cancel-button',
		box: true,
	},
	{
		page: 'widgets',
		group: 'opened',
		key: 'modal-primary-button (danger)',
		sel: '.cds--modal-primary-button',
		box: true,
	},
	/* Two probes, because an open modal moves focus to this button, and until
	   2026-08-03 the resting probe silently recorded that: `focus: true` and a
	   4.55:1 blue focus border, filed as the button's resting appearance. The
	   number was worth having and the label was a lie, so it is now declared.
	   Resting matters too — a user who tabs on within the modal leaves it. */
	{
		page: 'widgets',
		group: 'opened',
		key: 'modal-close',
		sel: '.cds--modal-close',
		box: true,
		inline: true,
	},
	{
		page: 'widgets',
		group: 'opened',
		key: 'modal-close (focused)',
		sel: '.cds--modal-close',
		state: 'focus',
	},

	/* --- Content blocks --- */
	{ page: 'content', key: 'hero-heading', sel: '.awt-hero__heading' },
	{ page: 'content', key: 'hero-description', sel: '.awt-hero__description' },
	{
		page: 'content',
		key: 'breadcrumb-link',
		sel: '.cds--breadcrumb-item .cds--link',
	},
	{
		page: 'content',
		key: 'breadcrumb-current',
		sel: '.cds--breadcrumb-item [aria-current="page"]',
	},
	{ page: 'content', key: 'link', sel: 'a.wp-block-awt-link' },
	// A plain <a> typed into a paragraph — no design-system class, so nothing in
	// theme.css targets it. It is here because D6 deliberately leaves it alone:
	// the browser already underlines it, and the moment our rules start setting
	// its decoration, turning a switch off would strip an underline the visitor
	// had before. This probe fails if that ever starts happening.
	{
		page: 'content',
		key: 'plain-paragraph-link',
		sel: 'main p a:not([class*="cds--"]):not([class*="wp-block"])',
	},
	{
		page: 'content',
		key: 'link (hover)',
		sel: 'a.wp-block-awt-link',
		state: 'hover',
	},
	{
		page: 'content',
		key: 'link (focused)',
		sel: 'a.wp-block-awt-link',
		state: 'focus',
	},
	{
		page: 'content',
		key: 'notification-info',
		sel: '.cds--inline-notification--info',
	},
	{
		page: 'content',
		key: 'notification-info-title',
		sel: '.cds--inline-notification--info .cds--inline-notification__title',
	},
	/* The three low-contrast notifications. Deleting one byte-identical
	   `color` declaration from theme.css dropped these to 1.2:1 in dark mode
	   on 2026-08-01, and only a before/after measurement caught it. */
	{
		page: 'content',
		key: 'notification-success-low-contrast',
		sel: '.cds--inline-notification--success.cds--inline-notification--low-contrast .cds--inline-notification__title',
	},
	{
		page: 'content',
		key: 'notification-warning-low-contrast',
		sel: '.cds--inline-notification--warning.cds--inline-notification--low-contrast .cds--inline-notification__title',
	},
	{
		page: 'content',
		key: 'notification-error-low-contrast',
		sel: '.cds--inline-notification--error.cds--inline-notification--low-contrast .cds--inline-notification__title',
	},
	{
		page: 'content',
		key: 'toast-notification-title',
		sel: '.cds--toast-notification__title',
	},
	{ page: 'content', key: 'tag-green', sel: '.cds--tag--green', box: true },
	{ page: 'content', key: 'tag-purple', sel: '.cds--tag--purple' },
	{ page: 'content', key: 'tag-filter', sel: '.cds--tag--filter', box: true },
	// The two tag types whose colors come from scope-level tokens rather than
	// the tag palette, so they change for different reasons than the ten above.
	{
		page: 'content',
		key: 'tag-outline',
		sel: '.cds--tag--outline',
		box: true,
	},
	{
		page: 'content',
		key: 'tag-high-contrast',
		sel: '.cds--tag--high-contrast',
		box: true,
	},
	{
		page: 'content',
		key: 'table-header-cell',
		sel: '.cds--data-table thead th',
	},
	{
		page: 'content',
		key: 'table-cell (zebra row)',
		sel: '.cds--data-table tbody tr:nth-child(2) td',
	},
	{ page: 'content', key: 'code-snippet', sel: '.cds--snippet' },
	{ page: 'content', key: 'list-item', sel: '.cds--list__item' },
	{ page: 'content', key: 'stat-value', sel: '.awt-stat__value' },
	{ page: 'content', key: 'stat-heading', sel: '.awt-stat__heading' },
	{
		page: 'content',
		key: 'testimonial-quote',
		sel: '.awt-testimonial__quote',
	},
	{ page: 'content', key: 'pricing-price', sel: '.awt-pricing-tile__price' },
	{
		page: 'content',
		key: 'pagination-page (current)',
		sel: '.cds--pagination-nav__page--current',
		box: true,
		inline: true,
	},
	{
		page: 'content',
		key: 'pagination-page',
		sel: '.cds--pagination-nav__page:not(.cds--pagination-nav__page--current)',
		box: true,
		inline: true,
	},
];

/**
 * Per-page waits that must pass before anything is measured.
 *
 * The tabs and content switcher render every button `aria-selected="false"` and
 * the interactivity API selects the first one on hydration, so the selected /
 * unselected probes measure the same thing until it runs.
 */
const PAGE_READY = {
	widgets: async ( page ) => {
		await page.waitForSelector(
			'.cds--tabs__nav-link[aria-selected="true"]'
		);
		await page.waitForSelector(
			'.cds--content-switcher-btn[aria-selected="true"]'
		);
	},
};

/** Setup for probes in the `opened` group. */
const GROUP_SETUP = {
	'widgets|opened': async ( page ) => {
		const heading = page.locator( '.cds--accordion__heading' ).first();
		await heading.click();
		await expect( heading ).toHaveAttribute( 'aria-expanded', 'true' );

		await page.getByRole( 'button', { name: 'Open the dialog' } ).click();
		const dialog = page.locator( '#axe-modal' );
		await expect( dialog ).toHaveClass( /\bis-visible\b/ );
		// Trap 2: `toBeVisible()` passes at opacity 0, and colors read mid-fade
		// are blended, not real — that is how three phantom contrast failures
		// got reported the first time the axe gate ran.
		await page.waitForFunction( () => {
			const modal = document.querySelector( '#axe-modal' );
			return modal && window.getComputedStyle( modal ).opacity === '1';
		} );
	},
};

/* -------------------------------------------------------------------------
 * In-page measurement
 * ---------------------------------------------------------------------- */

/**
 * Runs in the browser. Self-contained: it is serialized into the page.
 *
 * @param {Object} probe Plain-data probe (functions do not survive the trip).
 * @return {Object} Measured values, or `{ error }`.
 */
/* eslint-disable jsdoc/require-jsdoc */
function measureInPage( probe ) {
	const round = ( n, places ) => {
		const factor = Math.pow( 10, places );
		return Math.round( n * factor ) / factor;
	};

	const parseColor = ( value ) => {
		const nums = String( value )
			.replace( /[^0-9.,]/g, '' )
			.split( ',' )
			.map( Number );
		if ( nums.length < 3 || nums.some( Number.isNaN ) ) {
			return null;
		}
		return {
			r: nums[ 0 ],
			g: nums[ 1 ],
			b: nums[ 2 ],
			a: nums.length > 3 ? nums[ 3 ] : 1,
		};
	};

	const over = ( top, bottom ) => ( {
		r: top.r * top.a + bottom.r * ( 1 - top.a ),
		g: top.g * top.a + bottom.g * ( 1 - top.a ),
		b: top.b * top.a + bottom.b * ( 1 - top.a ),
		a: 1,
	} );

	// The background a person actually sees behind this element: the nearest
	// ancestor chain of non-transparent layers, composited. Reading only the
	// element's own background-color reports "transparent" for most text.
	const effectiveBackground = ( node ) => {
		const layers = [];
		let current = node;
		while ( current ) {
			const color = parseColor(
				window.getComputedStyle( current ).backgroundColor
			);
			if ( color && color.a > 0 ) {
				layers.push( color );
				if ( color.a === 1 ) {
					break;
				}
			}
			current = current.parentElement;
		}
		let result = { r: 255, g: 255, b: 255, a: 1 };
		for ( let i = layers.length - 1; i >= 0; i-- ) {
			result = over( layers[ i ], result );
		}
		return result;
	};

	const luminance = ( color ) => {
		const channel = ( value ) => {
			const c = value / 255;
			return c <= 0.03928
				? c / 12.92
				: Math.pow( ( c + 0.055 ) / 1.055, 2.4 );
		};
		return (
			0.2126 * channel( color.r ) +
			0.7152 * channel( color.g ) +
			0.0722 * channel( color.b )
		);
	};

	const ratio = ( a, b ) => {
		const la = luminance( a );
		const lb = luminance( b );
		return ( Math.max( la, lb ) + 0.05 ) / ( Math.min( la, lb ) + 0.05 );
	};

	const rgb = ( color ) =>
		`rgb(${ Math.round( color.r ) }, ${ Math.round(
			color.g
		) }, ${ Math.round( color.b ) })`;

	const matched = document.querySelectorAll( probe.sel );
	if ( ! matched.length ) {
		return { error: `selector matched no element: ${ probe.sel }` };
	}
	const index = probe.nth || 0;
	if ( index >= matched.length ) {
		return {
			error: `selector matched ${ matched.length } element(s), needed index ${ index }`,
		};
	}
	const el = matched[ index ];
	const style = window.getComputedStyle( el, probe.pseudo || null );

	const out = {
		matches: {
			focus: el.matches( ':focus' ),
			focusVisible: el.matches( ':focus-visible' ),
			hover: el.matches( ':hover' ),
		},
		display: style.display,
		visibility: style.visibility,
		opacity: style.opacity,
		color: style.color,
		backgroundColor: style.backgroundColor,
		// font-family is deliberately absent: it is the one type property whose
		// resolved value depends on what is installed on the machine.
		fontSize: style.fontSize,
		fontWeight: style.fontWeight,
		lineHeight: style.lineHeight,
		// Recorded on every probe, not just links. A link that stops being
		// underlined is difference D6 drifting back — a WCAG 1.4.1 failure on
		// any palette where the link colour is under 3:1 against body text,
		// which Carbon's dark blue is (2.14:1 measured). Recording it
		// everywhere also freezes the negative: a button or a tag that
		// suddenly grows an underline is a regression too.
		textDecoration: `${ style.textDecorationLine } ${ style.textDecorationStyle } ${ style.textDecorationColor } ${ style.textDecorationThickness }`,
		outline: `${ style.outlineWidth } ${ style.outlineStyle } ${ style.outlineColor }`,
		outlineOffset: style.outlineOffset,
		boxShadow: style.boxShadow,
	};

	const sides = [ 'Top', 'Right', 'Bottom', 'Left' ];
	const borders = sides.map(
		( side ) =>
			`${ style[ `border${ side }Width` ] } ${
				style[ `border${ side }Style` ]
			} ${ style[ `border${ side }Color` ] }`
	);
	out.border = borders.every( ( b ) => b === borders[ 0 ] )
		? borders[ 0 ]
		: {
				top: borders[ 0 ],
				right: borders[ 1 ],
				bottom: borders[ 2 ],
				left: borders[ 3 ],
		  };

	// Contrast is only meaningful where there is text to read. The pseudo-element
	// probes (checkbox and radio indicators) carry none, so they report the
	// non-text ratio below instead — WCAG 1.4.11 rather than 1.4.3.
	const background = probe.pseudo
		? ( () => {
				const own = parseColor( style.backgroundColor );
				return own && own.a === 1 ? own : effectiveBackground( el );
		  } )()
		: effectiveBackground( el );
	out.effectiveBackground = rgb( background );

	const hasText = ! probe.pseudo && el.textContent.trim().length > 0;
	if ( hasText ) {
		const text = parseColor( style.color );
		if ( text ) {
			out.contrast = round(
				ratio(
					text.a === 1 ? text : over( text, background ),
					background
				),
				2
			);
		}
	}

	// Non-text contrast for a visible border — the checkbox tick box, the input
	// underline, the focus border. Measured against what is behind the element,
	// not against the element's own fill.
	// A fully transparent border is not a visual indicator — Carbon puts
	// `1px solid transparent` on buttons to reserve space for the focus border —
	// so measuring it would fill the snapshot with meaningless 1:1 ratios.
	const borderColor = parseColor( style.borderTopColor );
	const borderWidth = parseFloat( style.borderTopWidth );
	if (
		borderColor &&
		borderColor.a > 0 &&
		borderWidth > 0 &&
		style.borderTopStyle !== 'none'
	) {
		const behind = effectiveBackground(
			probe.pseudo ? el : el.parentElement || el
		);
		out.borderContrast = round(
			ratio(
				borderColor.a === 1 ? borderColor : over( borderColor, behind ),
				behind
			),
			2
		);
	}

	if ( probe.box ) {
		const rect = probe.pseudo ? null : el.getBoundingClientRect();
		out.box = {
			blockSize: probe.pseudo
				? style.blockSize
				: `${ round( rect.height, 2 ) }px`,
			padding: `${ style.paddingTop } ${ style.paddingRight } ${ style.paddingBottom } ${ style.paddingLeft }`,
		};
		// Width is recorded only where it is a designed value — square icon
		// buttons, indicators. Everywhere else a width is the label's text
		// width, and text shaping is the one thing that genuinely differs
		// between a Mac and a CI Linux box even with the same font file.
		if ( probe.inline ) {
			out.box.inlineSize = probe.pseudo
				? style.inlineSize
				: `${ round( rect.width, 2 ) }px`;
		}
	}

	return out;
}
/* eslint-enable jsdoc/require-jsdoc */

/* -------------------------------------------------------------------------
 * Snapshot handling
 * ---------------------------------------------------------------------- */

function loadSnapshot() {
	if ( ! fs.existsSync( SNAPSHOT_PATH ) ) {
		return { styles: {} };
	}
	return JSON.parse( fs.readFileSync( SNAPSHOT_PATH, 'utf8' ) );
}

const committed = loadSnapshot();

// Workers are pinned to 1 in playwright.config, so a module-level accumulator
// is safe. afterAll needs every run's results to write or to check staleness.
const captured = {};
const completedRuns = new Set();

/**
 * Diff one probe's measurement against the committed values.
 *
 * @param {Object} expected Committed values.
 * @param {Object} actual   Measured values.
 * @return {string[]} Human-readable property diffs.
 */
function diffValues( expected, actual ) {
	const lines = [];
	const keys = [
		...new Set( [
			...Object.keys( expected || {} ),
			...Object.keys( actual || {} ),
		] ),
	].sort();
	for ( const key of keys ) {
		const before = JSON.stringify( expected?.[ key ] );
		const after = JSON.stringify( actual?.[ key ] );
		if ( before !== after ) {
			lines.push( `      ${ key }: ${ before } → ${ after }` );
		}
	}
	return lines;
}

/**
 * Compare a run's measurements with the snapshot and fail on any difference.
 *
 * @param {string} run     Run key, e.g. `widgets|dark|opened`.
 * @param {string} scheme  Color scheme.
 * @param {Object} results Measurements, keyed `page/probe`.
 */
function assertAgainstSnapshot( run, scheme, results ) {
	completedRuns.add( run );
	captured[ scheme ] = { ...( captured[ scheme ] || {} ), ...results };

	if ( UPDATING ) {
		return;
	}

	const expected = committed.styles?.[ scheme ] || {};
	const problems = [];

	for ( const [ key, actual ] of Object.entries( results ) ) {
		if ( ! ( key in expected ) ) {
			problems.push(
				`  • ${ key } — no committed snapshot for this probe in ${ scheme }`
			);
			continue;
		}
		const lines = diffValues( expected[ key ], actual );
		if ( lines.length ) {
			problems.push( `  • ${ key }\n${ lines.join( '\n' ) }` );
		}
	}

	expect(
		problems.length,
		problems.length
			? `${ problems.length } computed-style difference(s) on "${ run }":\n` +
					`${ problems.join( '\n' ) }\n\n` +
					`If the change is deliberate, regenerate with ` +
					`UPDATE_SNAPSHOTS=1 npm run test:styles and review the diff.`
			: ''
	).toBe( 0 );
}

/* -------------------------------------------------------------------------
 * Page helpers
 * ---------------------------------------------------------------------- */

/**
 * Navigate with a color scheme that is actually in effect, and wait until the
 * page is measurable: document complete, webfonts loaded, hydration done.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          url
 * @param {string}                          scheme  'light' or 'dark'.
 * @param {string}                          baseURL
 * @param {string}                          pageKey Fixture page key.
 */
async function gotoWithScheme( page, url, scheme, baseURL, pageKey ) {
	await page.emulateMedia( { colorScheme: scheme } );
	await page
		.context()
		.addCookies( [
			{ name: 'awt_color_scheme', value: scheme, url: baseURL },
		] );

	await page.goto( url );
	await page.waitForFunction( () => document.readyState === 'complete' );
	// Metrics before the webfont arrives are the fallback font's.
	await page.evaluate( () => document.fonts.ready );

	const state = await page.evaluate( () => ( {
		html: document.documentElement.getAttribute( 'data-awt-color-scheme' ),
		body: document.body.className,
	} ) );

	expect( state.html, `<html data-awt-color-scheme> for ${ scheme }` ).toBe(
		scheme
	);
	const expectedScope =
		scheme === 'dark' ? /\bcds--(g90|g100)\b/ : /\bcds--(white|g10)\b/;
	expect(
		state.body,
		`<body> scope class for ${ scheme } (got "${ state.body }")`
	).toMatch( expectedScope );

	if ( PAGE_READY[ pageKey ] ) {
		await PAGE_READY[ pageKey ]( page );
	}
}

/**
 * Put the browser in keyboard modality so programmatic focus still matches
 * `:focus-visible`. Chromium decides focus-visible from the last input the
 * user made; without this every focus probe would record `focusVisible: false`
 * and the gate would enshrine a missing focus ring as correct.
 *
 * @param {import('@playwright/test').Page} page
 */
async function useKeyboardModality( page ) {
	await page.keyboard.press( 'Tab' );
	// The rule guards against the editor's iframe, where a global `document` is
	// the wrong one. This body is serialized into the page under test.
	// eslint-disable-next-line @wordpress/no-global-active-element
	await page.evaluate( () => document.activeElement?.blur() );
}

/**
 * Wait for an element's running transitions and animations to finish.
 *
 * Carbon animates focus and hover — the text input's focus outline fades in
 * over 70ms — so a value read the instant after `.focus()` is a blended frame,
 * not a style. Recording one is how a snapshot ends up enshrining an artifact:
 * this gate did exactly that on its first generated run, and captured the
 * input's focus outline as `rgba(255, 255, 255, 0.063)` instead of the real
 * `$focus` white. Trap 2 in the file header, in the costume that catches you.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object}                          probe
 */
async function settle( page, probe ) {
	await page.evaluate(
		async ( { sel, nth } ) => {
			const el = document.querySelectorAll( sel )[ nth ];
			if ( ! el || ! el.getAnimations ) {
				return;
			}
			const running = el
				.getAnimations( { subtree: true } )
				.filter( ( a ) => a.playState === 'running' )
				.map( ( a ) => a.finished.catch( () => {} ) );
			// An infinite animation never finishes; do not hang on one.
			await Promise.race( [
				Promise.all( running ),
				new Promise( ( resolve ) => setTimeout( resolve, 1000 ) ),
			] );
		},
		{ sel: probe.sel, nth: probe.nth || 0 }
	);
}

/**
 * Put the pointer where it cannot hover anything, and drop focus.
 *
 * Outside the viewport, not `(0, 0)`. Two reasons, both found the hard way:
 * `(0, 0)` is inside the fixed header — `elementFromPoint(0, 0)` returns
 * `a.cds--header__name`, a probed element — and Chromium starts every page with
 * the pointer at `(0, 0)`, so the header brand was measured hovered on every
 * run of this gate, resting probe and all. A negative coordinate hovers
 * nothing, which is the only position that is honestly neutral.
 *
 * @param {import('@playwright/test').Page} page
 */
async function clearInteraction( page ) {
	await page.mouse.move( -50, -50 );
	// Serialized into the page under test — see useKeyboardModality().
	// eslint-disable-next-line @wordpress/no-global-active-element
	await page.evaluate( () => document.activeElement?.blur() );
}

/**
 * Measure one probe, applying and then undoing its interaction state.
 *
 * Probes share a page, so each one inherits whatever the last one left behind.
 * That is how this gate came to record a resting header nav link in Carbon's
 * *hover* color (`$text-primary`, not `$text-secondary`) and enshrine 18.1:1
 * where the real value is 7.81:1: the state was undone before the next probe,
 * but nothing waited for the 110ms color transition to run back, and
 * `:hover`/`:focus` stop matching the instant the state is released. So the
 * measurement recorded `hover: false` beside a hover color and looked entirely
 * plausible. Trap 2 in the file header, one page further on than where it was
 * first found — there it was the state being applied, here the state being
 * released.
 *
 * Hence: clear and settle *before* a resting probe, and settle again *after*
 * undoing an interaction state. A resting probe is then resting whatever ran
 * before it, and the assertions below make a lie about it fail loudly.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object}                          probe
 * @return {Object} Measurement.
 */
async function runProbe( page, probe ) {
	const locator = page.locator( probe.sel ).nth( probe.nth || 0 );
	const label = `${ probe.page }/${ probe.key }`;

	if ( probe.state === 'focus' ) {
		await locator.focus();
	} else if ( probe.state === 'hover' ) {
		await locator.hover();
	} else {
		await clearInteraction( page );
	}
	await settle( page, probe );

	const plain = {
		sel: probe.sel,
		nth: probe.nth || 0,
		pseudo: probe.pseudo || null,
		box: !! probe.box,
	};
	const result = await page.evaluate( measureInPage, plain );

	// Trap 4: a selector that matches nothing must fail, not skip.
	expect(
		result.error,
		`${ label }: ${ result.error || '' }`
	).toBeUndefined();

	// Trap 1: a focus probe that did not actually focus records the resting
	// styles and calls them focused.
	if ( probe.state === 'focus' ) {
		expect(
			result.matches.focus,
			`${ label } was measured without :focus matching — the window may not ` +
				`hold focus, in which case every focus value here is the resting one`
		).toBe( true );
	}
	if ( probe.state === 'hover' ) {
		expect(
			result.matches.hover,
			`${ label } was measured without :hover matching`
		).toBe( true );
	}
	// Trap 5: a resting probe that was still interacting, or still animating
	// back out of it, records an interaction value as the resting one. Cheap to
	// assert and it names the culprit instead of leaving a plausible number.
	if ( ! probe.state ) {
		expect(
			result.matches.hover || result.matches.focus,
			`${ label } is a resting probe but was measured while hovered or ` +
				`focused, so its values are an interaction state`
		).toBe( false );
	}
	if ( probe.state ) {
		// Release the state, then wait for the transition *back* before the next
		// probe reads anything — releasing it is not the same as it being gone.
		await clearInteraction( page );
		await settle( page, probe );
	}

	return result;
}

/**
 * @param {string} pageKey
 * @param {string} group
 * @return {Object[]} Probes for this page and group.
 */
function probesFor( pageKey, group ) {
	return PROBES.filter(
		( probe ) =>
			probe.page === pageKey && ( probe.group || 'default' ) === group
	);
}

/* -------------------------------------------------------------------------
 * Tests
 * ---------------------------------------------------------------------- */

test.describe( 'Computed-style snapshots', () => {
	const pageIds = {};

	test.beforeAll( async ( { requestUtils } ) => {
		for ( const fixture of PAGES ) {
			const created = await requestUtils.createPage( {
				title: fixture.title,
				content: fixture.content,
				status: 'publish',
			} );
			pageIds[ fixture.key ] = created.id;
		}
	} );

	for ( const fixture of PAGES ) {
		for ( const scheme of SCHEMES ) {
			// The expect() calls live in the helpers, which the rule cannot see.
			// eslint-disable-next-line playwright/expect-expect
			test( `${ fixture.key } — ${ scheme }`, async ( {
				page,
				baseURL,
			} ) => {
				await gotoWithScheme(
					page,
					`/?page_id=${ pageIds[ fixture.key ] }`,
					scheme,
					baseURL,
					fixture.key
				);
				await useKeyboardModality( page );

				const results = {};
				for ( const probe of probesFor( fixture.key, 'default' ) ) {
					results[ `${ probe.page }/${ probe.key }` ] =
						await runProbe( page, probe );
				}
				assertAgainstSnapshot(
					`${ fixture.key }|${ scheme }|default`,
					scheme,
					results
				);
			} );
		}
	}

	for ( const scheme of SCHEMES ) {
		// eslint-disable-next-line playwright/expect-expect
		test( `widgets, opened — ${ scheme }`, async ( { page, baseURL } ) => {
			await gotoWithScheme(
				page,
				`/?page_id=${ pageIds.widgets }`,
				scheme,
				baseURL,
				'widgets'
			);
			await useKeyboardModality( page );
			await GROUP_SETUP[ 'widgets|opened' ]( page );

			const results = {};
			for ( const probe of probesFor( 'widgets', 'opened' ) ) {
				results[ `${ probe.page }/${ probe.key }` ] = await runProbe(
					page,
					probe
				);
			}
			assertAgainstSnapshot(
				`widgets|${ scheme }|opened`,
				scheme,
				results
			);
		} );
	}

	test.afterAll( () => {
		const expectedRuns = PAGES.length * SCHEMES.length + SCHEMES.length;

		if ( UPDATING ) {
			if ( completedRuns.size !== expectedRuns ) {
				throw new Error(
					`Refusing to write a partial snapshot: ${ completedRuns.size } of ` +
						`${ expectedRuns } runs completed. Fix the failing run first — a ` +
						`snapshot missing half its probes looks green forever.`
				);
			}
			const styles = {};
			for ( const scheme of SCHEMES ) {
				styles[ scheme ] = Object.fromEntries(
					Object.entries( captured[ scheme ] || {} ).sort(
						( [ a ], [ b ] ) => a.localeCompare( b )
					)
				);
			}
			fs.writeFileSync(
				SNAPSHOT_PATH,
				JSON.stringify(
					{ $note: committed.$note || SNAPSHOT_NOTE, styles },
					null,
					'\t'
				) + '\n'
			);
			// eslint-disable-next-line no-console
			console.log(
				`\nWrote ${ Object.keys( styles.light ).length } probes × ` +
					`${ SCHEMES.length } schemes to computed-styles.snap.json. ` +
					`Read the diff before committing.\n`
			);
			return;
		}

		// A snapshot listing probes that no longer run is a snapshot nobody can
		// trust — most likely a selector was renamed and its coverage vanished.
		// Only check once every run reported, so a failing run does not also
		// produce a misleading staleness error.
		if ( completedRuns.size === expectedRuns ) {
			const stale = [];
			for ( const scheme of SCHEMES ) {
				for ( const key of Object.keys(
					committed.styles?.[ scheme ] || {}
				) ) {
					if ( ! ( key in ( captured[ scheme ] || {} ) ) ) {
						stale.push( `${ scheme } / ${ key }` );
					}
				}
			}
			if ( stale.length ) {
				throw new Error(
					`${ stale.length } snapshot entr(y/ies) were never measured this ` +
						`run — the probe was removed or its selector no longer matches:\n` +
						stale
							.map( ( entry ) => `  • ${ entry }` )
							.join( '\n' ) +
						`\n\nRun UPDATE_SNAPSHOTS=1 npm run test:styles to drop them.`
				);
			}
		}
	} );
} );
