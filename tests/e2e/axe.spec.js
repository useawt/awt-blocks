/**
 * axe-core accessibility gate.
 *
 * Runs axe over three fixture pages — interactive widgets, forms, and content
 * blocks — in BOTH color schemes and at BOTH desktop and 375px width, plus a
 * pass with the accordion expanded and the modal open at each width, plus a
 * mobile-only pass with the header navigation opened. 18 runs in total.
 *
 * Widths matter as much as schemes, and until 2026-08-04 this gate only ran at
 * desktop. See VIEWPORTS below for why, and for the defect that made the case.
 *
 * Pages are created through the REST API at test time, so this needs no seeded
 * content. They are hand-curated rather than a dump of every block: each block
 * here carries a real accessibility surface (a name, a role, a state, a
 * contrast pair), and a violation therefore points at block code rather than
 * at whatever a seeded page happened to contain.
 *
 * What this gate can and cannot do
 * --------------------------------
 * axe finds broken rules. It does not find a component that is styled wrongly
 * but legally — the skip link that rendered at half height wearing two focus
 * rings broke no axe rule. That class of defect belongs to the computed-style
 * snapshots. Read the two gates as complements, not substitutes.
 *
 * Baseline
 * --------
 * Known, accepted violations live in `axe-baseline.json`, each with a written
 * reason. Anything not in that file fails the run. To triage a fresh run:
 *
 *   UPDATE_AXE_BASELINE=1 npm run test:axe
 *
 * That writes every current violation into the baseline with a `TODO` reason —
 * and the gate then FAILS until each TODO is replaced with a real reason. The
 * mechanical part is automated; deciding that a violation is acceptable is not.
 *
 * Three traps that would make this pass while measuring nothing (all three hit
 * during the 2026-08-01 skip-link work):
 *
 *   1. `:focus` does not match unless `document.hasFocus()` is true.
 *   2. Styles read before layout settles are wrong — gate on `readyState`.
 *   3. A run that does not verify which color scheme it is in can silently
 *      test light twice. `gotoWithScheme` asserts the scope class every time.
 */

const fs = require( 'fs' );
const path = require( 'path' );
const AxeBuilder = require( '@axe-core/playwright' ).default;
const { test, expect } = require( './fixtures' );
const { PAGES } = require( './fixture-pages' );

const BASELINE_PATH = path.join( __dirname, 'axe-baseline.json' );
const UPDATING = process.env.UPDATE_AXE_BASELINE === '1';

const BASELINE_NOTE =
	'Accessibility violations that are known and accepted. Each entry needs a ' +
	'written reason. Anything not listed here fails the axe gate. Regenerate ' +
	'with UPDATE_AXE_BASELINE=1 npm run test:axe, then write the reasons.';

/**
 * WCAG A + AA, through 2.2. `best-practice` is deliberately excluded: it flags
 * things like "page should have one main landmark" on fixture pages that are
 * fragments by design, and the noise would push people to weaken the rule set.
 * AWT's conformance claim is WCAG 2.2 AA, so that is what is enforced.
 */
const RULE_TAGS = [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa' ];

const SCHEMES = [ 'light', 'dark' ];

/**
 * Widths every pass runs at.
 *
 * Until 2026-08-04 this gate only ever ran at desktop width, and that was its
 * largest blind spot: screen width decides what is actually on screen. Boxes
 * start scrolling, targets move closer together, content reflows, and controls
 * that do not exist on a wide screen appear. A rule-based scanner can only
 * report what the layout puts in front of it.
 *
 * There is precedent for the cost of not doing this. The scrolling-region class
 * of defect — a box a keyboard user cannot reach — sat on 44 catalog pages while
 * this gate passed 8/8, and was found by a separate hand-run 375px sweep.
 *
 * 375×812 is the iPhone SE/13-mini class, the narrowest width in common use and
 * the one WCAG 1.4.10 (Reflow) is written around.
 */
const VIEWPORTS = [
	{ key: 'desktop', width: 1280, height: 800 },
	{ key: 'mobile', width: 375, height: 812 },
];

/* -------------------------------------------------------------------------
 * Baseline handling
 * ---------------------------------------------------------------------- */

function loadBaseline() {
	if ( ! fs.existsSync( BASELINE_PATH ) ) {
		return { accepted: [] };
	}
	return JSON.parse( fs.readFileSync( BASELINE_PATH, 'utf8' ) );
}

const baseline = loadBaseline();
const acceptedById = new Map(
	( baseline.accepted || [] ).map( ( entry ) => [ entry.id, entry ] )
);

// Everything this run saw, so afterAll can rewrite the baseline or notice
// entries that no longer occur. Workers are pinned to 1 in playwright.config,
// so a module-level accumulator is safe.
const seen = new Map();
const completedRuns = new Set();

/**
 * A violation's identity across runs: which page, which scheme, which state,
 * which rule, and which element. Deliberately includes the element target —
 * counting nodes per rule would let a new violation hide behind an accepted
 * one on a different element.
 *
 * @param {string} run             Run key, e.g. `widgets|dark|default`.
 * @param {string} rule            axe rule id.
 * @param {Array}  targetSelectors axe node target array.
 * @return {string} Stable id.
 */
function fingerprint( run, rule, targetSelectors ) {
	return `${ run }|${ rule }|${ [].concat( targetSelectors ).join( ' ' ) }`;
}

function flatten( run, results ) {
	const out = [];
	for ( const violation of results.violations ) {
		for ( const node of violation.nodes ) {
			out.push( {
				id: fingerprint( run, violation.id, node.target ),
				rule: violation.id,
				impact: violation.impact,
				help: violation.help,
				target: [].concat( node.target ).join( ' ' ),
				failureSummary: ( node.failureSummary || '' ).replace(
					/\s+/g,
					' '
				),
			} );
		}
	}
	return out;
}

/* -------------------------------------------------------------------------
 * Page helpers
 * ---------------------------------------------------------------------- */

/**
 * Navigate with a color scheme that is actually in effect.
 *
 * Sets both signals the theme reads — the `awt_color_scheme` cookie (visitor
 * override) and `prefers-color-scheme` — then asserts the resolved Carbon
 * scope class landed on <body>. Without that assertion a misconfigured site
 * setting would quietly make both runs light, and the gate would report a
 * green dark-mode pass it never performed.
 *
 * The viewport is set BEFORE navigating, not after. Setting it afterwards would
 * scan a layout that had already been built at another width, and any rule whose
 * outcome depends on geometry — target size, contrast against what is really
 * behind an element, reflow — would then be measured against a layout no visitor
 * ever sees.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          url
 * @param {string}                          scheme   'light' or 'dark'.
 * @param {string}                          baseURL
 * @param {Object}                          viewport One of VIEWPORTS.
 */
async function gotoWithScheme( page, url, scheme, baseURL, viewport ) {
	await page.setViewportSize( {
		width: viewport.width,
		height: viewport.height,
	} );
	await page.emulateMedia( { colorScheme: scheme } );
	await page.context().addCookies( [
		{
			name: 'awt_color_scheme',
			value: scheme,
			url: baseURL,
		},
	] );

	await page.goto( url );
	// Trap 2: reading before the document is complete returns pre-layout
	// geometry and the pre-paint palette.
	await page.waitForFunction( () => document.readyState === 'complete' );

	const state = await page.evaluate( () => ( {
		html: document.documentElement.getAttribute( 'data-awt-color-scheme' ),
		body: document.body.className,
	} ) );

	expect( state.html, `<html data-awt-color-scheme> for ${ scheme }` ).toBe(
		scheme
	);
	// Which scope class depends on the active style variation: the light
	// family is white/g10, the dark family g90/g100.
	const expected =
		scheme === 'dark' ? /\bcds--(g90|g100)\b/ : /\bcds--(white|g10)\b/;
	expect(
		state.body,
		`<body> scope class for ${ scheme } (got "${ state.body }")`
	).toMatch( expected );
}

async function analyze( page ) {
	return new AxeBuilder( { page } ).withTags( RULE_TAGS ).analyze();
}

/**
 * Compare a run's violations against the baseline and fail on anything new.
 *
 * @param {string} run   Run key.
 * @param {Array}  found Flattened violations.
 */
function assertAgainstBaseline( run, found ) {
	completedRuns.add( run );
	for ( const item of found ) {
		seen.set( item.id, item );
	}

	if ( UPDATING ) {
		return;
	}

	const unexpected = found.filter(
		( item ) => ! acceptedById.has( item.id )
	);
	const report = unexpected
		.map(
			( item ) =>
				`  • [${ item.impact }] ${ item.rule } — ${ item.help }\n` +
				`    element: ${ item.target }\n` +
				`    ${ item.failureSummary }`
		)
		.join( '\n' );

	expect(
		unexpected.length,
		unexpected.length
			? `${ unexpected.length } accessibility violation(s) not in the ` +
					`baseline on "${ run }":\n${ report }\n\n` +
					`Fix them, or — if a violation is genuinely acceptable — run ` +
					`UPDATE_AXE_BASELINE=1 npm run test:axe and write a reason for each.`
			: ''
	).toBe( 0 );
}

/* -------------------------------------------------------------------------
 * Tests
 * ---------------------------------------------------------------------- */

test.describe( 'axe-core: WCAG 2.2 AA on rendered AWT blocks', () => {
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
			for ( const viewport of VIEWPORTS ) {
				// The expect() calls live in gotoWithScheme() and
				// assertAgainstBaseline(), which the rule cannot see.
				// eslint-disable-next-line playwright/expect-expect
				test( `${ fixture.key } — ${ scheme }, ${ viewport.key }`, async ( {
					page,
					baseURL,
				} ) => {
					await gotoWithScheme(
						page,
						`/?page_id=${ pageIds[ fixture.key ] }`,
						scheme,
						baseURL,
						viewport
					);
					// The viewport is part of the run key on purpose: a
					// violation that only happens at 375px is its own finding,
					// and accepting the desktop one must never silently accept
					// it.
					const run = `${ fixture.key }|${ scheme }|default|${ viewport.key }`;
					assertAgainstBaseline(
						run,
						flatten( run, await analyze( page ) )
					);
				} );
			}
		}
	}

	// Opened state. A closed accordion panel and an unopened modal are hidden
	// from axe, so their contents — the very parts most likely to be wrong —
	// are never scanned by the passes above.
	for ( const scheme of SCHEMES ) {
		for ( const viewport of VIEWPORTS ) {
			test( `widgets, opened — ${ scheme }, ${ viewport.key }`, async ( {
				page,
				baseURL,
			} ) => {
				await gotoWithScheme(
					page,
					`/?page_id=${ pageIds.widgets }`,
					scheme,
					baseURL,
					viewport
				);

				const accordionBtn = page
					.locator( '.cds--accordion__heading' )
					.first();
				await accordionBtn.click();
				await expect( accordionBtn ).toHaveAttribute(
					'aria-expanded',
					'true'
				);

				await page
					.getByRole( 'button', { name: 'Open the dialog' } )
					.click();
				const dialog = page.locator( '#axe-modal' );
				// `toBeVisible()` is not enough: it passes at opacity 0, so axe would
				// scan the modal mid-fade and read blended colors — three phantom
				// contrast failures the first time this test ran (a secondary button
				// "at 3.83:1" that measures 5.02:1 once the fade is done). Wait for
				// the animation to finish, then scan.
				await expect( dialog ).toHaveClass( /\bis-visible\b/ );
				await page.waitForFunction( () => {
					const m = document.querySelector( '#axe-modal' );
					return m && window.getComputedStyle( m ).opacity === '1';
				} );

				const run = `widgets|${ scheme }|opened|${ viewport.key }`;
				assertAgainstBaseline(
					run,
					flatten( run, await analyze( page ) )
				);
			} );
		}
	}

	// Mobile only: the header navigation behind its menu button.
	//
	// At desktop width the nav is laid out in the header bar and every pass
	// above already scans it. Below Carbon's breakpoint it collapses behind a
	// menu button, so on a narrow screen the nav's contents are hidden from axe
	// in exactly the same way a closed accordion is — and the control that
	// reveals them does not exist at desktop width at all. Scanning the page
	// with it open is the coverage a width-only pass would still miss.
	for ( const scheme of SCHEMES ) {
		const viewport = VIEWPORTS.find( ( v ) => v.key === 'mobile' );
		test( `header nav opened — ${ scheme }, mobile`, async ( {
			page,
			baseURL,
		} ) => {
			await gotoWithScheme(
				page,
				`/?page_id=${ pageIds.content }`,
				scheme,
				baseURL,
				viewport
			);

			const trigger = page.locator( '.cds--header__menu-trigger' );
			// If the theme ever stops collapsing the nav, this must fail rather
			// than quietly scan a closed menu and report a green pass.
			await expect(
				trigger,
				'the header menu button should be visible at 375px'
			).toBeVisible();
			await trigger.click();
			await expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );

			const run = `content|${ scheme }|nav-open|mobile`;
			assertAgainstBaseline( run, flatten( run, await analyze( page ) ) );
		} );
	}

	test.afterAll( () => {
		const expectedRuns =
			PAGES.length * SCHEMES.length * VIEWPORTS.length +
			SCHEMES.length * VIEWPORTS.length /* widgets opened */ +
			SCHEMES.length; /* header nav opened, mobile only */

		if ( UPDATING ) {
			if ( completedRuns.size !== expectedRuns ) {
				throw new Error(
					`Refusing to write a partial baseline: ${ completedRuns.size } of ` +
						`${ expectedRuns } runs completed. Fix the failing run first.`
				);
			}
			const accepted = [ ...seen.values() ]
				.sort( ( a, b ) => a.id.localeCompare( b.id ) )
				.map( ( item ) => ( {
					...item,
					reason:
						acceptedById.get( item.id )?.reason ||
						'TODO: explain why this is accepted, or fix it.',
				} ) );
			fs.writeFileSync(
				BASELINE_PATH,
				JSON.stringify(
					{
						$note: baseline.$note || BASELINE_NOTE,
						accepted,
					},
					null,
					'\t'
				) + '\n'
			);
			// eslint-disable-next-line no-console
			console.log(
				`\nWrote ${ accepted.length } entries to axe-baseline.json. ` +
					`Replace every TODO reason before committing.\n`
			);
			return;
		}

		// A baseline that lists violations which no longer happen is a baseline
		// nobody can trust. Only check once every run reported, so a failing
		// run does not also produce a misleading staleness error.
		if ( completedRuns.size === expectedRuns ) {
			const stale = ( baseline.accepted || [] ).filter(
				( entry ) => ! seen.has( entry.id )
			);
			if ( stale.length ) {
				throw new Error(
					`${ stale.length } baseline entr(y/ies) no longer occur — good news, ` +
						`but the baseline is now out of date:\n` +
						stale.map( ( e ) => `  • ${ e.id }` ).join( '\n' ) +
						`\n\nRun UPDATE_AXE_BASELINE=1 npm run test:axe to drop them.`
				);
			}
		}

		const todos = ( baseline.accepted || [] ).filter( ( entry ) =>
			String( entry.reason || '' ).startsWith( 'TODO' )
		);
		if ( todos.length ) {
			throw new Error(
				`${ todos.length } baseline entr(y/ies) still carry a TODO reason. ` +
					`An accepted violation needs a written justification:\n` +
					todos.map( ( e ) => `  • ${ e.id }` ).join( '\n' )
			);
		}
	} );
} );
