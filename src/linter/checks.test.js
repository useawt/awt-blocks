/**
 * Unit tests for the §4 accessibility-linter check engine.
 *
 * Run with `npm run test:unit` (wp-scripts test-unit-js → Jest + babel, jsdom
 * env so DOMParser is available for the inline-link / SVG checks).
 *
 * Each test drives the public `runChecks()` with fixture blocks and asserts the
 * presence/absence of a check id — exercising flatten + dispatch + context wiring
 * as well as the individual rules, and pinning the no-false-positive behavior.
 */

import { runChecks } from './checks';

// Fixture block builder. Each block: { name, clientId, attributes, innerBlocks }.
let seq = 0;
const B = ( name, attributes = {}, innerBlocks = [] ) => ( {
	name,
	clientId: `c${ ++seq }`,
	attributes,
	innerBlocks,
} );

// Carbon palette subset the contrast / color-override checks resolve against.
const COLORS = {
	background: '#ffffff',
	'text-primary': '#161616',
	'text-on-color': '#ffffff',
	'support-warning': '#f1c21b',
};

const ctx = ( extra = {} ) => ( {
	documentLang: 'en-US',
	colors: COLORS,
	...extra,
} );
const has = ( findings, id ) => findings.some( ( f ) => f.checkId === id );

describe( '#1 missing image alt', () => {
	test( 'fires on a non-linked image with empty alt', () => {
		const f = runChecks(
			[ B( 'core/image', { url: 'a.jpg', alt: '' } ) ],
			ctx()
		);
		expect( has( f, 1 ) ).toBe( true );
	} );
	test( 'silent when alt is present', () => {
		const f = runChecks(
			[ B( 'core/image', { url: 'a.jpg', alt: 'A red bicycle' } ) ],
			ctx()
		);
		expect( has( f, 1 ) ).toBe( false );
	} );
	// `isDecorative` is core's own attribute, set by the Image block's "Mark
	// as decorative" checkbox. The name is pinned here because the check read
	// a different one for months: nothing set it, so ticking the box left the
	// error standing and the advice could not be followed.
	test( 'silent when the author marked the image decorative', () => {
		const f = runChecks(
			[
				B( 'core/image', {
					url: 'a.jpg',
					alt: '',
					isDecorative: true,
				} ),
			],
			ctx()
		);
		expect( has( f, 1 ) ).toBe( false );
	} );
	test( 'the same for a cover', () => {
		const f = runChecks(
			[
				B( 'core/cover', {
					url: 'a.jpg',
					alt: '',
					isDecorative: true,
				} ),
			],
			ctx()
		);
		expect( has( f, 1 ) ).toBe( false );
	} );
	test( 'decorative does not excuse a linked image', () => {
		const f = runChecks(
			[
				B( 'core/image', {
					url: 'a.jpg',
					alt: '',
					isDecorative: true,
					linkDestination: 'custom',
					href: 'https://x',
				} ),
			],
			ctx()
		);
		expect( has( f, 4 ) ).toBe( true );
	} );
	test( 'a linked image is #4, not #1', () => {
		const f = runChecks(
			[
				B( 'core/image', {
					url: 'a.jpg',
					alt: '',
					linkDestination: 'custom',
					href: 'https://x',
				} ),
			],
			ctx()
		);
		expect( has( f, 1 ) ).toBe( false );
		expect( has( f, 4 ) ).toBe( true );
	} );
} );

describe( '#2 heading-level skips (Warning)', () => {
	test( 'fires H2 → H4', () => {
		const f = runChecks(
			[
				B( 'core/heading', { level: 2 } ),
				B( 'core/heading', { level: 4 } ),
			],
			ctx()
		);
		expect( has( f, 2 ) ).toBe( true );
		expect( f.find( ( x ) => x.checkId === 2 ).severity ).toBe( 'warning' );
	} );
	test( 'silent H2 → H3', () => {
		const f = runChecks(
			[
				B( 'core/heading', { level: 2 } ),
				B( 'core/heading', { level: 3 } ),
			],
			ctx()
		);
		expect( has( f, 2 ) ).toBe( false );
	} );
	test( 'ignores the page-title H1', () => {
		const f = runChecks(
			[ B( 'core/post-title' ), B( 'core/heading', { level: 2 } ) ],
			ctx()
		);
		// H1(title) excluded → sequence is just H2 → no skip
		expect( has( f, 2 ) ).toBe( false );
	} );
	test( 'fires on an awt/stat set to a heading level (H2 → stat H4)', () => {
		const f = runChecks(
			[
				B( 'core/heading', { level: 2 } ),
				B( 'awt/stat', { heading: 'faster delivery', level: '4' } ),
			],
			ctx()
		);
		expect( has( f, 2 ) ).toBe( true );
	} );
	test( 'silent on a default (non-heading) awt/stat after an H2', () => {
		const f = runChecks(
			[
				B( 'core/heading', { level: 2 } ),
				B( 'awt/stat', { heading: 'faster delivery' } ),
				B( 'core/heading', { level: 3 } ),
			],
			ctx()
		);
		expect( has( f, 2 ) ).toBe( false );
	} );
	test( 'an awt/stat heading participates in the sequence (stat H3 → H4 ok)', () => {
		const f = runChecks(
			[
				B( 'core/heading', { level: 2 } ),
				B( 'awt/stat', { heading: 'faster delivery', level: '3' } ),
				B( 'core/heading', { level: 4 } ),
			],
			ctx()
		);
		expect( has( f, 2 ) ).toBe( false );
	} );
} );

describe( '#5 non-descriptive link text (Warning)', () => {
	test( 'fires on a "Read more" button', () => {
		const f = runChecks(
			[ B( 'awt/button', { text: 'Read more', href: 'https://x' } ) ],
			ctx()
		);
		expect( has( f, 5 ) ).toBe( true );
	} );
	test( 'silent on descriptive text', () => {
		const f = runChecks(
			[
				B( 'awt/button', {
					text: 'Download the 2026 report',
					href: 'https://x',
				} ),
			],
			ctx()
		);
		expect( has( f, 5 ) ).toBe( false );
	} );
	test( 'fires on an inline "click here" anchor in a paragraph', () => {
		const f = runChecks(
			[
				B( 'core/paragraph', {
					content: 'See <a href="https://x">click here</a> for more',
				} ),
			],
			ctx()
		);
		expect( has( f, 5 ) ).toBe( true );
	} );
	test( 'fires on an inline "learn more" anchor in a hero description', () => {
		const f = runChecks(
			[
				B( 'awt/hero', {
					description: 'Intro. <a href="https://x">Learn more</a>.',
				} ),
			],
			ctx()
		);
		expect( has( f, 5 ) ).toBe( true );
	} );
} );

describe( '#6 document language', () => {
	test( 'fires when the effective lang is empty', () => {
		const f = runChecks(
			[ B( 'core/paragraph', { content: 'hi' } ) ],
			ctx( { documentLang: '' } )
		);
		expect( has( f, 6 ) ).toBe( true );
	} );
	test( 'silent when a lang is set', () => {
		const f = runChecks(
			[ B( 'core/paragraph', { content: 'hi' } ) ],
			ctx( { documentLang: 'en-US' } )
		);
		expect( has( f, 6 ) ).toBe( false );
	} );
	test( 'skipped when lang is unknown (undefined)', () => {
		const f = runChecks(
			[ B( 'core/paragraph', { content: 'hi' } ) ],
			ctx( { documentLang: undefined } )
		);
		expect( has( f, 6 ) ).toBe( false );
	} );
} );

describe( '#7 illogical heading order (Warning)', () => {
	test( 'fires when a heading jumps >1 level shallower (H4 → H2)', () => {
		const f = runChecks(
			[
				B( 'core/heading', { level: 4 } ),
				B( 'core/heading', { level: 2 } ),
			],
			ctx()
		);
		expect( has( f, 7 ) ).toBe( true );
	} );
	test( 'silent on a one-level step back (H4 → H3)', () => {
		const f = runChecks(
			[
				B( 'core/heading', { level: 4 } ),
				B( 'core/heading', { level: 3 } ),
			],
			ctx()
		);
		expect( has( f, 7 ) ).toBe( false );
	} );
} );

describe( '#10 empty line via consecutive <br>', () => {
	test( 'fires on consecutive <br>', () => {
		const f = runChecks(
			[ B( 'core/paragraph', { content: 'one<br><br>two' } ) ],
			ctx()
		);
		expect( has( f, 10 ) ).toBe( true );
	} );
	test( 'silent on a single <br> between lines', () => {
		const f = runChecks(
			[ B( 'core/paragraph', { content: 'line one<br>line two' } ) ],
			ctx()
		);
		expect( has( f, 10 ) ).toBe( false );
	} );
	test( 'fires inside an AWT rich-text attribute (hero description)', () => {
		const f = runChecks(
			[ B( 'awt/hero', { description: 'one<br><br>two' } ) ],
			ctx()
		);
		expect( has( f, 10 ) ).toBe( true );
	} );
	test( 'fires inside a testimonial quote (self-closing <br />)', () => {
		const f = runChecks(
			[ B( 'awt/testimonial', { quote: 'a<br /><br />b' } ) ],
			ctx()
		);
		expect( has( f, 10 ) ).toBe( true );
	} );
	test( 'silent on a hero description with a single <br>', () => {
		const f = runChecks(
			[ B( 'awt/hero', { description: 'line one<br>line two' } ) ],
			ctx()
		);
		expect( has( f, 10 ) ).toBe( false );
	} );
} );

describe( '#11 color override outside the palette (Warning)', () => {
	test( 'fires on a custom hex text color', () => {
		const f = runChecks(
			[
				B( 'core/paragraph', {
					style: { color: { text: '#777777' } },
				} ),
			],
			ctx()
		);
		expect( has( f, 11 ) ).toBe( true );
	} );
	test( 'silent on a palette slug', () => {
		const f = runChecks(
			[ B( 'core/paragraph', { textColor: 'text-primary' } ) ],
			ctx()
		);
		expect( has( f, 11 ) ).toBe( false );
	} );
} );

describe( '#12 color contrast (Error)', () => {
	test( 'fires for white text on a yellow palette background (inherited from ancestor)', () => {
		const tree = [
			B( 'awt/section', { backgroundColor: 'support-warning' }, [
				B( 'core/paragraph', {
					textColor: 'text-on-color',
					content: 'hi',
				} ),
			] ),
		];
		const f = runChecks( tree, ctx() );
		expect( has( f, 12 ) ).toBe( true );
		expect( f.find( ( x ) => x.checkId === 12 ).severity ).toBe( 'error' );
	} );
	test( 'silent for dark text on white', () => {
		const tree = [
			B( 'core/paragraph', {
				textColor: 'text-primary',
				backgroundColor: 'background',
				content: 'hi',
			} ),
		];
		expect( has( runChecks( tree, ctx() ), 12 ) ).toBe( false );
	} );
} );

describe( '#13 table without header cells (Warning)', () => {
	test( 'fires when there is a body but no head cells', () => {
		const f = runChecks(
			[
				B( 'core/table', {
					head: [],
					body: [ { cells: [ { content: 'a' } ] } ],
				} ),
			],
			ctx()
		);
		expect( has( f, 13 ) ).toBe( true );
	} );
	test( 'silent when head cells exist', () => {
		const f = runChecks(
			[
				B( 'core/table', {
					head: [ { cells: [ { content: 'H' } ] } ],
					body: [ { cells: [ { content: 'a' } ] } ],
				} ),
			],
			ctx()
		);
		expect( has( f, 13 ) ).toBe( false );
	} );
} );

describe( '#14 inline SVG with no accessible name (Warning)', () => {
	test( 'fires on a bare <svg> in core/html', () => {
		const f = runChecks(
			[
				B( 'core/html', {
					content:
						'<svg viewBox="0 0 4 4"><path d="M0 0h4v4H0z"/></svg>',
				} ),
			],
			ctx()
		);
		expect( has( f, 14 ) ).toBe( true );
	} );
	test( 'silent when aria-label is present', () => {
		const f = runChecks(
			[
				B( 'core/html', {
					content:
						'<svg aria-label="Logo"><path d="M0 0h4v4z"/></svg>',
				} ),
			],
			ctx()
		);
		expect( has( f, 14 ) ).toBe( false );
	} );
	test( 'silent when aria-hidden', () => {
		const f = runChecks(
			[
				B( 'core/html', {
					content:
						'<svg aria-hidden="true"><path d="M0 0h4v4z"/></svg>',
				} ),
			],
			ctx()
		);
		expect( has( f, 14 ) ).toBe( false );
	} );
} );

describe( '#15 alt text derived from file name (Error)', () => {
	test( 'fires when alt echoes the filename', () => {
		const f = runChecks(
			[
				B( 'core/image', {
					url: 'https://x/uploads/IMG_4032.jpg',
					alt: 'IMG_4032.jpg',
				} ),
			],
			ctx()
		);
		expect( has( f, 15 ) ).toBe( true );
	} );
	test( 'silent on a real description', () => {
		const f = runChecks(
			[
				B( 'core/image', {
					url: 'https://x/uploads/IMG_4032.jpg',
					alt: 'Team outside the office',
				} ),
			],
			ctx()
		);
		expect( has( f, 15 ) ).toBe( false );
	} );
} );

describe( '#16 identical link text → different destinations (Error)', () => {
	test( 'fires for two same-text links to different URLs', () => {
		const f = runChecks(
			[
				B( 'awt/button', {
					text: 'Our report',
					href: 'https://x/2024.pdf',
				} ),
				B( 'awt/button', {
					text: 'Our report',
					href: 'https://x/2025.pdf',
				} ),
			],
			ctx()
		);
		expect( has( f, 16 ) ).toBe( true );
	} );
	test( 'silent when same text goes to the same URL', () => {
		const f = runChecks(
			[
				B( 'awt/button', { text: 'Home', href: 'https://x/' } ),
				B( 'awt/button', { text: 'Home', href: 'https://x/' } ),
			],
			ctx()
		);
		expect( has( f, 16 ) ).toBe( false );
	} );
} );

describe( '#17 highlighted text (<mark>) contrast (Error)', () => {
	test( 'fires on a low-contrast highlight (inline style)', () => {
		const f = runChecks(
			[
				B( 'core/paragraph', {
					content:
						'a <mark style="background-color:#161616;color:#393939">hi</mark> b',
				} ),
			],
			ctx()
		);
		expect( has( f, 17 ) ).toBe( true );
		expect( f.find( ( x ) => x.checkId === 17 ).severity ).toBe( 'error' );
	} );
	test( 'silent on a high-contrast highlight', () => {
		const f = runChecks(
			[
				B( 'core/paragraph', {
					content:
						'a <mark style="background-color:#161616;color:#ffffff">hi</mark> b',
				} ),
			],
			ctx()
		);
		expect( has( f, 17 ) ).toBe( false );
	} );
	test( 'resolves palette classes against the colors map', () => {
		const f = runChecks(
			[
				B( 'core/paragraph', {
					content:
						'a <mark class="has-support-warning-background-color has-support-warning-color">hi</mark> b',
				} ),
			],
			ctx()
		);
		// support-warning on support-warning = 1:1 → fails
		expect( has( f, 17 ) ).toBe( true );
	} );
	test( 'silent when there is no <mark>', () => {
		const f = runChecks(
			[ B( 'core/paragraph', { content: 'plain text' } ) ],
			ctx()
		);
		expect( has( f, 17 ) ).toBe( false );
	} );
	test( 'fires on a low-contrast highlight inside a hero description', () => {
		const f = runChecks(
			[
				B( 'awt/hero', {
					description:
						'a <mark style="background-color:#161616;color:#393939">hi</mark> b',
				} ),
			],
			ctx()
		);
		expect( has( f, 17 ) ).toBe( true );
	} );
	test( 'a transparent inline background is not treated as black (text-color-only highlight)', () => {
		// Gutenberg writes background-color:rgba(0,0,0,0) for color-only
		// highlights; high-contrast text on the block's white background passes.
		const f = runChecks(
			[
				B( 'core/paragraph', {
					backgroundColor: 'background',
					content:
						'a <mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-text-primary-color">hi</mark> b',
				} ),
			],
			ctx()
		);
		expect( has( f, 17 ) ).toBe( false );
	} );
	test( 'transparent highlight still fails against a clashing block background', () => {
		// support-warning yellow text, transparent highlight, white block bg → low contrast.
		const f = runChecks(
			[
				B( 'core/paragraph', {
					backgroundColor: 'background',
					content:
						'a <mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-support-warning-color">hi</mark> b',
				} ),
			],
			ctx()
		);
		expect( has( f, 17 ) ).toBe( true );
	} );
} );

describe( 'clean content', () => {
	test( 'a well-formed page produces no findings', () => {
		const tree = [
			B( 'core/heading', { level: 2, content: 'Section' } ),
			B( 'core/heading', { level: 3, content: 'Sub' } ),
			B( 'core/image', {
				url: 'a.jpg',
				alt: 'A meaningful description',
			} ),
			B( 'core/paragraph', {
				content:
					'Read our <a href="https://x">2026 sustainability report</a>.',
			} ),
			B( 'awt/button', { text: 'Get started', href: 'https://x' } ),
		];
		expect( runChecks( tree, ctx() ) ).toHaveLength( 0 );
	} );
} );
