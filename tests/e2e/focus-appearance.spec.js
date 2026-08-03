/**
 * Focus-appearance gate.
 *
 * Tabs through the shared fixture pages in BOTH color schemes and, at every
 * stop, measures how thick the focus indicator actually is. Anything under
 * MIN_THICKNESS fails, and so does anything with no indicator at all.
 *
 * What this gate is for
 * ---------------------
 * The other two gates cannot see this. axe accepts any focus style, including
 * none. The computed-style snapshot records a handful of hand-picked focus
 * probes, so it freezes the ones somebody thought to list and says nothing
 * about the rest — and nothing at all about a component added later. This gate
 * is the coverage mechanism instead of a list: it walks the tab ring, so a new
 * block that arrives with Carbon's 1px ring fails on its first run without
 * anyone adding a probe for it.
 *
 * That matters because the 1px rings were never one bug. They are Carbon's
 * design (`focus-outline()` emits `outline: 1px solid $focus`), so every
 * component inherits them and every Carbon upgrade can bring them back. See
 * "Differences from Carbon" D1 to D4 in the Stage 1 spec.
 *
 * How thickness is measured: a radial profile, not a property
 * ----------------------------------------------------------
 * Reading `outline-width` is not enough, because Carbon draws focus indicators
 * four different ways — an outline, an inset `box-shadow` ring, a `border-color`
 * change against a reserved transparent border, and a pseudo-element on a
 * related node (checkbox, radio, toggle). A button gets two of them at once,
 * and they stack: `border-color: $focus` plus `inset 0 0 0 Npx $focus` plus
 * `inset 0 0 0 (N+1)px $background` is one contiguous ring made of two
 * mechanisms, and no single property tells you how wide it is.
 *
 * So instead of reading properties, this gate samples the element's cross
 * section. For each candidate node it resolves the color a person would see at
 * every half-pixel from 6px outside the border box to 8px inside, honoring
 * paint order (outline over border over inset shadows over background), once
 * with the element at rest and once with it focused. The focus indicator is
 * then the longest unbroken run of half-pixels whose color CHANGED — which is
 * exactly what WCAG 2.4.13 asks about, and which counts a border+shadow ring as
 * the 2px it visually is.
 *
 * The same profile gives the other half of 2.4.13 for free: the contrast
 * between each changed pixel's focused and unfocused color. A 2px ring drawn in
 * a color you cannot tell from the one underneath is not an indicator, and that
 * is not a hypothetical — it is what Carbon's primary button does, where the
 * focus ring is the same blue as the button fill.
 *
 * Traps
 * -----
 * The computed-style gate's five traps all apply; these are the ones specific
 * to measuring focus, and each produced a confidently wrong number before the
 * figures in the spec held up.
 *
 *   1. Carbon ANIMATES the focus ring. A style read straight after focusing is
 *      the interpolated start value — transparent, 0px — so every control looks
 *      unstyled. Every reading here waits for the element's animations to
 *      finish.
 *   2. Carbon keeps a PERMANENT transparent ring on some components: buttons
 *      carry `border: 1px solid transparent` at rest purely to reserve space.
 *      A probe that diffs outline or border *width* sees no change and reports
 *      "no focus indicator" on a component that is fine. Diffing color at a
 *      depth, as this gate does, is immune.
 *   3. `:focus` does not match when the window is not focused, while
 *      `document.activeElement` still points at the element — so the probe
 *      looks healthy and every style it reads is the resting one. Asserted
 *      per stop.
 *   4. Focus modality decides `:focus-visible`. This gate uses real Tab
 *      presses, so modality is genuine rather than something to simulate.
 *   5. A tab ring is not a static list. Walking it with real Tab presses also
 *      means the gate covers whatever the page actually exposes, including
 *      controls a block adds at runtime.
 *   6. A ring declared outside the element may never be painted. The
 *      expandable tile is `overflow: hidden`, so a ring 1px outside its
 *      `<summary>` was clipped on three of four sides while every computed
 *      value read a healthy 2px. Depths beyond the nearest clipping ancestor
 *      are dropped before anything is counted — which is what turned that
 *      into a failure instead of a pass.
 *
 * Failures print the profile, so a failure says which mechanism drew what and
 * how wide it came out, rather than just a number.
 */

const { test, expect } = require( './fixtures' );
const { PAGES } = require( './fixture-pages' );

/** CSS px. The bar in "Differences from Carbon" D1 to D4. */
const MIN_THICKNESS = 2;

/** WCAG 2.4.13: the changed pixels must differ from their resting color. */
const MIN_CONTRAST = 3;

const SCHEMES = [ 'light', 'dark' ];

/** Stop tabbing eventually even if the ring never closes. */
const TAB_CAP = 300;

/** Set REPORT_FOCUS=1 to print every measurement instead of only failures. */
const REPORTING = process.env.REPORT_FOCUS === '1';

/* -------------------------------------------------------------------------
 * Where the indicator lives when it is not on the focused element
 *
 * Checkbox, radio and toggle inputs are visually hidden by design — Carbon
 * draws the control as a pseudo-element on a sibling label, and that is where
 * the focus ring goes. Measuring only the focused element would report "no
 * indicator" for all three, so each entry names the node to measure as well:
 * `el.closest(scope).querySelector(target)`.
 *
 * Keep this list short and justified. An entry here is a claim that the
 * indicator is deliberately drawn elsewhere, not a way to quiet a failure.
 * ---------------------------------------------------------------------- */
const INDICATOR_ELSEWHERE = [
	{
		when: 'input.cds--checkbox',
		scope: '.cds--checkbox-wrapper, .cds--form-item',
		target: '.cds--checkbox-label',
	},
	{
		when: 'input.cds--radio-button',
		scope: '.cds--radio-button-wrapper',
		target: '.cds--radio-button__appearance',
	},
	{
		when: '.cds--toggle__button',
		scope: '.cds--toggle',
		target: '.cds--toggle__switch',
	},
];

/* -------------------------------------------------------------------------
 * In-page measurement
 * ---------------------------------------------------------------------- */

/**
 * Resolve the color visible at each depth through an element's edge.
 *
 * Runs in the browser; serialized, so it must be self-contained.
 *
 * @param {Object} input `{ path, extras }`.
 * @return {Object} `{ nodes: [ { key, samples } ] }` or `{ error }`.
 */
/* eslint-disable jsdoc/require-jsdoc */
function measureBands( input ) {
	const OUTSIDE = -6;
	const INSIDE = 8;
	const STEP = 0.5;

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

	const rgb = ( c ) =>
		`rgb(${ Math.round( c.r ) }, ${ Math.round( c.g ) }, ${ Math.round(
			c.b
		) })`;

	// The opaque color behind a node: the nearest ancestor chain of
	// non-transparent layers, composited. White is the page's own floor.
	const solidBehind = ( node ) => {
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

	// Split a computed `box-shadow` on top-level commas only — the color
	// functions inside it contain commas of their own.
	const splitTop = ( value ) => {
		const parts = [];
		let depth = 0;
		let current = '';
		for ( const ch of value ) {
			if ( ch === '(' ) {
				depth += 1;
			} else if ( ch === ')' ) {
				depth -= 1;
			}
			if ( ch === ',' && depth === 0 ) {
				parts.push( current );
				current = '';
			} else {
				current += ch;
			}
		}
		if ( current.trim() ) {
			parts.push( current );
		}
		return parts.map( ( p ) => p.trim() ).filter( Boolean );
	};

	const insetRings = ( value ) => {
		if ( ! value || value === 'none' ) {
			return [];
		}
		return splitTop( value )
			.filter( ( part ) => /\binset\b/.test( part ) )
			.map( ( part ) => {
				const color = parseColor(
					( part.match( /(rgba?\([^)]*\))/ ) || [] )[ 1 ] || ''
				);
				const nums = ( part.match( /-?[\d.]+px/g ) || [] ).map(
					parseFloat
				);
				return {
					color,
					offsetX: nums[ 0 ] || 0,
					offsetY: nums[ 1 ] || 0,
					blur: nums[ 2 ] || 0,
					spread: nums[ 3 ] || 0,
				};
			} )
			.filter( ( s ) => s.color && s.color.a > 0 );
	};

	// Bands through one node's edge, as painted: outline over border over inset
	// shadows over background. `d` is depth in CSS px, positive inward from the
	// border-box edge.
	const samplesFor = ( node, style ) => {
		const behind = solidBehind( node.parentElement || node );
		const own = parseColor( style.backgroundColor );
		const fill = own && own.a > 0 ? over( own, behind ) : behind;

		const layers = [];

		// Outline. `outline-offset` is measured outward from the border box, so
		// a negative offset (Carbon's usual -2px) draws the ring INSIDE the
		// element, over the border and the fill.
		const outlineWidth = parseFloat( style.outlineWidth ) || 0;
		const outlineOffset = parseFloat( style.outlineOffset ) || 0;
		const outlineColor = parseColor( style.outlineColor );
		if (
			outlineWidth > 0 &&
			style.outlineStyle !== 'none' &&
			outlineColor &&
			outlineColor.a > 0
		) {
			layers.push( {
				from: -( outlineOffset + outlineWidth ),
				to: -outlineOffset,
				color: over( outlineColor, outlineOffset < 0 ? fill : behind ),
				z: 4,
			} );
		}

		// Border. `background-clip` defaults to border-box, so a transparent
		// border shows the element's own fill, not the page. That is trap 2:
		// Carbon reserves a 1px transparent border on every button.
		const borderWidth = parseFloat( style.borderTopWidth ) || 0;
		if ( borderWidth > 0 && style.borderTopStyle !== 'none' ) {
			const borderColor = parseColor( style.borderTopColor );
			layers.push( {
				from: 0,
				to: borderWidth,
				color:
					borderColor && borderColor.a > 0
						? over( borderColor, fill )
						: fill,
				z: 3,
			} );
		}

		// Inset shadows, measured inward from the PADDING box. The first
		// shadow in the list paints on top of the later ones, so a ring is
		// visible from where the previous one stopped to its own spread. That
		// holds whichever order they are listed in.
		let covered = 0;
		for ( const ring of insetRings( style.boxShadow ) ) {
			if ( ring.spread <= covered ) {
				continue;
			}
			// A ring with an offset or a blur is a drop shadow, not an edge; it
			// has no single thickness, so record it at its spread and let the
			// profile show it.
			layers.push( {
				from: borderWidth + covered,
				to: borderWidth + ring.spread,
				color: over( ring.color, fill ),
				z: 2,
			} );
			covered = ring.spread;
		}

		const samples = [];
		for ( let d = OUTSIDE; d < INSIDE; d += STEP ) {
			const mid = d + STEP / 2;
			const hits = layers
				.filter( ( l ) => mid >= l.from && mid < l.to )
				.sort( ( a, b ) => b.z - a.z );
			// No layer at this depth: outside the box you see the page, inside
			// it you see the element's own fill.
			const bare = mid < 0 ? behind : fill;
			const color = hits.length ? hits[ 0 ].color : bare;
			samples.push( { d, color: rgb( color ) } );
		}
		return samples;
	};

	// How far outside its own box an element's ring can be drawn before an
	// ancestor cuts it off. A ring drawn beyond this is in the CSS and not on
	// the screen — the expandable tile is `overflow: hidden`, so a ring 1px
	// outside its `<summary>` was clipped on three sides while every computed
	// value said 2px. Depths past this point are dropped rather than counted.
	//
	// `overflow` only. A `clip-path` cannot be resolved to a distance without
	// evaluating the shape, so a clip-path'd ancestor is not detected here.
	const outwardRoom = ( node ) => {
		const rect = node.getBoundingClientRect();
		let room = 64;
		let parent = node.parentElement;
		while ( parent ) {
			const style = window.getComputedStyle( parent );
			if ( style.overflow !== 'visible' ) {
				const box = parent.getBoundingClientRect();
				room = Math.min(
					room,
					rect.top - box.top,
					box.bottom - rect.bottom,
					rect.left - box.left,
					box.right - rect.right
				);
			}
			parent = parent.parentElement;
		}
		return Math.max( 0, room );
	};

	const el = document.querySelector( input.path );
	if ( ! el ) {
		return { error: `path matched no element: ${ input.path }` };
	}

	const targets = [ { key: 'self', node: el } ];
	for ( const spec of input.extras ) {
		if ( ! el.matches( spec.when ) ) {
			continue;
		}
		const scope = el.closest( spec.scope );
		const node = scope && scope.querySelector( spec.target );
		if ( node ) {
			targets.push( { key: spec.target, node } );
		}
	}

	// A pseudo-element that is not painted, or that declares a ring it does not
	// paint. Both happen constantly in Carbon: the toggle's ring lives on
	// `.cds--toggle__switch::after`, which has no `content` at all until the
	// input is focused, and several others are collapsed with
	// `transform: scaleY(0)` or `opacity: 0` and expand on a state change.
	//
	// Skipping those is what a first version did, and it silently deleted the
	// coverage: with no resting entry for the key there was nothing to diff
	// against, so a toggle with a perfectly good 2px ring measured 0px. Falling
	// back to the HOST element's own profile is what makes the two states
	// comparable — a pseudo appearing on focus then reads as the change it is.
	const unpainted = ( style ) => {
		if (
			style.content === 'none' ||
			style.content === 'normal' ||
			parseFloat( style.opacity ) === 0
		) {
			return true;
		}
		const parts = ( style.transform || '' ).match( /-?[\d.e-]+/g );
		if ( style.transform.startsWith( 'matrix' ) && parts ) {
			return (
				parseFloat( parts[ 0 ] ) === 0 || parseFloat( parts[ 3 ] ) === 0
			);
		}
		return false;
	};

	const nodes = [];
	for ( const target of targets ) {
		for ( const pseudo of [ null, '::before', '::after' ] ) {
			let style = window.getComputedStyle( target.node, pseudo );
			if ( pseudo && unpainted( style ) ) {
				style = window.getComputedStyle( target.node, null );
			}
			nodes.push( {
				key: target.key + ( pseudo || '' ),
				outward: outwardRoom( target.node ),
				samples: samplesFor( target.node, style ),
			} );
		}
	}

	return { nodes, step: STEP };
}

/**
 * Describe whatever is focused right now, with a path stable enough to
 * re-measure it later.
 *
 * @return {Object} `{ path, label, focusMatches, … }`, or null if focus left
 *                  the document.
 */
function describeActive() {
	// Serialized into the page under test, where the global document is the
	// right one and there is no node ref to reach for.
	// eslint-disable-next-line @wordpress/no-global-active-element
	const el = document.activeElement;
	if ( ! el || el === document.body || el === document.documentElement ) {
		return null;
	}

	const path = ( () => {
		const parts = [];
		let node = el;
		while ( node && node.nodeType === 1 && node.parentElement ) {
			const index =
				Array.prototype.indexOf.call(
					node.parentElement.children,
					node
				) + 1;
			parts.unshift( `${ node.localName }:nth-child(${ index })` );
			node = node.parentElement;
		}
		return parts.length ? `html > ${ parts.join( ' > ' ) }` : 'html';
	} )();

	const name = (
		el.getAttribute( 'aria-label' ) ||
		el.textContent ||
		el.getAttribute( 'title' ) ||
		el.value ||
		''
	)
		.replace( /\s+/g, ' ' )
		.trim()
		.slice( 0, 40 );

	const classes = ( el.getAttribute( 'class' ) || '' )
		.split( /\s+/ )
		.filter( ( c ) => c.startsWith( 'cds--' ) || c.startsWith( 'awt-' ) )
		.slice( 0, 2 )
		.join( '.' );

	return {
		path,
		label: `${ el.localName }${ classes ? '.' + classes : '' }${
			name ? ` "${ name }"` : ''
		}`,
		focusMatches: el.matches( ':focus' ),
		focusVisibleMatches: el.matches( ':focus-visible' ),
		windowHasFocus: document.hasFocus(),
	};
}
/* eslint-enable jsdoc/require-jsdoc */

/* -------------------------------------------------------------------------
 * Node-side analysis
 * ---------------------------------------------------------------------- */

/**
 * Relative luminance of an `rgb(r, g, b)` string.
 *
 * @param {string} value
 * @return {number} Relative luminance, 0 to 1.
 */
function luminance( value ) {
	const [ r, g, b ] = value.match( /[\d.]+/g ).map( Number );
	const channel = ( raw ) => {
		const c = raw / 255;
		return c <= 0.03928
			? c / 12.92
			: Math.pow( ( c + 0.055 ) / 1.055, 2.4 );
	};
	return (
		0.2126 * channel( r ) + 0.7152 * channel( g ) + 0.0722 * channel( b )
	);
}

/**
 * @param {string} a
 * @param {string} b
 * @return {number} WCAG contrast ratio.
 */
function contrast( a, b ) {
	const la = luminance( a );
	const lb = luminance( b );
	return ( Math.max( la, lb ) + 0.05 ) / ( Math.min( la, lb ) + 0.05 );
}

/**
 * The focus indicator for one node: the longest unbroken run of depths that
 * both CHANGED and changed *visibly*.
 *
 * Both halves of WCAG 2.4.13 are folded into the one measurement on purpose. A
 * pixel that changed from `#f4f4f4` to `#ffffff` is a change nobody can see, so
 * counting it toward thickness and then checking contrast separately would let
 * a 2px invisible ring pass the thickness test and fail the contrast test with
 * a confusing message — or worse, let an invisible outer ring and a visible
 * inner one add up to a number neither of them earns. Requiring MIN_CONTRAST
 * per pixel before it counts at all means "thickness" always means thickness of
 * indicator a person can actually see.
 *
 * @param {Object[]} resting
 * @param {Object[]} focused
 * @param {number}   step
 * @param {number}   outward Visible space outside the element's box, in px.
 * @return {Object} `{ thickness, contrast, from, to }`.
 */
function indicatorFor( resting, focused, step, outward ) {
	let best = { thickness: 0, contrast: 0, from: null, to: null };
	let run = null;

	const close = () => {
		if ( ! run ) {
			return;
		}
		const thickness = Math.round( run.count * step * 100 ) / 100;
		if (
			thickness > best.thickness ||
			( thickness === best.thickness && run.contrast > best.contrast )
		) {
			best = {
				thickness,
				contrast: Math.round( run.contrast * 100 ) / 100,
				from: run.from,
				to: run.from + thickness,
			};
		}
		run = null;
	};

	for ( let i = 0; i < focused.length; i++ ) {
		const before = resting[ i ] ? resting[ i ].color : null;
		const after = focused[ i ].color;
		// Clipped by an ancestor: whatever is declared here is never painted.
		const clipped = focused[ i ].d < -outward;
		const ratio =
			! clipped && before && before !== after
				? contrast( before, after )
				: 0;
		if ( ratio >= MIN_CONTRAST ) {
			if ( ! run ) {
				run = { from: focused[ i ].d, count: 0, contrast: ratio };
			}
			run.count += 1;
			run.contrast = Math.min( run.contrast, ratio );
		} else {
			close();
		}
	}
	close();

	return best;
}

/**
 * @param {Object} measurement  Result of measureBands().
 * @param {Object} restingByKey
 * @return {Object} Best indicator across the node's own box and its pseudos.
 */
function bestIndicator( measurement, restingByKey ) {
	let best = { thickness: 0, contrast: 0, key: null };
	for ( const node of measurement.nodes ) {
		const resting = restingByKey[ node.key ];
		if ( ! resting ) {
			continue;
		}
		const found = indicatorFor(
			resting,
			node.samples,
			measurement.step,
			node.outward
		);
		if (
			found.thickness > best.thickness ||
			( found.thickness === best.thickness &&
				found.contrast > best.contrast )
		) {
			best = { ...found, key: node.key };
		}
	}
	return best;
}

/**
 * Print a node's cross section as a run-length list, for failure messages.
 *
 * @param {Object[]} resting
 * @param {Object[]} focused
 * @return {string} One line per band, starred where the color changed.
 */
function describeProfile( resting, focused ) {
	const rows = [];
	for ( let i = 0; i < focused.length; i++ ) {
		const before = resting[ i ] ? resting[ i ].color : '?';
		const after = focused[ i ].color;
		const last = rows[ rows.length - 1 ];
		if ( last && last.before === before && last.after === after ) {
			last.to = focused[ i ].d + 0.5;
			continue;
		}
		rows.push( {
			from: focused[ i ].d,
			to: focused[ i ].d + 0.5,
			before,
			after,
		} );
	}
	return rows
		.map(
			( row ) =>
				`    ${ String( row.from ).padStart( 5 ) } to ${ String(
					row.to
				).padStart( 5 ) }px  ${
					row.before === row.after ? ' ' : '*'
				} ${ row.before } -> ${ row.after }`
		)
		.join( '\n' );
}

/* -------------------------------------------------------------------------
 * Page driving
 * ---------------------------------------------------------------------- */

/**
 * @param {import('@playwright/test').Page} page
 * @param {string}                          url
 * @param {string}                          scheme
 * @param {string}                          baseURL
 */
async function gotoWithScheme( page, url, scheme, baseURL ) {
	await page.emulateMedia( { colorScheme: scheme } );
	await page
		.context()
		.addCookies( [
			{ name: 'awt_color_scheme', value: scheme, url: baseURL },
		] );
	await page.goto( url );
	await page.waitForFunction( () => document.readyState === 'complete' );
	await page.evaluate( () => document.fonts.ready );

	const resolved = await page.evaluate( () =>
		document.documentElement.getAttribute( 'data-awt-color-scheme' )
	);
	expect( resolved, `<html data-awt-color-scheme> for ${ scheme }` ).toBe(
		scheme
	);
}

/**
 * Wait out the focus transition on whatever is focused now.
 *
 * Trap 1: Carbon fades the ring in over 70 to 110ms, so a value read straight
 * after the Tab press is a blended frame rather than a style.
 *
 * @param {import('@playwright/test').Page} page
 */
async function settleActive( page ) {
	await page.evaluate( async () => {
		// This body is serialized into the page under test, where the global
		// document is the right one.
		// eslint-disable-next-line @wordpress/no-global-active-element
		const el = document.activeElement;
		if ( ! el || ! el.getAnimations ) {
			return;
		}
		const running = el
			.getAnimations( { subtree: true } )
			.filter( ( a ) => a.playState === 'running' )
			.map( ( a ) => a.finished.catch( () => {} ) );
		await Promise.race( [
			Promise.all( running ),
			new Promise( ( resolve ) => setTimeout( resolve, 1000 ) ),
		] );
	} );
	// Ancestors and siblings animate too (a label's ::before, a wrapper's
	// background), and those are not in the active element's subtree, so there
	// is no element to wait on — the wait is the point.
	// eslint-disable-next-line playwright/no-wait-for-timeout
	await page.waitForTimeout( 150 );
}

/**
 * Tab through a page, measuring the focus indicator at every stop.
 *
 * @param {import('@playwright/test').Page} page
 * @return {Object[]} One entry per tab stop.
 */
async function walkTabRing( page ) {
	// Start from the very top of the document, not from wherever the load left
	// focus, so the walk covers the whole ring.
	await page.mouse.move( -50, -50 );
	await page.evaluate( () => {
		// eslint-disable-next-line @wordpress/no-global-active-element
		document.activeElement?.blur();
		window.scrollTo( 0, 0 );
	} );

	const stops = [];
	const seen = new Set();

	for ( let i = 0; i < TAB_CAP; i++ ) {
		await page.keyboard.press( 'Tab' );
		const active = await page.evaluate( describeActive );
		if ( ! active ) {
			break;
		}
		if ( seen.has( active.path ) ) {
			break;
		}
		seen.add( active.path );

		await settleActive( page );
		const focused = await page.evaluate( measureBands, {
			path: active.path,
			extras: INDICATOR_ELSEWHERE,
		} );
		stops.push( { ...active, focused } );
	}

	return stops;
}

/**
 * Measure every recorded path with nothing focused.
 *
 * Done in one pass after the walk, rather than before each Tab press, because
 * blurring between stops would restart the transitions this gate has to wait
 * out — and because the resting state of a tab stop cannot depend on the order
 * the ring was walked in.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object[]}                        stops
 * @return {Object[]} Resting measurement per stop, same order.
 */
async function measureResting( page, stops ) {
	await page.evaluate( () => {
		// eslint-disable-next-line @wordpress/no-global-active-element
		document.activeElement?.blur();
	} );
	await page.mouse.move( -50, -50 );
	// Let the last stop's ring fade back out before reading anything: releasing
	// a state is not the same as it being gone (computed-style gate, trap 5).
	// Nothing to wait on here either — the element is already blurred.
	// eslint-disable-next-line playwright/no-wait-for-timeout
	await page.waitForTimeout( 250 );

	const resting = [];
	for ( const stop of stops ) {
		resting.push(
			await page.evaluate( measureBands, {
				path: stop.path,
				extras: INDICATOR_ELSEWHERE,
			} )
		);
	}
	return resting;
}

/* -------------------------------------------------------------------------
 * Tests
 * ---------------------------------------------------------------------- */

test.describe( 'Focus appearance', () => {
	// Walk the ring as a VISITOR. Logged in, WordPress puts its own admin bar at
	// the front of the tab ring, and those links are WP-supplied UI the theme
	// deliberately does not style (see the "never load Carbon CSS into
	// WordPress's own UI" rule). Measuring them would report seven failures the
	// theme must not fix, and would bury the ones it must.
	test.use( { storageState: { cookies: [], origins: [] } } );

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

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPages();
	} );

	for ( const scheme of SCHEMES ) {
		for ( const fixture of PAGES ) {
			test( `${ fixture.key } — ${ scheme }`, async ( {
				page,
				baseURL,
			} ) => {
				await gotoWithScheme(
					page,
					`/?p=${ pageIds[ fixture.key ] }`,
					scheme,
					baseURL
				);

				const stops = await walkTabRing( page );
				const resting = await measureResting( page, stops );

				// Trap 5 of the sibling gate, in its focus costume: a walk that
				// found nothing would pass every assertion below.
				expect(
					stops.length,
					`no tab stops found on ${ fixture.key } — the walk measured nothing`
				).toBeGreaterThan( 5 );

				const failures = [];
				const lines = [];

				for ( let i = 0; i < stops.length; i++ ) {
					const stop = stops[ i ];
					const label = `${ fixture.key }/${ scheme } ${ stop.label }`;

					// Trap 3: activeElement points at the element even when the
					// window has no focus, and then every style read is resting.
					expect(
						stop.windowHasFocus,
						`${ label }: the window does not hold focus, so nothing here is a focus style`
					).toBe( true );
					expect(
						stop.focusMatches,
						`${ label }: :focus did not match at this tab stop`
					).toBe( true );

					expect(
						stop.focused.error,
						`${ label }: ${ stop.focused.error || '' }`
					).toBeUndefined();
					expect(
						resting[ i ].error,
						`${ label }: ${ resting[ i ].error || '' }`
					).toBeUndefined();

					const restingByKey = {};
					for ( const node of resting[ i ].nodes ) {
						restingByKey[ node.key ] = node.samples;
					}
					const best = bestIndicator( stop.focused, restingByKey );

					lines.push(
						`  ${ best.thickness }px @ ${ best.contrast }:1  ` +
							`${ stop.label }  [${ best.key || 'nothing' }]`
					);

					if ( best.thickness < MIN_THICKNESS ) {
						const profiles = stop.focused.nodes
							.map(
								( node ) =>
									`  ${ node.key } (${ node.outward }px of ` +
									`room outside before an ancestor clips):\n` +
									describeProfile(
										restingByKey[ node.key ] || [],
										node.samples
									)
							)
							.join( '\n' );
						failures.push(
							`${ stop.label }\n` +
								`  visible indicator: ${ best.thickness }px ` +
								`(needs ${ MIN_THICKNESS }px changing by at ` +
								`least ${ MIN_CONTRAST }:1)\n` +
								`  path: ${ stop.path }\n${ profiles }`
						);
					}
				}

				if ( REPORTING ) {
					// eslint-disable-next-line no-console
					console.log(
						`\n${ fixture.key } / ${ scheme } — ${ stops.length } tab stops\n` +
							lines.join( '\n' )
					);
				}

				expect(
					failures,
					`${ failures.length } of ${ stops.length } tab stops on ` +
						`${ fixture.key } (${ scheme }) draw a visible focus ` +
						`indicator thinner than ${ MIN_THICKNESS }px.\n\n` +
						failures.join( '\n\n' )
				).toEqual( [] );
			} );
		}
	}
} );
