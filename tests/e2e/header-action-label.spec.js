/**
 * A header action with a label is as wide as its label.
 *
 * Carbon sizes `.cds--header__action` as a square — `inline-size: 3rem` — and
 * the theme only ever set `min-inline-size`, so the square stood whatever was
 * inside it. The "icon with label" kind then drew its label outside its own
 * button and across the one beside it: on the site this was found on, the
 * first label overlapped the second button by 11px (2026-09-10).
 *
 * The label span is added here rather than rendered from a block, because the
 * defect is in the CSS that sizes the button and the header is a template
 * part — the same approach the collapse spec takes for the same reason. The
 * markup mirrors render.php exactly.
 *
 * The second assertion is the one that keeps the fix honest: releasing the
 * width for every action would have widened every existing header for a
 * variant it does not use, so an icon-only action has to stay square.
 *
 * The width came from a `:has()` rule alone until 2026-11-05, when an old
 * Edge (before 105, no `:has()`) showed the same overlap again: the browser
 * drops the rule and the square stands. The last test removes every `:has()`
 * rule from the page, which is what such a browser does, and measures again.
 */

const { test, expect } = require( './fixtures' );

const LABEL_CLASS = 'cds--header__action-label';

const WITH_LABEL_CLASS = 'cds--header__action--with-label';

// What render.php emits for kind="with-label", added to a live action.
const addLabel = ( page, text ) =>
	page.evaluate(
		( [ cls, modifier, label ] ) => {
			const action = [
				...document.querySelectorAll( '.cds--header__action' ),
			].find( ( a ) => a.getBoundingClientRect().width > 0 );
			const span = document.createElement( 'span' );
			span.className = cls;
			span.textContent = label;
			action.classList.add( modifier );
			action.appendChild( span );
		},
		[ LABEL_CLASS, WITH_LABEL_CLASS, text ]
	);

// Delete every rule whose selector uses `:has()`, as a browser without it
// would. An index walk, not `for...of`: a CSSRuleList is not iterable.
const dropHasRules = ( page ) =>
	page.evaluate( () => {
		let dropped = 0;
		const walk = ( owner ) => {
			for ( let i = owner.cssRules.length - 1; i >= 0; i-- ) {
				const rule = owner.cssRules[ i ];
				if ( rule.selectorText !== undefined ) {
					if ( rule.selectorText.includes( ':has(' ) ) {
						owner.deleteRule( i );
						dropped++;
					}
				} else if ( rule.cssRules ) {
					walk( rule );
				}
			}
		};
		for ( const sheet of Array.from( document.styleSheets ) ) {
			try {
				walk( sheet );
			} catch {
				// A cross-origin sheet cannot be read; it holds no theme rules.
			}
		}
		return dropped;
	} );

const boxes = ( page ) =>
	page.evaluate( ( cls ) => {
		const actions = [
			...document.querySelectorAll( '.cds--header__action' ),
		];
		const read = ( el ) => {
			const r = el.getBoundingClientRect();
			return { right: r.right, width: r.width };
		};
		const labelled = actions.find( ( a ) => a.querySelector( '.' + cls ) );
		const plain = actions.find(
			( a ) =>
				! a.querySelector( '.' + cls ) &&
				a.getBoundingClientRect().width > 0
		);
		return {
			button: labelled ? read( labelled ) : null,
			label: labelled
				? read( labelled.querySelector( '.' + cls ) )
				: null,
			plainWidth: plain ? read( plain ).width : null,
		};
	}, LABEL_CLASS );

test.describe( 'Header action with a label', () => {
	test( 'the label stays inside its own button, and icon-only stays square', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1440, height: 800 } );
		await page.goto( '/' );
		await page
			.locator( '.cds--header__action' )
			.first()
			.waitFor( { state: 'attached' } );

		const before = await boxes( page );
		await addLabel( page, 'Learn' );
		const after = await boxes( page );

		expect( after.label, 'the label should render' ).not.toBeNull();
		expect(
			Math.round( after.label.right ),
			'the label must not run past the button that holds it'
		).toBeLessThanOrEqual( Math.round( after.button.right ) );

		expect(
			after.button.width,
			'a labelled action has to be wider than an icon-only one'
		).toBeGreaterThan( before.plainWidth );

		expect(
			after.plainWidth,
			'an icon-only action keeps the width it had'
		).toBe( before.plainWidth );
	} );

	// A label costs about 100px in a row that also holds a logo, a menu button
	// and the other actions. On a 390px screen that pushed the last action —
	// the colour-scheme toggle — off the edge of the header, with nothing on
	// screen to say a control had gone. Below 672px the label is dropped and
	// the action is an icon again.
	test( 'below 672px the label is dropped and the square comes back', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1440, height: 800 } );
		await page.goto( '/' );
		await page
			.locator( '.cds--header__action' )
			.first()
			.waitFor( { state: 'attached' } );

		const iconOnly = ( await boxes( page ) ).plainWidth;
		await addLabel( page, 'Learn' );
		expect(
			( await boxes( page ) ).button.width,
			'above the breakpoint the label is shown and the action is wide'
		).toBeGreaterThan( iconOnly );

		await page.setViewportSize( { width: 671, height: 800 } );
		const narrow = await boxes( page );

		expect(
			await page.evaluate(
				( cls ) =>
					getComputedStyle( document.querySelector( '.' + cls ) )
						.display,
				LABEL_CLASS
			),
			'the label is not drawn below the breakpoint'
		).toBe( 'none' );

		expect(
			narrow.button.width,
			'and the action is the same square as every other icon'
		).toBe( narrow.plainWidth );

		// The name never depended on the span: it is on the element itself.
		expect(
			await page.evaluate( () =>
				document
					.querySelector( '.cds--header__action' )
					.getAttribute( 'aria-label' )
			)
		).toBeTruthy();
	} );

	test( 'the label still fits in a browser without :has()', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 1440, height: 800 } );
		await page.goto( '/' );
		await page
			.locator( '.cds--header__action' )
			.first()
			.waitFor( { state: 'attached' } );

		expect(
			await dropHasRules( page ),
			'the page should have had :has() rules to drop'
		).toBeGreaterThan( 0 );

		const before = await boxes( page );
		await addLabel( page, 'Learn' );
		const after = await boxes( page );

		expect(
			Math.round( after.label.right ),
			'the label must not run past the button that holds it'
		).toBeLessThanOrEqual( Math.round( after.button.right ) );

		expect(
			after.button.width,
			'a labelled action has to be wider than an icon-only one'
		).toBeGreaterThan( before.plainWidth );
	} );
} );
