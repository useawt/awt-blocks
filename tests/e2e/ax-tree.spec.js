/**
 * Accessibility-tree snapshot gate.
 *
 * Records, for a curated list of controls on the shared fixture pages, the
 * accessibility subtree Chromium actually computes — role, accessible name,
 * description, value, and the state properties that carry meaning — and diffs
 * it against a committed snapshot.
 *
 * Why this gate exists
 * --------------------
 * Two audit findings got through every other gate in this repo, and both were
 * about what assistive technology is *told* rather than about what is drawn:
 *
 *   • The colour-scheme toggle was named "Light mode / Dark mode" — naming
 *     neither the action nor the state — and announced nothing on first press.
 *     axe accepts any `aria-label`. The computed-style gate reads colours and
 *     sizes. The PHP render snapshots had frozen the bad name as ground truth,
 *     which is the trap worth remembering: a snapshot proves output is
 *     *stable*, never that it is *right*. A human still has to read the diff.
 *
 *   • The Select block announced a wrong item count, because a placeholder
 *     `<option>` that is invisible on screen can still sit in the
 *     accessibility tree and be counted. That count exists NOWHERE in the
 *     HTML — it is computed by the browser — so no gate reading markup or CSS
 *     can see it.
 *
 * The second finding is why this records a *subtree* rather than each control's
 * own name and state. A gate that recorded only the Select element would have
 * missed it; the count lives on the options.
 *
 * What it cannot do
 * -----------------
 * It cannot tell you a name is *good*. It tells you the name changed. The whole
 * value is in reading the diff — regenerating without reading it reproduces
 * exactly the failure described above.
 *
 * Snapshot
 * --------
 * `ax-tree.snap.json`, keyed by colour scheme then `page/probe`. Regenerate a
 * deliberate change with:
 *
 *   UPDATE_SNAPSHOTS=1 npm run test:ax
 *
 * Same env var as the computed-style gate and the 37 PHP render snapshots, on
 * purpose: one snapshot workflow in this repo, not three.
 *
 * Why CDP and not the DOM
 * -----------------------
 * `Accessibility.getFullAXTree` is the browser's own computed tree — the
 * instrument that settled the Select finding when a screen reader could not.
 * Reading attributes instead would be measuring our own input: an
 * `aria-labelledby` that is correctly paired reports as *unnamed* if you read
 * attributes, and reports its real name here. Never verify a name by reading
 * markup.
 *
 * Four traps, all of which would leave this gate green while measuring nothing:
 *
 *   1. The tree is computed lazily. `Accessibility.enable` is sent BEFORE the
 *      first navigation, and every read waits for `readyState`, for
 *      `document.fonts.ready`, and — after an interaction — for animations to
 *      finish. A tree read mid-transition can still hold the old subtree.
 *   2. Chromium marks nodes `ignored`. Filtering them out would hide the exact
 *      regression this gate is for: a control that quietly leaves the tree
 *      would simply vanish from the snapshot and read as "no change". Ignored
 *      nodes are recorded, as `role [ignored: reasons]`.
 *   3. A selector that matches nothing must FAIL, not skip — otherwise a
 *      renamed class deletes coverage while the gate stays green.
 *   4. A run that does not verify which colour scheme it is in can test light
 *      twice. `gotoWithScheme` asserts the resolved scope class, and the
 *      scheme is part of the snapshot's own structure. It matters more here
 *      than it looks: the colour-scheme toggle's pressed state and the
 *      segmented control's selected segment are the two things in this whole
 *      snapshot that legitimately differ between schemes, and they are the
 *      controls the gate was built for.
 *
 * Proved with a negative control, on 2026-08-05
 * ----------------------------------------------
 * A gate nobody has watched fail is a gate nobody should trust. Both defects
 * below were re-introduced on purpose, the gate was required to fail, and the
 * failure was required to NAME the property. Both did.
 *
 *   • The toggle's old name. Restoring `"Light mode / Dark mode"` failed both
 *     toggle probes on the name. Removing `aria-pressed` from render.php did
 *     NOT fail anything at first, and that is worth knowing rather than
 *     glossing: `callbacks.init` in view.js sets the attribute on hydration, so
 *     the server markup is not the only source, and a real regression has to
 *     lose both. With view.js broken too, `pressed=false` vanished from the
 *     recorded line and the gate failed naming it.
 *
 *   • The Select. The brief for this gate predicted a `hidden` placeholder
 *     `<option>` would reproduce the original finding. **It does not.** Neither
 *     `hidden` nor `aria-hidden="true"` changes one character of the subtree —
 *     current Chromium builds a native select's option list from the options
 *     themselves and does not let author ARIA remove one. So that defect cannot
 *     be re-created by adding an attribute, and any negative control written
 *     that way would silently prove nothing. What the gate does catch, verified,
 *     is the option list itself changing: dropping the placeholder failed the
 *     probe with the option lines AND the combobox's announced value
 *     (`value="Choose…"` → `value="Option 1"`), which is the same class of
 *     defect in the shape it can actually take.
 *
 * On widths
 * ---------
 * The axe gate runs every pass at 1280 and at 375, because its outcome depends
 * on geometry. This one runs the probe set at 1280 only, plus one mobile pass
 * over the header — and that is a measurement, not an assumption. Every probe
 * root here was read at both widths and compared: **24 of 25 were byte-identical,
 * and exactly one differed** — `.cds--header__nav`, which at 375px is not merely
 * changed but gone, reported as a single ignored node because the whole nav
 * leaves the tree when it collapses behind the menu button.
 *
 * So the width dimension buys coverage in exactly one place, and it is spent
 * there rather than on duplicating 36 subtrees into four near-identical copies.
 * A snapshot padded with duplicates is not more coverage; it is more diff to
 * re-approve, which is how people learn to approve diffs without reading them —
 * the precise failure that let the toggle's bad name survive in the first place.
 *
 * Re-measure this if the theme gains responsive behaviour beyond the header. The
 * throwaway script that did it is in the session log for 2026-08-05.
 */

const fs = require( 'fs' );
const path = require( 'path' );
const { test, expect } = require( './fixtures' );
const { PAGES } = require( './fixture-pages' );

const SNAPSHOT_PATH = path.join( __dirname, 'ax-tree.snap.json' );
const UPDATING = process.env.UPDATE_SNAPSHOTS === '1';

const SNAPSHOT_NOTE =
	'Accessibility subtrees for a curated control list, per colour scheme, as ' +
	'Chromium computes them. Written by UPDATE_SNAPSHOTS=1 npm run test:ax. A ' +
	'diff means a code change altered what assistive technology is told — read ' +
	'it before regenerating. A stable snapshot is not a correct one.';

const SCHEMES = [ 'light', 'dark' ];

const DESKTOP = { key: 'desktop', width: 1280, height: 800 };
const MOBILE = { key: 'mobile', width: 375, height: 812 };

/**
 * State properties recorded when present, in this order.
 *
 * Every one of these has been wrong somewhere, or is the same shape as something
 * that was.
 *
 * `posInSet` and `setSize` are kept in the list but have never once appeared:
 * a census of every property Chromium reported across a whole page returned
 * twenty-seven names and neither of these was among them. They would need
 * explicit `aria-posinset` / `aria-setsize`, which no AWT block writes. So the
 * "3 of 5" a screen reader counts out is NOT covered by a property here — it is
 * covered by the option lines in the recorded subtree, which is what the
 * negative control actually exercised. They stay listed so that a block which
 * starts declaring them gets them recorded from the first run.
 *
 * What this cannot see: **`aria-current` is not in the tree CDP hands back.**
 * Measured across a whole page — seven `[aria-current]` elements in the DOM, and
 * not one `current` property among the twenty-seven property names Chromium
 * reported. Real screen readers do announce it, so this is a blind spot in the
 * instrument, not a defect in the markup. Two consequences worth knowing:
 * `awt/pagination` survives it because it also writes "Page 2, current page"
 * into the accessible name, which this gate does record; `awt/breadcrumb` marks
 * its current item with the attribute alone, so that marking is covered by the
 * PHP render snapshot (`tests/snapshots/rendered/block-breadcrumb.snap.html`)
 * and NOT by this gate. Do not read a clean breadcrumb subtree here as proof the
 * current page is marked.
 */
const PROPS = [
	'checked',
	'pressed',
	'expanded',
	'selected',
	'disabled',
	'required',
	'invalid',
	'level',
	'posInSet',
	'setSize',
];

/**
 * A subtree bigger than this means the probe root is too broad to read in a
 * diff, which defeats the point. Fail loudly rather than commit a wall of text.
 */
const NODE_CAP = 140;

/**
 * The one role that is dropped rather than recorded.
 *
 * `InlineTextBox` is not a semantic node — it is one *line* of laid-out text, so
 * a `StaticText` splits into several as soon as its text wraps. Nothing about it
 * is heard by anybody: the accessible text is already on the `StaticText` above
 * it. Keeping it would import text shaping into the snapshot, which is the one
 * thing that genuinely differs between a dev Mac and a CI Linux box even with
 * the same font file, and the gate would then fail for reasons nobody cares
 * about. This is not hypothetical: the very first generated snapshot recorded
 * the colour-scheme toggle's label as `InlineTextBox "Dark "` +
 * `InlineTextBox "mode"`, because at 1280px it happened to wrap mid-name.
 *
 * It is the only exception to recording every node, and it is a layout node, not
 * an accessibility one.
 */
const DROPPED_ROLE = 'InlineTextBox';

/* -------------------------------------------------------------------------
 * Probes
 *
 * key   unique within its page; stored as `page/key`.
 * sel   CSS selector for the subtree root. Must match, or the run fails.
 * nth   index when the selector matches several (default 0).
 * depth how many generations below the root to record. Omit for all of them.
 * group 'default' (page as loaded) or a key in GROUP_SETUP.
 * ---------------------------------------------------------------------- */

const PROBES = [
	/* --- Theme chrome. On every page; probed once, on `content`, like the
	   computed-style gate does. --- */
	{
		page: 'content',
		key: 'skip-link',
		sel: '.cds--skip-to-content',
	},
	{
		// The header navigation including its submenu. `awt/header-menu` renders
		// a collapsed disclosure, and a collapsed thing is where names and states
		// go wrong precisely because nothing on screen shows them.
		page: 'content',
		key: 'header-nav (submenu closed)',
		sel: '.cds--header__nav',
	},
	{
		// The kind that shipped the bad name. Icon-only, so its name comes
		// entirely from `aria-label` — there is no visible text to fall back on,
		// which is why a wrong name here is invisible to everything else.
		page: 'content',
		key: 'color-scheme-toggle (icon-only)',
		sel: '.awt-color-scheme-toggle--icon-only',
	},

	/* --- Widgets --- */
	{
		page: 'widgets',
		key: 'accordion (closed)',
		sel: '.cds--accordion',
	},
	{
		page: 'widgets',
		key: 'faq-item (closed)',
		sel: '.awt-faq-item',
	},
	{
		page: 'widgets',
		key: 'tabs',
		sel: '.cds--tabs',
	},
	{
		page: 'widgets',
		key: 'tab-panel (visible)',
		sel: '.cds--tab-content:not([hidden])',
	},
	{
		page: 'widgets',
		key: 'content-switcher',
		sel: '.cds--content-switcher',
	},
	{
		page: 'widgets',
		key: 'modal-opener',
		sel: '.wp-block-awt-modal-opener',
	},
	{
		// Closed. The listbox itself is probed in the `listbox` group below,
		// because it does not exist in the tree until the control is opened.
		page: 'widgets',
		key: 'dropdown (closed)',
		sel: '.cds--dropdown',
	},
	{
		page: 'widgets',
		key: 'menu-button (closed)',
		sel: '.cds--menu-button',
	},
	{
		// Rooted at the BLOCK, not at `.cds--toggletip` — that class is on the
		// popover container, which sits below the visible label, so a probe there
		// records the trigger button and leaves the label out of frame. The label
		// is the whole point: the button's name comes from `ariaLabel` and
		// defaults to "More information", so the question a reviewer needs to be
		// able to ask is whether that generic name matches the specific label
		// beside it. A probe that cannot show both cannot raise the question.
		page: 'widgets',
		key: 'toggletip (closed)',
		sel: '.wp-block-awt-toggletip',
	},
	{
		page: 'widgets',
		key: 'tile (expandable, closed)',
		sel: '.cds--tile--expandable',
	},
	{
		// A selectable tile is a checkbox or a radio drawn as a box, so its entire
		// meaning — role, checked state, and which of how many — lives in this
		// tree and nowhere else.
		//
		// Rooted at the GROUP, not at each tile. The first version of this probe
		// measured the three tiles one at a time, because there was no group
		// element to root at — and that was precisely the defect: each tile said
		// "radio button" while nothing said what the choice was. A per-tile probe
		// can never show a missing wrapper, so it recorded the bug as normal. One
		// probe over the whole group shows the group, its name, and the options
		// together, which is the only view in which "this group has no name" is
		// visible at all.
		page: 'widgets',
		key: 'tile group (selectable, radio)',
		sel: '.cds--tile-group',
	},
	{
		// `:not(--radio)` rather than an index: the grouped tiles also carry
		// `--selectable`, so any nth would silently start pointing at one of them
		// the moment the fixture's order changes.
		page: 'widgets',
		key: 'tile (selectable, standalone)',
		sel: '.cds--tile--selectable:not(.cds--tile--radio)',
	},
	{
		page: 'widgets',
		key: 'color-scheme-toggle (with-label)',
		sel: '.awt-color-scheme-toggle--with-label',
	},
	{
		// Three buttons, exactly one pressed, and which one is pressed depends on
		// the scheme in effect — the one place in this snapshot where the two
		// schemes are supposed to disagree.
		page: 'widgets',
		key: 'color-scheme-toggle (segmented)',
		sel: '.awt-color-scheme-toggle--segmented',
	},

	/* --- Forms --- */
	{
		// The Select finding lives here. The subtree carries the options, and the
		// options carry the count.
		page: 'forms',
		key: 'select (with placeholder)',
		sel: '.cds--select',
	},
	{
		page: 'forms',
		key: 'text-input (required)',
		sel: '.cds--text-input-wrapper',
		nth: 0,
	},
	{
		// `invalid` and `required` appear nowhere else in this snapshot.
		page: 'forms',
		key: 'text-input (invalid)',
		sel: '.cds--text-input-wrapper',
		nth: 1,
	},
	{
		page: 'forms',
		key: 'text-input (disabled)',
		sel: '.cds--text-input-wrapper',
		nth: 6,
	},
	{
		page: 'forms',
		key: 'password-input',
		sel: '.cds--password-input-wrapper',
	},
	{
		page: 'forms',
		key: 'checkbox',
		sel: '.cds--checkbox-wrapper',
		nth: 0,
	},
	{
		// The mixed state. A partially-checked checkbox reports `checked: mixed`
		// and nothing on screen distinguishes that from unchecked to a program
		// reading markup.
		page: 'forms',
		key: 'checkbox (indeterminate)',
		sel: '.cds--checkbox-wrapper',
		nth: 1,
	},
	{
		page: 'forms',
		key: 'radio-button-group',
		sel: '.cds--radio-button-group',
	},
	{
		page: 'forms',
		key: 'toggle',
		sel: '.cds--toggle',
	},

	/* --- Content --- */
	{
		// The current page must be marked as current, and that mark is a tree
		// property, not a class.
		page: 'content',
		key: 'breadcrumb',
		sel: '.cds--breadcrumb',
	},
	{
		page: 'content',
		key: 'pagination',
		sel: '.cds--pagination-nav',
	},
	{
		// A filter tag carries a dismiss button whose only name is an aria-label.
		page: 'content',
		key: 'tag (dismissible)',
		sel: '.cds--tag--filter',
		nth: 0,
	},

	/* --- Opened states. A closed accordion, an unopened modal and a collapsed
	   submenu are exactly where names and states go wrong, and all three are
	   invisible to a resting scan. --- */
	{
		page: 'widgets',
		key: 'accordion (first item open)',
		sel: '.cds--accordion',
		group: 'opened',
	},
	{
		// Rooted at the inner container, not at `#axe-modal`. The outer overlay
		// carries `role="presentation"`, and Chromium drops a presentational node
		// from the serialized tree ALTOGETHER — not even as an ignored node — so
		// probing the overlay reports "no node in the accessibility tree". The
		// container is the dialog, which is the right root anyway.
		page: 'widgets',
		key: 'modal (open)',
		sel: '#axe-modal .cds--modal-container',
		group: 'opened',
	},
	{
		// The listbox and its options only exist once the control is open.
		page: 'widgets',
		key: 'dropdown (open)',
		sel: '.cds--dropdown',
		group: 'listbox',
	},
	{
		page: 'content',
		key: 'header-nav (submenu open)',
		sel: '.cds--header__submenu',
		group: 'submenu',
	},
];

/**
 * Setup per non-default group. Each leaves the page in the state its probes
 * expect, and asserts it got there — a setup that silently failed would record
 * the resting tree and call it the opened one.
 */
const GROUP_SETUP = {
	opened: async ( page ) => {
		const heading = page.locator( '.cds--accordion__heading' ).first();
		await heading.click();
		await expect( heading ).toHaveAttribute( 'aria-expanded', 'true' );

		await page.getByRole( 'button', { name: 'Open the dialog' } ).click();
		const dialog = page.locator( '#axe-modal' );
		await expect( dialog ).toHaveClass( /\bis-visible\b/ );
		// Trap 1: `toBeVisible()` passes at opacity 0, and a tree read while the
		// dialog is still fading can still hold the pre-open subtree.
		await page.waitForFunction( () => {
			const modal = document.querySelector( '#axe-modal' );
			return modal && window.getComputedStyle( modal ).opacity === '1';
		} );
	},
	listbox: async ( page ) => {
		const field = page.locator( '.cds--list-box__field' ).first();
		await field.click();
		await expect( field ).toHaveAttribute( 'aria-expanded', 'true' );
	},
	submenu: async ( page ) => {
		const trigger = page.locator( '.cds--header__menu-title' ).first();
		await trigger.click();
		await expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
	},
};

/** Which page each non-default group runs on. */
const GROUP_PAGE = {
	opened: 'widgets',
	listbox: 'widgets',
	submenu: 'content',
};

/* -------------------------------------------------------------------------
 * Reading the tree
 * ---------------------------------------------------------------------- */

/**
 * Render one AX node as a single line.
 *
 * Trap 2: an ignored node is recorded, not dropped. Its name and description
 * are left off — Chromium fills those in for nodes nobody will ever hear — but
 * the node keeps a line, so a control that falls out of the tree shows up as a
 * changed line instead of quietly disappearing.
 *
 * @param {Object} node  AX node from CDP.
 * @param {number} depth Indent level.
 * @return {string} One line.
 */
function lineFor( node, depth ) {
	const indent = '  '.repeat( depth );
	const role = node.role?.value ?? '(no role)';

	if ( node.ignored ) {
		const why = ( node.ignoredReasons || [] )
			.map( ( reason ) => reason.name )
			.join( ',' );
		return `${ indent }${ role } [ignored${ why ? ': ' + why : '' }]`;
	}

	let line = `${ indent }${ role }`;
	const name = node.name?.value;
	if ( name !== undefined && name !== '' ) {
		line += ` "${ name }"`;
	}
	const description = node.description?.value;
	if ( description !== undefined && description !== '' ) {
		line += ` desc="${ description }"`;
	}
	const value = node.value?.value;
	if ( value !== undefined && value !== '' ) {
		line += ` value="${ value }"`;
	}

	const byName = new Map(
		( node.properties || [] ).map( ( property ) => [
			property.name,
			property.value?.value,
		] )
	);
	for ( const prop of PROPS ) {
		if ( ! byName.has( prop ) ) {
			continue;
		}
		const state = byName.get( prop );
		// `invalid` is the one property recorded only when it is not false.
		// Chromium emits it for every widget role whether or not the author did
		// anything — 168 times on one page, including on plain buttons and links,
		// which have no notion of validity — so `invalid=false` is noise on every
		// line and never carries a signal. `invalid=true` does, and is kept. The
		// other states here are emitted only when the role or the author
		// establishes them, so a `false` among them is real information and
		// dropping it would hide a state property that had been removed
		// altogether.
		if ( prop === 'invalid' && state === false ) {
			continue;
		}
		line += ` ${ prop }=${ state }`;
	}
	return line;
}

/**
 * Walk a subtree into an array of lines.
 *
 * An array of strings rather than nested objects, because the point of a
 * snapshot is that a human reads its diff, and a git diff of indented lines is
 * readable where a diff of nested JSON is not.
 *
 * @param {Map}    byId     nodeId → AX node.
 * @param {string} rootId
 * @param {number} maxDepth
 * @return {string[]} Lines, root first.
 */
function subtreeLines( byId, rootId, maxDepth ) {
	const lines = [];
	const walk = ( id, depth ) => {
		const node = byId.get( id );
		if ( ! node || lines.length > NODE_CAP ) {
			return;
		}
		if ( node.role?.value === DROPPED_ROLE ) {
			return;
		}
		lines.push( lineFor( node, depth ) );
		if ( maxDepth !== undefined && depth >= maxDepth ) {
			return;
		}
		for ( const childId of node.childIds || [] ) {
			walk( childId, depth + 1 );
		}
	};
	walk( rootId, 0 );
	return lines;
}

/**
 * Read the subtree of every probe on a page, in one pass over the AX tree.
 *
 * @param {import('@playwright/test').CDPSession} cdp
 * @param {Object[]}                              probes
 * @return {Object} `probe.key` → lines, or `{ error }` per probe.
 */
async function readSubtrees( cdp, probes ) {
	const { nodes } = await cdp.send( 'Accessibility.getFullAXTree' );
	const byId = new Map( nodes.map( ( node ) => [ node.nodeId, node ] ) );
	const byBackendId = new Map();
	for ( const node of nodes ) {
		// A DOM node can map to several AX nodes; the first is the element's own.
		if (
			node.backendDOMNodeId !== undefined &&
			! byBackendId.has( node.backendDOMNodeId )
		) {
			byBackendId.set( node.backendDOMNodeId, node.nodeId );
		}
	}

	const { root } = await cdp.send( 'DOM.getDocument', { depth: 1 } );
	const out = {};

	for ( const probe of probes ) {
		const { nodeIds } = await cdp.send( 'DOM.querySelectorAll', {
			nodeId: root.nodeId,
			selector: probe.sel,
		} );
		const wanted = probe.nth || 0;
		// Trap 3: no match is a failure, not a skip.
		if ( nodeIds.length <= wanted ) {
			out[ probe.key ] = {
				error:
					`selector "${ probe.sel }" matched ${ nodeIds.length } ` +
					`element(s), needed index ${ wanted }`,
			};
			continue;
		}
		const { node } = await cdp.send( 'DOM.describeNode', {
			nodeId: nodeIds[ wanted ],
		} );
		const axId = byBackendId.get( node.backendNodeId );
		if ( axId === undefined ) {
			// Not a skip either: an element with no AX node at all is a finding.
			out[ probe.key ] = {
				error:
					`"${ probe.sel }" has no node in the accessibility tree — it ` +
					`may have been removed from it entirely`,
			};
			continue;
		}
		const lines = subtreeLines( byId, axId, probe.depth );
		if ( lines.length > NODE_CAP ) {
			out[ probe.key ] = {
				error:
					`subtree of "${ probe.sel }" exceeds ${ NODE_CAP } nodes — ` +
					`narrow the selector or set a depth`,
			};
			continue;
		}
		out[ probe.key ] = lines;
	}

	return out;
}

/* -------------------------------------------------------------------------
 * Snapshot handling
 * ---------------------------------------------------------------------- */

function loadSnapshot() {
	if ( ! fs.existsSync( SNAPSHOT_PATH ) ) {
		return { tree: {} };
	}
	return JSON.parse( fs.readFileSync( SNAPSHOT_PATH, 'utf8' ) );
}

const committed = loadSnapshot();

// Workers are pinned to 1 in playwright.config, so a module-level accumulator
// is safe. afterAll needs every run's results to write, or to notice staleness.
const captured = {};
const completedRuns = new Set();

/**
 * Diff two line arrays into something readable.
 *
 * @param {string[]} expected
 * @param {string[]} actual
 * @return {string[]} Lines describing the difference.
 */
function diffLines( expected, actual ) {
	const before = expected || [];
	const after = actual || [];
	const out = [];
	for ( let i = 0; i < Math.max( before.length, after.length ); i++ ) {
		if ( before[ i ] !== after[ i ] ) {
			if ( before[ i ] !== undefined ) {
				out.push( `      - ${ before[ i ] }` );
			}
			if ( after[ i ] !== undefined ) {
				out.push( `      + ${ after[ i ] }` );
			}
		}
	}
	return out;
}

/**
 * Compare a run's subtrees with the snapshot and fail on any difference.
 *
 * @param {string} run     Run key.
 * @param {string} scheme  Colour scheme.
 * @param {Object} results `page/probe` → lines or `{ error }`.
 */
function assertAgainstSnapshot( run, scheme, results ) {
	completedRuns.add( run );

	const errors = Object.entries( results )
		.filter( ( [ , value ] ) => value && value.error )
		.map( ( [ key, value ] ) => `  • ${ key }: ${ value.error }` );
	// Reported before the diff, and never written to the snapshot: an error is a
	// probe that measured nothing, and recording it would enshrine the gap.
	expect(
		errors.length,
		errors.length
			? `${ errors.length } probe(s) could not be read on "${ run }":\n` +
					errors.join( '\n' )
			: ''
	).toBe( 0 );

	captured[ scheme ] = { ...( captured[ scheme ] || {} ), ...results };

	if ( UPDATING ) {
		return;
	}

	const expected = committed.tree?.[ scheme ] || {};
	const problems = [];

	for ( const [ key, lines ] of Object.entries( results ) ) {
		if ( ! ( key in expected ) ) {
			problems.push(
				`  • ${ key } — no committed subtree for this probe in ${ scheme }`
			);
			continue;
		}
		const diff = diffLines( expected[ key ], lines );
		if ( diff.length ) {
			problems.push( `  • ${ key }\n${ diff.join( '\n' ) }` );
		}
	}

	expect(
		problems.length,
		problems.length
			? `${ problems.length } accessibility-tree difference(s) on "${ run }":\n` +
					`${ problems.join( '\n' ) }\n\n` +
					`This is what a screen reader is told. Read the diff and decide ` +
					`whether the new text is RIGHT — not merely different. If it is, ` +
					`regenerate with UPDATE_SNAPSHOTS=1 npm run test:ax.`
			: ''
	).toBe( 0 );
}

/* -------------------------------------------------------------------------
 * Page helpers
 * ---------------------------------------------------------------------- */

/**
 * Open a CDP session with accessibility switched on before anything loads.
 *
 * Trap 1: the tree is computed lazily, and enabling the domain after a page has
 * settled can hand back a tree that is still filling in.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Promise<import('@playwright/test').CDPSession>} Session.
 */
async function openCdp( page ) {
	const cdp = await page.context().newCDPSession( page );
	await cdp.send( 'DOM.enable' );
	await cdp.send( 'Accessibility.enable' );
	return cdp;
}

/**
 * Navigate with a colour scheme that is actually in effect, and wait until the
 * tree is readable.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          url
 * @param {string}                          scheme   'light' or 'dark'.
 * @param {string}                          baseURL
 * @param {Object}                          viewport DESKTOP or MOBILE.
 */
async function gotoWithScheme( page, url, scheme, baseURL, viewport ) {
	await page.setViewportSize( {
		width: viewport.width,
		height: viewport.height,
	} );
	await page.emulateMedia( { colorScheme: scheme } );
	await page
		.context()
		.addCookies( [
			{ name: 'awt_color_scheme', value: scheme, url: baseURL },
		] );

	await page.goto( url );
	await page.waitForFunction( () => document.readyState === 'complete' );
	// Not for metrics — for hydration. The interactivity runtime reconciles
	// `aria-pressed` on the colour-scheme toggle after first paint, and a tree
	// read before that records the server's guess instead of the real state.
	await page.evaluate( () => document.fonts.ready );

	const state = await page.evaluate( () => ( {
		html: document.documentElement.getAttribute( 'data-awt-color-scheme' ),
		body: document.body.className,
	} ) );

	// Trap 4.
	expect( state.html, `<html data-awt-color-scheme> for ${ scheme }` ).toBe(
		scheme
	);
	const expectedScope =
		scheme === 'dark' ? /\bcds--(g90|g100)\b/ : /\bcds--(white|g10)\b/;
	expect(
		state.body,
		`<body> scope class for ${ scheme } (got "${ state.body }")`
	).toMatch( expectedScope );
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

/**
 * @param {Object} results Raw `probe.key` → lines.
 * @param {string} pageKey
 * @return {Object} Same, keyed `page/probe`.
 */
function keyed( results, pageKey ) {
	return Object.fromEntries(
		Object.entries( results ).map( ( [ key, value ] ) => [
			`${ pageKey }/${ key }`,
			value,
		] )
	);
}

/* -------------------------------------------------------------------------
 * Tests
 * ---------------------------------------------------------------------- */

test.describe( 'Accessibility-tree snapshots', () => {
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
				const cdp = await openCdp( page );
				await gotoWithScheme(
					page,
					`/?page_id=${ pageIds[ fixture.key ] }`,
					scheme,
					baseURL,
					DESKTOP
				);
				const results = await readSubtrees(
					cdp,
					probesFor( fixture.key, 'default' )
				);
				assertAgainstSnapshot(
					`${ fixture.key }|${ scheme }|default`,
					scheme,
					keyed( results, fixture.key )
				);
			} );
		}
	}

	for ( const group of [ 'opened', 'listbox', 'submenu' ] ) {
		const pageKey = GROUP_PAGE[ group ];
		for ( const scheme of SCHEMES ) {
			// eslint-disable-next-line playwright/expect-expect
			test( `${ pageKey }, ${ group } — ${ scheme }`, async ( {
				page,
				baseURL,
			} ) => {
				const cdp = await openCdp( page );
				await gotoWithScheme(
					page,
					`/?page_id=${ pageIds[ pageKey ] }`,
					scheme,
					baseURL,
					DESKTOP
				);
				await GROUP_SETUP[ group ]( page );
				const results = await readSubtrees(
					cdp,
					probesFor( pageKey, group )
				);
				assertAgainstSnapshot(
					`${ pageKey }|${ scheme }|${ group }`,
					scheme,
					keyed( results, pageKey )
				);
			} );
		}
	}

	/*
	 * Mobile only: the header navigation behind its menu button.
	 *
	 * At 1280 the nav is laid out in the header bar and the `content` pass above
	 * already records it. Below Carbon's breakpoint it collapses behind a menu
	 * button that does not exist at desktop width at all, and the nav's contents
	 * leave the tree the way a closed accordion's do. This is the one place the
	 * computed tree genuinely differs by width, so it is the one place width is
	 * spent.
	 */
	for ( const scheme of SCHEMES ) {
		test( `header nav opened — ${ scheme }, mobile`, async ( {
			page,
			baseURL,
		} ) => {
			const cdp = await openCdp( page );
			await gotoWithScheme(
				page,
				`/?page_id=${ pageIds.content }`,
				scheme,
				baseURL,
				MOBILE
			);

			const trigger = page.locator( '.cds--header__menu-trigger' );
			// If the theme ever stops collapsing the nav this must fail, rather
			// than quietly record a desktop tree under a mobile key.
			await expect(
				trigger,
				'the header menu button should be visible at 375px'
			).toBeVisible();
			await trigger.click();
			await expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );

			const results = await readSubtrees( cdp, [
				{
					key: 'header-menu-trigger (mobile, open)',
					sel: '.cds--header__menu-trigger',
				},
				{
					key: 'header-nav (mobile, revealed)',
					sel: '.cds--header__nav',
				},
			] );
			assertAgainstSnapshot(
				`content|${ scheme }|nav-open|mobile`,
				scheme,
				keyed( results, 'content-mobile' )
			);
		} );
	}

	test.afterAll( () => {
		const expectedRuns =
			PAGES.length * SCHEMES.length +
			3 * SCHEMES.length /* opened, listbox, submenu */ +
			SCHEMES.length; /* header nav, mobile only */

		if ( UPDATING ) {
			if ( completedRuns.size !== expectedRuns ) {
				throw new Error(
					`Refusing to write a partial snapshot: ${ completedRuns.size } of ` +
						`${ expectedRuns } runs completed. Fix the failing run first — a ` +
						`snapshot missing half its probes looks green forever.`
				);
			}
			const tree = {};
			for ( const scheme of SCHEMES ) {
				tree[ scheme ] = Object.fromEntries(
					Object.entries( captured[ scheme ] || {} ).sort(
						( [ a ], [ b ] ) => a.localeCompare( b )
					)
				);
			}
			fs.writeFileSync(
				SNAPSHOT_PATH,
				JSON.stringify(
					{ $note: committed.$note || SNAPSHOT_NOTE, tree },
					null,
					'\t'
				) + '\n'
			);
			// eslint-disable-next-line no-console
			console.log(
				`\nWrote ${ Object.keys( tree.light ).length } subtrees × ` +
					`${ SCHEMES.length } schemes to ax-tree.snap.json. Read every ` +
					`name in the diff and ask whether it is right, not whether it ` +
					`is stable.\n`
			);
			return;
		}

		// A snapshot listing probes that no longer run is one nobody can trust —
		// most likely a selector was renamed and its coverage vanished. Only
		// check once every run reported, so a failing run does not also produce a
		// misleading staleness error.
		if ( completedRuns.size === expectedRuns ) {
			const stale = [];
			for ( const scheme of SCHEMES ) {
				for ( const key of Object.keys(
					committed.tree?.[ scheme ] || {}
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
						`\n\nRun UPDATE_SNAPSHOTS=1 npm run test:ax to drop them.`
				);
			}
		}
	} );
} );
