/**
 * axe-core accessibility gate.
 *
 * Runs axe over three fixture pages — interactive widgets, forms, and content
 * blocks — in BOTH color schemes, plus one pass with the accordion expanded
 * and the modal open so the widgets' opened state is scanned too.
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

/* -------------------------------------------------------------------------
 * Fixture pages
 * ---------------------------------------------------------------------- */

const WIDGETS = `
<!-- wp:awt/section {"ariaLabel":"Interactive widgets"} -->
<!-- wp:awt/accordion -->
<!-- wp:awt/accordion-item {"title":"What is AWT?"} -->
<!-- wp:paragraph --><p>An accessibility-first block theme.</p><!-- /wp:paragraph -->
<!-- /wp:awt/accordion-item -->
<!-- wp:awt/accordion-item {"title":"Which components ship?"} -->
<!-- wp:paragraph --><p>Carbon Design System components.</p><!-- /wp:paragraph -->
<!-- /wp:awt/accordion-item -->
<!-- /wp:awt/accordion -->

<!-- wp:awt/faq-item {"question":"Does it work without JavaScript?"} -->
<!-- wp:paragraph --><p>The content is server-rendered and readable either way.</p><!-- /wp:paragraph -->
<!-- /wp:awt/faq-item -->

<!-- wp:awt/tabs {"ariaLabel":"Product details"} -->
<!-- wp:awt/tab {"label":"Overview"} /-->
<!-- wp:awt/tab {"label":"Specifications"} /-->
<!-- wp:awt/tab-panel -->
<!-- wp:paragraph --><p>Overview panel.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tab-panel -->
<!-- wp:awt/tab-panel -->
<!-- wp:paragraph --><p>Specifications panel.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tab-panel -->
<!-- /wp:awt/tabs -->

<!-- wp:awt/content-switcher {"ariaLabel":"View mode"} -->
<!-- wp:awt/content-switcher-item {"label":"List","value":"list"} /-->
<!-- wp:awt/content-switcher-item {"label":"Grid","value":"grid"} /-->
<!-- wp:awt/content-switcher-panel -->
<!-- wp:paragraph --><p>List view.</p><!-- /wp:paragraph -->
<!-- /wp:awt/content-switcher-panel -->
<!-- wp:awt/content-switcher-panel -->
<!-- wp:paragraph --><p>Grid view.</p><!-- /wp:paragraph -->
<!-- /wp:awt/content-switcher-panel -->
<!-- /wp:awt/content-switcher -->

<!-- wp:awt/modal-opener {"text":"Open the dialog","modalId":"axe-modal"} /-->
<!-- wp:awt/modal {"id":"axe-modal","heading":"Confirm deletion","label":"Account settings","primaryAction":"Delete","danger":true} -->
<!-- wp:paragraph --><p>This cannot be undone.</p><!-- /wp:paragraph -->
<!-- /wp:awt/modal -->

<!-- wp:awt/dropdown {"label":"Region"} /-->
<!-- wp:awt/menu-button {"label":"Actions"} /-->
<!-- wp:awt/toggletip {"label":"Storage limits"} /-->
<!-- wp:awt/tooltip {"triggerText":"Retention","description":"Backups are kept for 30 days."} /-->
<!-- wp:awt/tile {"variant":"expandable","summary":"Deployment details"} -->
<!-- wp:paragraph --><p>Region, instance size, and rollout window.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->
<!-- /wp:awt/section -->
`;

const FORMS = `
<!-- wp:awt/section {"ariaLabel":"Forms"} -->
<!-- wp:awt/form {"legend":"Create an account","description":"All fields are required."} -->
<!-- wp:awt/text-input {"label":"Full name","name":"name","required":true,"helperText":"As it appears on your ID."} /-->
<!-- wp:awt/text-input {"label":"Email","name":"email","type":"email","required":true,"invalid":true,"invalidText":"Enter a valid email address."} /-->
<!-- wp:awt/text-input {"label":"Company","name":"company","warn":true,"warnText":"We could not verify this company."} /-->
<!-- wp:awt/password-input {"label":"Password","name":"password","helperText":"At least 12 characters."} /-->
<!-- wp:awt/text-area {"label":"Why are you signing up?","name":"reason"} /-->
<!-- wp:awt/select {"label":"Plan","name":"plan"} /-->
<!-- wp:awt/checkbox {"label":"Email me product updates","name":"updates"} /-->
<!-- wp:awt/checkbox {"label":"Select all regions","name":"regions","indeterminate":true} /-->
<!-- wp:awt/radio-button-group {"legend":"Billing period","name":"billing"} -->
<!-- wp:awt/radio-button {"label":"Monthly","value":"monthly","checked":true} /-->
<!-- wp:awt/radio-button {"label":"Yearly","value":"yearly"} /-->
<!-- /wp:awt/radio-button-group -->
<!-- wp:awt/toggle {"label":"Two-factor authentication","name":"twofa","toggled":true} /-->
<!-- wp:awt/button {"text":"Create account","type":"submit","size":"md"} /-->
<!-- wp:awt/button {"text":"Cancel","kind":"secondary","size":"md"} /-->
<!-- wp:awt/button {"text":"Delete","kind":"danger","size":"md"} /-->
<!-- wp:awt/button {"text":"Learn more","kind":"ghost","size":"md"} /-->
<!-- /wp:awt/form -->
<!-- /wp:awt/section -->
`;

const CONTENT = `
<!-- wp:awt/hero {"heading":"Accessible by default","description":"Carbon components, paired light and dark."} /-->
<!-- wp:awt/section {"ariaLabel":"Content blocks"} -->
<!-- wp:awt/breadcrumb -->
<!-- wp:awt/breadcrumb-item {"text":"Home","href":"/"} /-->
<!-- wp:awt/breadcrumb-item {"text":"Docs","href":"/docs"} /-->
<!-- wp:awt/breadcrumb-item {"text":"Blocks","isCurrentPage":true} /-->
<!-- /wp:awt/breadcrumb -->

<!-- wp:awt/notification {"kind":"info","title":"Scheduled maintenance","subtitle":"Sunday 02:00 to 04:00 UTC."} /-->
<!-- wp:awt/notification {"kind":"success","title":"Saved","subtitle":"Your changes are live.","lowContrast":true} /-->
<!-- wp:awt/notification {"kind":"warning","title":"Storage almost full","subtitle":"92 percent used.","lowContrast":true} /-->
<!-- wp:awt/notification {"kind":"error","title":"Upload failed","subtitle":"The file is larger than 10 MB.","lowContrast":true} /-->
<!-- wp:awt/notification {"kind":"error","title":"Connection lost","subtitle":"Retrying.","variant":"toast"} /-->

<!-- wp:awt/tag {"text":"Stable","type":"green"} /-->
<!-- wp:awt/tag {"text":"Beta","type":"purple"} /-->
<!-- wp:awt/tag {"text":"Filterable","type":"blue","filter":true} /-->

<!-- wp:awt/data-table {"caption":"Services and owners","sortable":true,"zebra":true} /-->

<!-- wp:awt/list -->
<!-- wp:awt/list-item {"content":"Keyboard reachable"} /-->
<!-- wp:awt/list-item {"content":"Screen-reader labelled"} /-->
<!-- /wp:awt/list -->

<!-- wp:awt/code-snippet {"code":"wp plugin activate awt-blocks","variant":"single"} /-->
<!-- wp:awt/link {"text":"Read the documentation","href":"/docs"} /-->
<!-- wp:awt/stat {"value":"98%","heading":"Automated checks passed","level":"3"} /-->
<!-- wp:awt/testimonial {"quote":"It stopped being an afterthought.","authorName":"Maria S.","authorRole":"Design lead"} /-->

<!-- wp:awt/feature-grid -->
<!-- wp:awt/tile -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Paired themes</h3><!-- /wp:heading -->
<!-- wp:paragraph --><p>Light and dark are designed together.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->
<!-- wp:awt/tile -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Keyboard first</h3><!-- /wp:heading -->
<!-- wp:paragraph --><p>Every control is reachable without a mouse.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->
<!-- /wp:awt/feature-grid -->

<!-- wp:awt/pricing-tile {"tierName":"Essentials","price":"0","pricePeriod":"forever","description":"The full component set.","ctaText":"Get started"} /-->
<!-- wp:awt/pagination {"totalPages":5,"currentPage":2,"baseUrl":"/docs"} /-->
<!-- /wp:awt/section -->
`;

const PAGES = [
	{ key: 'widgets', title: 'axe — interactive widgets', content: WIDGETS },
	{ key: 'forms', title: 'axe — forms', content: FORMS },
	{ key: 'content', title: 'axe — content blocks', content: CONTENT },
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
 * @param {import('@playwright/test').Page} page
 * @param {string}                          url
 * @param {string}                          scheme  'light' or 'dark'.
 * @param {string}                          baseURL
 */
async function gotoWithScheme( page, url, scheme, baseURL ) {
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
			// The expect() calls live in gotoWithScheme() and
			// assertAgainstBaseline(), which the rule cannot see.
			// eslint-disable-next-line playwright/expect-expect
			test( `${ fixture.key } — ${ scheme }`, async ( {
				page,
				baseURL,
			} ) => {
				await gotoWithScheme(
					page,
					`/?page_id=${ pageIds[ fixture.key ] }`,
					scheme,
					baseURL
				);
				const run = `${ fixture.key }|${ scheme }|default`;
				assertAgainstBaseline(
					run,
					flatten( run, await analyze( page ) )
				);
			} );
		}
	}

	// Opened state. A closed accordion panel and an unopened modal are hidden
	// from axe, so their contents — the very parts most likely to be wrong —
	// are never scanned by the passes above.
	for ( const scheme of SCHEMES ) {
		test( `widgets, opened — ${ scheme }`, async ( { page, baseURL } ) => {
			await gotoWithScheme(
				page,
				`/?page_id=${ pageIds.widgets }`,
				scheme,
				baseURL
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

			const run = `widgets|${ scheme }|opened`;
			assertAgainstBaseline( run, flatten( run, await analyze( page ) ) );
		} );
	}

	test.afterAll( () => {
		const expectedRuns =
			PAGES.length * SCHEMES.length + SCHEMES.length; /* opened passes */

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
