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
 */

const { test, expect } = require( './fixtures' );

const LABEL_CLASS = 'cds--header__action-label';

// What render.php emits for kind="with-label", added to a live action.
const addLabel = ( page, text ) =>
	page.evaluate(
		( [ cls, label ] ) => {
			const action = [
				...document.querySelectorAll( '.cds--header__action' ),
			].find( ( a ) => a.getBoundingClientRect().width > 0 );
			const span = document.createElement( 'span' );
			span.className = cls;
			span.textContent = label;
			action.appendChild( span );
		},
		[ LABEL_CLASS, text ]
	);

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
} );
