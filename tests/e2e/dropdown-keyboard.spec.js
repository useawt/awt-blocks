/**
 * Dropdown keyboard contract.
 *
 * Why this exists, and why it is a behaviour test rather than a snapshot.
 * ---------------------------------------------------------------------
 * The other five gates are all snapshots or rule runs over a resting or
 * once-clicked page. None of them can see a keyboard contract:
 *
 *   - axe accepts a listbox you cannot operate with the keyboard at all.
 *   - the computed-style snapshot measures the highlighted option's colours,
 *     not whether any key moves the highlight.
 *   - the focus gate walks the tab ring, and this widget deliberately keeps
 *     focus on one element the whole time, so it sees a single stop.
 *   - the AX-subtree snapshot cannot see it either: `aria-activedescendant` is
 *     not in the tree CDP returns, so the thing that carries the highlight to a
 *     screen reader is invisible to that gate by construction.
 *
 * So this contract was built (2026-08-05) and verified twice by throwaway
 * scripts, with nothing to stop it regressing. That is the gap.
 *
 * `role="combobox"` is the reason the typing half matters: screen readers
 * announce it as something you can type into, so the role itself promises
 * type-to-select. Carbon keeps that promise; ours promised it and did nothing
 * until this was added, which is worse than either supporting it or not
 * claiming it. A test that lets that silently regress would let the product go
 * back to lying to the people who most rely on the announcement.
 *
 * Every expectation here was measured on Carbon's live component first, not
 * recalled: focus never leaves the combobox, the highlight travels by
 * `aria-activedescendant`, and a typed prefix expires (Downshift, which Carbon
 * uses, waits 500ms).
 */

const { test, expect } = require( './fixtures' );
const { PAGES } = require( './fixture-pages' );

/** Longer than the view script's TYPEAHEAD_MS, so a prefix cannot bleed across steps. */
const AFTER_BUFFER = 700;

/** The first dropdown on the widgets fixture page, scoped so siblings can't confuse a read. */
const ROOT = '.cds--dropdown';

/**
 * Read the whole visible state of the widget in one go.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @return {Promise<Object>} Expanded state, highlight, activedescendant, focus.
 */
async function state( page ) {
	return page.evaluate( ( sel ) => {
		const dd = document.querySelector( sel );
		const field = dd.querySelector( '.cds--list-box__field' );
		const items = [ ...dd.querySelectorAll( '[role="option"]' ) ];
		const hi = items.findIndex( ( i ) =>
			i.classList.contains( 'cds--list-box__menu-item--highlighted' )
		);
		return {
			expanded: field.getAttribute( 'aria-expanded' ),
			highlighted: hi,
			highlightedText: hi >= 0 ? items[ hi ].textContent.trim() : null,
			activedescendant:
				field.getAttribute( 'aria-activedescendant' ) || '',
			activedescendantPointsAtHighlight:
				hi >= 0 &&
				field.getAttribute( 'aria-activedescendant' ) ===
					items[ hi ].id,
			// eslint-disable-next-line @wordpress/no-global-active-element
			focusOnField: document.activeElement === field,
			shown: dd
				.querySelector( '.cds--list-box__label' )
				.textContent.trim(),
			options: items.map( ( i ) => i.textContent.trim() ),
			// The 4.1.2 half: an option must never contain a control.
			focusableInsideOptions: dd.querySelectorAll(
				'[role="option"] button, [role="option"] a, [role="option"] input, [role="option"] [tabindex]'
			).length,
		};
	}, ROOT );
}

test.describe( 'Dropdown keyboard contract', () => {
	let widgetsId;

	test.beforeAll( async ( { requestUtils } ) => {
		const fixture = PAGES.find( ( f ) => f.key === 'widgets' );
		const created = await requestUtils.createPage( {
			title: fixture.title,
			content: fixture.content,
			status: 'publish',
		} );
		widgetsId = created.id;
	} );

	test.beforeEach( async ( { page } ) => {
		await page.goto( `/?page_id=${ widgetsId }` );
		await page.locator( ROOT ).first().waitFor();
		// Focus directly rather than tabbing: this widget sits far down the page
		// and the contract under test starts once the combobox has focus.
		await page.locator( `${ ROOT } .cds--list-box__field` ).first().focus();
	} );

	test( 'arrows, Home and End move the highlight without moving focus', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'ArrowDown' );
		let s = await state( page );
		expect(
			s.options.length,
			'the fixture must offer options'
		).toBeGreaterThan( 2 );
		expect( s.expanded ).toBe( 'true' );
		expect( s.highlighted, 'ArrowDown opens AND highlights' ).toBe( 0 );

		await page.keyboard.press( 'ArrowDown' );
		s = await state( page );
		expect( s.highlighted ).toBe( 1 );
		expect( s.activedescendantPointsAtHighlight ).toBe( true );

		await page.keyboard.press( 'ArrowUp' );
		expect( ( await state( page ) ).highlighted ).toBe( 0 );

		await page.keyboard.press( 'End' );
		s = await state( page );
		expect( s.highlighted ).toBe( s.options.length - 1 );

		await page.keyboard.press( 'Home' );
		s = await state( page );
		expect( s.highlighted ).toBe( 0 );

		// The whole point of the pattern: focus never entered the list.
		expect( s.focusOnField ).toBe( true );
		expect( s.focusableInsideOptions ).toBe( 0 );
	} );

	test( 'Enter chooses the highlighted option and Escape does not', async ( {
		page,
	} ) => {
		const before = ( await state( page ) ).shown;

		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		const wanted = ( await state( page ) ).highlightedText;
		await page.keyboard.press( 'Enter' );

		let s = await state( page );
		expect( s.shown ).toBe( wanted );
		expect( s.expanded ).toBe( 'false' );
		expect( s.activedescendant, 'a closed list has no active option' ).toBe(
			''
		);
		expect( s.focusOnField ).toBe( true );

		// Escape closes without changing the answer.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Escape' );
		s = await state( page );
		expect( s.expanded ).toBe( 'false' );
		expect( s.shown, 'Escape must not change the choice' ).toBe( wanted );
		expect( s.shown ).not.toBe( before );
	} );

	test( 'typing selects, because the combobox role promises it', async ( {
		page,
	} ) => {
		const { options } = await state( page );
		// This fixture's options all begin with the same letter ("Option 1/2/3"),
		// which is worth testing rather than designing around: a first letter
		// picks the FIRST match, and pressing it again cycles. An earlier version
		// of this test assumed one letter identified one option and failed on the
		// product behaving correctly.
		const letter = options[ 0 ][ 0 ].toLowerCase();
		const sameLetter = options.filter(
			( o ) => o[ 0 ].toLowerCase() === letter
		);
		expect(
			sameLetter.length,
			'this test needs at least two options sharing a first letter'
		).toBeGreaterThan( 1 );

		// Typing while closed opens the list and lands on the first match.
		await page.keyboard.press( letter );
		const s = await state( page );
		expect( s.expanded ).toBe( 'true' );
		expect( s.highlightedText ).toBe( sameLetter[ 0 ] );
		expect( s.activedescendantPointsAtHighlight ).toBe( true );
		expect( s.focusOnField ).toBe( true );

		// The same letter again, still inside the buffer window, moves to the next
		// option starting with it rather than searching for a doubled letter.
		await page.keyboard.press( letter );
		expect( ( await state( page ) ).highlightedText ).toBe(
			sameLetter[ 1 ]
		);

		// A prefix that matches nothing leaves the highlight alone rather than
		// clearing it — losing your place on a typo is worse than doing nothing.
		await page.keyboard.press( 'z' );
		expect( ( await state( page ) ).highlightedText ).toBe(
			sameLetter[ 1 ]
		);

		// The prefix expires, so the letter starts from the first match again.
		await page.waitForTimeout( AFTER_BUFFER );
		await page.keyboard.press( letter );
		expect( ( await state( page ) ).highlightedText ).toBe(
			sameLetter[ 0 ]
		);

		// Enter takes what typing highlighted.
		await page.keyboard.press( 'Enter' );
		expect( ( await state( page ) ).shown ).toBe( sameLetter[ 0 ] );
	} );

	test( 'a modifier combination is left to the browser', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'ArrowDown' );
		const before = ( await state( page ) ).highlightedText;
		// Ctrl+R is reload. Swallowing it to search for "r" would break a
		// shortcut every keyboard user has, including the ones this widget is for.
		await page.keyboard.press( 'Control+r' );
		expect( ( await state( page ) ).highlightedText ).toBe( before );
	} );

	test( 'a closed list drops the typed prefix', async ( { page } ) => {
		const { options } = await state( page );
		const letter = options[ 0 ][ 0 ].toLowerCase();

		// Type a letter that matches nothing, close, then type a real one straight
		// away. If the prefix survived the close, the second keystroke would
		// extend "z" into "zo", match nothing, and the widget would look broken
		// for reasons the visitor cannot see.
		await page.keyboard.press( 'z' );
		await page.keyboard.press( 'Escape' );
		await page.keyboard.press( letter );

		const s = await state( page );
		expect( s.expanded ).toBe( 'true' );
		expect( s.highlightedText ).toBe( options[ 0 ] );
	} );
} );
