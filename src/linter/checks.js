/**
 * AWT accessibility linter — engine + Wave A checks.
 *
 * These are PURE functions: each takes a flat block list (+ optional context)
 * and returns an array of findings. No `@wordpress/*` imports, so the logic is
 * unit-testable with plain block-shaped fixtures and carries no editor coupling.
 *
 * A block fixture is `{ name, clientId, attributes, innerBlocks }`.
 * A finding is `{ clientId|null, checkId, severity, title, description, pageLevel? }`.
 *
 * Wave A (MVP) check IDs (see Stage 1 spec §4 — the locked 13-check registry):
 *   1  Missing image alt text                 (Error)
 *   2  Heading-level skips                     (Error)
 *   4  Empty image-only links                  (Error)
 *   5  Non-descriptive link text               (Warning)
 *   6  Missing document lang                   (Error, page-level)
 */

import { ratio } from './wcag';

export const SEVERITY = { ERROR: 'error', WARNING: 'warning', INFO: 'info' };

// #5 trigger list — matched as a link's FULL text in isolation (case-insensitive,
// trailing punctuation stripped). Surrounding context exempts these words.
export const NON_DESCRIPTIVE_LINK_TEXT = [
	'click here',
	'read more',
	'learn more',
	'more',
	'show',
	'play',
	'download',
	'order',
	'buy',
];

/**
 * Depth-first flatten of the block tree into render order.
 * @param {Array} blocks Block list to flatten.
 * @param {Array} out    Accumulator.
 */
export function flatten( blocks, out = [] ) {
	if ( ! Array.isArray( blocks ) ) {
		return out;
	}
	for ( const b of blocks ) {
		if ( ! b ) {
			continue;
		}
		out.push( b );
		if ( b.innerBlocks && b.innerBlocks.length ) {
			flatten( b.innerBlocks, out );
		}
	}
	return out;
}

function attr( b, key, fallback ) {
	return b && b.attributes && b.attributes[ key ] !== undefined
		? b.attributes[ key ]
		: fallback;
}

// Rich-text attributes per block — every attribute whose value is author-written
// HTML prose (RichText). The text checks (#5, #10, #16, #17) scan these, so a
// link, line break, or highlight inside e.g. a hero description is judged the
// same as one inside a paragraph. Keep in sync when a block gains a RichText
// prose field. (Single-line label-ish fields are included where inline formats
// are possible; pure identifiers/URLs are not.)
export const RICH_TEXT_ATTRS = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/list-item': [ 'content' ],
	'core/quote': [ 'value', 'citation' ],
	'awt/hero': [ 'eyebrow', 'heading', 'description' ], // v1 legacy attrs; v2 heroes use real inner blocks
	'awt/stat': [ 'heading', 'description' ],
	'awt/testimonial': [ 'quote', 'authorName', 'authorRole', 'authorOrg' ],
	'awt/pricing-tile': [ 'tierName', 'description' ],
	'awt/notification': [ 'title', 'subtitle', 'caption' ],
	'awt/faq-item': [ 'question' ],
	'awt/accordion-item': [ 'title' ],
	'awt/tooltip': [ 'description' ],
	'awt/toggletip': [ 'description' ],
	'awt/modal': [ 'heading' ],
	'awt/tile': [ 'summary' ],
};

/**
 * The block's rich-text HTML chunks (empty array for non-text blocks).
 * @param {Object} b Block object.
 */
function richTextHtml( b ) {
	const keys = RICH_TEXT_ATTRS[ b.name ];
	if ( ! keys ) {
		return [];
	}
	const out = [];
	for ( const key of keys ) {
		const v = attr( b, key, '' );
		if ( v ) {
			out.push( String( v ) );
		}
	}
	return out;
}

function isLinkedImage( b ) {
	const href = attr( b, 'href', '' );
	const dest = attr( b, 'linkDestination', 'none' );
	return !! href || ( dest && dest !== 'none' );
}

function normalizeLinkText( t ) {
	return String( t || '' )
		.replace( /\s+/g, ' ' )
		.trim()
		.toLowerCase()
		.replace( /[.!?:;,]+$/, '' );
}

/**
 * Extract the visible text of inline anchors from an HTML string.
 * @param {string} html HTML string to scan.
 */
function inlineAnchorTexts( html ) {
	if ( typeof DOMParser === 'undefined' ) {
		return []; // node / no-DOM context (e.g. unit tests) — inline scan skipped
	}
	try {
		const doc = new DOMParser().parseFromString(
			`<div>${ String( html ) }</div>`,
			'text/html'
		);
		return Array.from( doc.querySelectorAll( 'a' ) ).map(
			( a ) => a.textContent || ''
		);
	} catch ( e ) {
		return [];
	}
}

// #1 — Missing image alt text. Non-linked images only; the linked case is the
// more specific #4 so each image fires at most once.
export function checkImageAlt( blocks ) {
	const out = [];
	for ( const b of blocks ) {
		if ( b.name !== 'core/image' && b.name !== 'core/cover' ) {
			continue;
		}
		if ( isLinkedImage( b ) ) {
			continue;
		}
		const alt = String( attr( b, 'alt', '' ) ).trim();
		// Core's own "Mark as decorative" on the Image block sets this, and
		// decorative-image.js gives Cover the same checkbox and the same
		// attribute. It is the author saying the empty alt is deliberate.
		const decorative = attr( b, 'isDecorative', false ) === true;
		if ( ! alt && ! decorative ) {
			out.push( {
				clientId: b.clientId,
				checkId: 1,
				severity: SEVERITY.ERROR,
				title: 'Image is missing alt text',
				description:
					'Add alternative text describing the image, or mark it as decorative.',
			} );
		}
	}
	return out;
}

// #2 — Heading-level skips. Fires on any forward transition that descends more
// than one level (H2 → H4 is a skip; H2 → H3 is fine).
export function checkHeadingSkips( blocks ) {
	const out = [];
	const headings = collectHeadings( blocks );
	let prev = 0;
	for ( const h of headings ) {
		if ( prev && h.level > prev + 1 ) {
			out.push( {
				clientId: h.clientId,
				checkId: 2,
				severity: SEVERITY.WARNING,
				title: `Heading level skips from H${ prev } to H${ h.level }`,
				description: `Don’t skip heading levels — put an H${
					prev + 1
				} after your H${ prev } so the page outline stays in order.`,
			} );
		}
		prev = h.level;
	}
	return out;
}

// #4 — Empty image-only links. A linked image with no alt has no accessible name.
export function checkEmptyImageLinks( blocks ) {
	const out = [];
	for ( const b of blocks ) {
		if ( b.name === 'core/image' && isLinkedImage( b ) ) {
			const alt = String( attr( b, 'alt', '' ) ).trim();
			if ( ! alt ) {
				out.push( {
					clientId: b.clientId,
					checkId: 4,
					severity: SEVERITY.ERROR,
					title: 'Linked image has no accessible name',
					description:
						'This image is a link but has no alt text, so screen readers can’t say where it leads. Add alt text describing the link’s destination.',
				} );
			}
		}
	}
	return out;
}

// #5 — Non-descriptive link text.
export function checkNonDescriptiveLinks( blocks ) {
	const out = [];
	const flag = ( clientId, text ) =>
		out.push( {
			clientId,
			checkId: 5,
			severity: SEVERITY.WARNING,
			title: `Link text “${ text }” is not descriptive`,
			description: `Link text should make sense on its own. Replace generic text like “${ text }” with something that describes the destination.`,
		} );

	for ( const b of blocks ) {
		if (
			b.name === 'core/button' ||
			b.name === 'awt/button' ||
			b.name === 'awt/link'
		) {
			const hasHref = !! attr( b, 'href', '' ) || !! attr( b, 'url', '' );
			const text = normalizeLinkText( attr( b, 'text', '' ) );
			// core/button needs an href to be a "link"; awt link/button are link-ish either way.
			if (
				( hasHref || b.name !== 'core/button' ) &&
				text &&
				NON_DESCRIPTIVE_LINK_TEXT.includes( text )
			) {
				flag( b.clientId, text );
			}
		}
		for ( const html of richTextHtml( b ) ) {
			for ( const raw of inlineAnchorTexts( html ) ) {
				const text = normalizeLinkText( raw );
				if ( text && NON_DESCRIPTIVE_LINK_TEXT.includes( text ) ) {
					flag( b.clientId, text );
				}
			}
		}
	}
	return out;
}

// #6 — Missing document lang (page-level). `context.documentLang` is the
// effective language the front end emits via language_attributes(), bridged
// from PHP get_bloginfo('language'). Undefined means we couldn't read it, in
// which case the check is skipped rather than firing a false positive. (It is
// deliberately NOT the canvas-iframe lang, which is empty even when the
// published page declares one.)
export function checkDocumentLang( blocks, context = {} ) {
	const lang = context.documentLang;
	if ( lang === undefined || lang === null ) {
		return [];
	}
	if ( ! String( lang ).trim() ) {
		return [
			{
				clientId: null,
				checkId: 6,
				severity: SEVERITY.ERROR,
				pageLevel: true,
				title: 'Page language is not set',
				description:
					'Set the site language (Settings → General → Site Language) so screen readers use the correct pronunciation rules.',
			},
		];
	}
	return [];
}

/* ------------------------------------------------------------------ *
 * Wave B
 * ------------------------------------------------------------------ */

function collectHeadings( blocks ) {
	const hs = [];
	for ( const b of blocks ) {
		// Only author-placed content headings. The page-title H1 (core/post-title)
		// is deliberately excluded so content structure is judged on its own and
		// the illogical-order check (#7) stays reachable rather than being
		// subsumed by an always-present leading H1.
		if ( b.name === 'core/heading' ) {
			hs.push( {
				clientId: b.clientId,
				level: Number( attr( b, 'level', 2 ) ),
			} );
		}
		// awt/stat renders a real <h2>–<h6> on the front end when its `level`
		// attribute is a heading level (default "none" renders a <p>), so the
		// heading-sequence checks must see it the way assistive tech does.
		if ( b.name === 'awt/stat' ) {
			const level = String( attr( b, 'level', 'none' ) );
			if ( /^[2-6]$/.test( level ) ) {
				hs.push( {
					clientId: b.clientId,
					level: Number( level ),
				} );
			}
		}
	}
	return hs;
}

function collectLinks( blocks ) {
	const links = [];
	for ( const b of blocks ) {
		if (
			b.name === 'core/button' ||
			b.name === 'awt/button' ||
			b.name === 'awt/link'
		) {
			const href = String(
				attr( b, 'href', '' ) || attr( b, 'url', '' )
			).trim();
			const text = normalizeLinkText( attr( b, 'text', '' ) );
			if ( href && text ) {
				links.push( { clientId: b.clientId, text, href } );
			}
		}
		if ( typeof DOMParser !== 'undefined' ) {
			for ( const html of richTextHtml( b ) ) {
				try {
					const doc = new DOMParser().parseFromString(
						`<div>${ html }</div>`,
						'text/html'
					);
					doc.querySelectorAll( 'a[href]' ).forEach( ( a ) => {
						const text = normalizeLinkText( a.textContent );
						const href = ( a.getAttribute( 'href' ) || '' ).trim();
						if ( text && href ) {
							links.push( { clientId: b.clientId, text, href } );
						}
					} );
				} catch ( e ) {}
			}
		}
	}
	return links;
}

// #7 — Illogical heading order (Warning). Distinct from #2 (adjacent skip):
// catches a page that starts deeper than H2, or a heading with no higher-level
// heading anywhere before it (an orphan in the outline).
export function checkIllogicalHeadingOrder( blocks ) {
	const out = [];
	const headings = collectHeadings( blocks );
	let prev = 0;
	for ( const h of headings ) {
		// Illogical: a heading more than one level SHALLOWER than the one right
		// before it — e.g. an H4 directly followed by an H2. The intermediate
		// level(s) were never opened, so the outline nesting is broken on the way
		// back up. (A one-level step back, H4→H3 or H3→H2, is fine.)
		if ( prev && prev - h.level > 1 ) {
			out.push( {
				clientId: h.clientId,
				checkId: 7,
				severity: SEVERITY.WARNING,
				title: `Heading levels jump around: H${ prev } is followed by H${ h.level }`,
				description: `An H${ h.level } comes right after a deeper H${ prev }, skipping levels. Move up one heading level at a time, or restructure the section.`,
			} );
		}
		prev = h.level;
	}
	return out;
}

// #10 — Line breaks used instead of paragraphs (Warning). Scans every
// rich-text attribute (paragraphs, hero description, testimonial quote, …).
export function checkLineBreaks( blocks ) {
	const out = [];
	for ( const b of blocks ) {
		// Fire only on CONSECUTIVE line breaks — an empty line forced with <br>
		// to fake spacing. Single <br> between lines of content (e.g. an address
		// or a verse) is a legitimate use and is left alone.
		const hit = richTextHtml( b ).some( ( html ) =>
			/(?:<br\s*\/?>\s*){2,}/i.test( html )
		);
		if ( hit ) {
			out.push( {
				clientId: b.clientId,
				checkId: 10,
				severity: SEVERITY.WARNING,
				title: 'Blank space made with line breaks',
				description:
					'Several line breaks are being used to add blank space. Use spacing settings or separate paragraph blocks instead, so screen readers understand the structure.',
			} );
		}
	}
	return out;
}

// #15 — Alt text derived from the file name (Error).
export function checkAltFromFilename( blocks ) {
	const out = [];
	for ( const b of blocks ) {
		if ( b.name !== 'core/image' && b.name !== 'core/cover' ) {
			continue;
		}
		const alt = String( attr( b, 'alt', '' ) ).trim();
		const url = String( attr( b, 'url', '' ) );
		if ( ! alt || ! url ) {
			continue;
		}
		const base = url.split( /[?#]/ )[ 0 ].split( '/' ).pop() || '';
		const noExt = base.replace( /\.[a-z0-9]{2,5}$/i, '' );
		const altN = alt.toLowerCase().replace( /\s+/g, ' ' ).trim();
		const baseN = base.toLowerCase();
		const noExtN = noExt.toLowerCase();
		const noExtSpaces = noExt.replace( /[-_]+/g, ' ' ).toLowerCase().trim();
		const looksAuto =
			/^(img|dsc|dscn|image|photo|pxl|screenshot|screen[ _-]?shot|capture|untitled)[ _-]?\d*/i.test(
				noExt
			) || /^\d{4,}$/.test( noExt );
		if (
			altN === baseN ||
			altN === noExtN ||
			( looksAuto && altN === noExtSpaces )
		) {
			out.push( {
				clientId: b.clientId,
				checkId: 15,
				severity: SEVERITY.ERROR,
				title: 'Alt text looks like a file name',
				description:
					'The alt text matches the image’s file name, which doesn’t describe the image. Replace it with a description of what the image shows.',
			} );
		}
	}
	return out;
}

// #16 — Identical link text pointing to different destinations (Error).
export function checkIdenticalLinkText( blocks ) {
	const links = collectLinks( blocks );
	const byText = {};
	for ( const l of links ) {
		( byText[ l.text ] = byText[ l.text ] || [] ).push( l );
	}
	const out = [];
	for ( const text of Object.keys( byText ) ) {
		const group = byText[ text ];
		const hrefs = new Set( group.map( ( g ) => g.href ) );
		if ( hrefs.size > 1 ) {
			group.forEach( ( g ) =>
				out.push( {
					clientId: g.clientId,
					checkId: 16,
					severity: SEVERITY.ERROR,
					title: `The same link text “${ text }” goes to different pages`,
					description:
						'Links that share the same visible text should lead to the same place. Make each link’s text describe its specific destination.',
				} )
			);
		}
	}
	return out;
}

/* ------------------------------------------------------------------ *
 * Wave C
 * ------------------------------------------------------------------ */

function slugFromVar( value ) {
	const m = String( value ).match( /\|([^|]+)$/ ); // "var:preset|color|link-primary" → "link-primary"
	return m ? m[ 1 ] : null;
}

function resolveColorValue( value, colors ) {
	if ( ! value ) {
		return null;
	}
	if ( value[ 0 ] === '#' || /^rgba?\(/i.test( value ) ) {
		return value;
	}
	if ( value.indexOf( 'var:preset|color|' ) === 0 ) {
		const slug = slugFromVar( value );
		return slug && colors[ slug ] ? colors[ slug ] : null;
	}
	return colors[ value ] || null;
}

export function blockBg( b, colors ) {
	const slug = attr( b, 'backgroundColor', '' );
	if ( slug && colors[ slug ] ) {
		return colors[ slug ];
	}
	const style =
		b.attributes && b.attributes.style && b.attributes.style.color;
	return style && style.background
		? resolveColorValue( style.background, colors )
		: null;
}

function blockText( b, colors ) {
	const slug = attr( b, 'textColor', '' );
	if ( slug && colors[ slug ] ) {
		return colors[ slug ];
	}
	const style =
		b.attributes && b.attributes.style && b.attributes.style.color;
	return style && style.text ? resolveColorValue( style.text, colors ) : null;
}

function isCustomColor( value ) {
	return !! value && ( value[ 0 ] === '#' || /^rgba?\(/i.test( value ) );
}

function buildBgMap( tree, colors, inherited = null, map = {} ) {
	for ( const b of tree ) {
		const own = blockBg( b, colors );
		const eff = own || inherited;
		if ( eff ) {
			map[ b.clientId ] = eff;
		}
		if ( b.innerBlocks && b.innerBlocks.length ) {
			buildBgMap( b.innerBlocks, colors, eff, map );
		}
	}
	return map;
}

// #11 — Color overrides outside the design-system palette (Warning). Flags a
// custom hex/rgb from the "Custom" picker; palette slugs are fine.
export function checkColorOverrides( blocks ) {
	const out = [];
	for ( const b of blocks ) {
		const style =
			b.attributes && b.attributes.style && b.attributes.style.color;
		if ( ! style ) {
			continue;
		}
		const where = [];
		if ( isCustomColor( style.text ) ) {
			where.push( 'text' );
		}
		if ( isCustomColor( style.background ) ) {
			where.push( 'background' );
		}
		if ( where.length ) {
			out.push( {
				clientId: b.clientId,
				checkId: 11,
				severity: SEVERITY.WARNING,
				title: `Custom ${ where.join(
					' & '
				) } color isn’t in your palette`,
				description:
					'This block uses a custom color instead of one from your palette. Custom colors can hurt contrast and look inconsistent — use a palette color where you can.',
			} );
		}
	}
	return out;
}

// #12 — Color contrast errors (Error). Only fires when a text-bearing block has
// an explicit text color AND an explicit background (own or inherited from a
// direct ancestor), so it never guesses against an unknown default surface.
export function checkContrast( blocks, context = {} ) {
	const colors = context.colors || {};
	// Live path supplies a precomputed effective-background map (own + ancestor,
	// resolved via getBlockParents); the fixture path falls back to a tree walk.
	const bgMap =
		context.effectiveBg || buildBgMap( context.tree || [], colors );
	const TEXT_BLOCKS = [
		'core/paragraph',
		'core/heading',
		'core/list',
		'core/list-item',
		'core/quote',
	];
	const out = [];
	for ( const b of blocks ) {
		if ( ! TEXT_BLOCKS.includes( b.name ) ) {
			continue;
		}
		const text = blockText( b, colors );
		const bg = blockBg( b, colors ) || bgMap[ b.clientId ];
		if ( ! text || ! bg ) {
			continue;
		}
		const r = ratio( text, bg );
		if ( r && r < 4.5 ) {
			out.push( {
				clientId: b.clientId,
				checkId: 12,
				severity: SEVERITY.ERROR,
				title: `Text contrast is too low (${ r.toFixed( 1 ) }:1)`,
				description: `The contrast between this text and its background is ${ r.toFixed(
					2
				) }:1. To meet WCAG AA, normal text needs at least 4.5:1 (large text 3:1). Choose colors with more contrast.`,
			} );
		}
	}
	return out;
}

// Fully transparent CSS color values. Gutenberg's Highlight format writes
// background-color: rgba(0, 0, 0, 0) onto <mark> when the author picks ONLY a
// text color (to suppress the browser's default yellow). That's "no background",
// not black — naive parsing reads it as #000 and produces bogus contrast errors.
function isTransparent( value ) {
	const v = String( value ).trim().toLowerCase();
	return (
		v === 'transparent' ||
		/^(?:rgba|hsla)\([^)]*[,\s/]0(?:\.0+)?\s*\)$/.test( v )
	);
}

// Resolve a <mark>'s text/background color from its inline style (rgb/hex) or
// its WordPress palette class (has-{slug}-color / has-{slug}-background-color).
function colorFromMark( el, prop, colors ) {
	const inline = prop === 'color' ? el.style.color : el.style.backgroundColor;
	if ( inline && prop === 'background-color' && isTransparent( inline ) ) {
		return null; // see-through — judge against the block's effective background
	}
	if ( inline ) {
		return inline;
	}
	const classAttr = el.getAttribute( 'class' ) || '';
	if ( prop === 'background-color' ) {
		const m = classAttr.match( /has-([a-z0-9-]+)-background-color/ );
		return m && colors[ m[ 1 ] ] ? colors[ m[ 1 ] ] : null;
	}
	// Text color: strip background-color classes AND the marker class
	// `has-inline-color` (which would otherwise match as slug "inline" and
	// shadow the real palette class) so the slug match is clean.
	const cleaned = classAttr
		.replace( /has-[a-z0-9-]+-background-color/g, '' )
		.replace( /\bhas-inline-color\b/g, '' );
	const m = cleaned.match( /has-([a-z0-9-]+)-color/ );
	return m && colors[ m[ 1 ] ] ? colors[ m[ 1 ] ] : null;
}

// #17 — Highlighted-text (<mark>) contrast (Error). WordPress's Highlight format
// wraps a passage in <mark> with its own text + background color; #12 only looks
// at block-level colors, so a low-contrast highlight slips through. Reads the
// mark's own colors (inline style or palette class), falling back to the block's
// text color and effective background.
export function checkMarkContrast( blocks, context = {} ) {
	if ( typeof DOMParser === 'undefined' ) {
		return [];
	}
	const colors = context.colors || {};
	const bgMap =
		context.effectiveBg || buildBgMap( context.tree || [], colors );
	const out = [];
	for ( const b of blocks ) {
		const chunks = richTextHtml( b ).filter( ( html ) =>
			/<mark/i.test( html )
		);
		if ( ! chunks.length ) {
			continue;
		}
		const blockFg = blockText( b, colors ) || '#161616';
		const blockBgColor =
			blockBg( b, colors ) || bgMap[ b.clientId ] || null;
		let flagged = false;
		for ( const html of chunks ) {
			if ( flagged ) {
				break;
			}
			let doc;
			try {
				doc = new DOMParser().parseFromString(
					`<div>${ html }</div>`,
					'text/html'
				);
			} catch ( e ) {
				continue;
			}
			doc.querySelectorAll( 'mark' ).forEach( ( mark ) => {
				if ( flagged ) {
					return; // one finding per block is enough
				}
				const fg = colorFromMark( mark, 'color', colors ) || blockFg;
				const bg =
					colorFromMark( mark, 'background-color', colors ) ||
					blockBgColor;
				if ( ! bg ) {
					return; // nothing to judge the highlight against
				}
				const r = ratio( fg, bg );
				if ( r && r < 4.5 ) {
					flagged = true;
					out.push( {
						clientId: b.clientId,
						checkId: 17,
						severity: SEVERITY.ERROR,
						title: `Highlighted text contrast is too low (${ r.toFixed(
							1
						) }:1)`,
						description: `A highlighted passage (added with the Highlight format) has ${ r.toFixed(
							2
						) }:1 contrast between its text and highlight color. WCAG AA needs at least 4.5:1 (large text 3:1). Pick a darker or lighter highlight, or change the text color.`,
					} );
				}
			} );
		}
	}
	return out;
}

// #13 — Tables without proper header cells (Warning).
export function checkTableHeaders( blocks ) {
	const out = [];
	for ( const b of blocks ) {
		if ( b.name !== 'core/table' ) {
			continue;
		}
		const head = attr( b, 'head', [] );
		const body = attr( b, 'body', [] );
		const hasHeadCells =
			Array.isArray( head ) &&
			head.some( ( r ) => r && r.cells && r.cells.length );
		const hasBody = Array.isArray( body ) && body.length > 0;
		if ( ! hasHeadCells && hasBody ) {
			out.push( {
				clientId: b.clientId,
				checkId: 13,
				severity: SEVERITY.WARNING,
				title: 'Table has no header row',
				description:
					'Add a header row so screen-reader users can tell which column each cell belongs to.',
			} );
		}
	}
	return out;
}

// #14 — Inline SVG with no accessible name (Warning). Image-based SVGs with
// empty alt are covered by #1; this targets inline <svg> in core/html.
export function checkSvgName( blocks ) {
	if ( typeof DOMParser === 'undefined' ) {
		return [];
	}
	const out = [];
	for ( const b of blocks ) {
		if ( b.name !== 'core/html' ) {
			continue;
		}
		const html = String( attr( b, 'content', '' ) );
		if ( ! /<svg/i.test( html ) ) {
			continue;
		}
		try {
			const doc = new DOMParser().parseFromString( html, 'text/html' );
			let flagged = false;
			doc.querySelectorAll( 'svg' ).forEach( ( svg ) => {
				if ( flagged ) {
					return;
				}
				const hidden = svg.getAttribute( 'aria-hidden' ) === 'true';
				const named =
					!! svg.querySelector( 'title' ) ||
					svg.hasAttribute( 'aria-label' ) ||
					svg.hasAttribute( 'aria-labelledby' );
				if ( ! hidden && ! named ) {
					flagged = true;
				}
			} );
			if ( flagged ) {
				out.push( {
					clientId: b.clientId,
					checkId: 14,
					severity: SEVERITY.WARNING,
					title: 'Inline SVG has no accessible name',
					description:
						'Add a <title> element or aria-label to the SVG, or mark it aria-hidden="true" if it’s decorative.',
				} );
			}
		} catch ( e ) {}
	}
	return out;
}

/* ------------------------------------------------------------------ *
 * Registry
 * ------------------------------------------------------------------ */

export const WAVE_A_CHECKS = [
	checkImageAlt,
	checkHeadingSkips,
	checkEmptyImageLinks,
	checkNonDescriptiveLinks,
	checkDocumentLang,
];

export const WAVE_B_CHECKS = [
	checkIllogicalHeadingOrder,
	checkLineBreaks,
	checkAltFromFilename,
	checkIdenticalLinkText,
];

export const WAVE_C_CHECKS = [
	checkColorOverrides,
	checkContrast,
	checkMarkContrast,
	checkTableHeaders,
	checkSvgName,
];

export const ALL_CHECKS = [
	...WAVE_A_CHECKS,
	...WAVE_B_CHECKS,
	...WAVE_C_CHECKS,
];

/**
 * Run a check set over a block tree, returning all findings. A throwing check
 * is isolated so one bug can't take down the editor. Checks needing hierarchy
 * (e.g. #12's ancestor-background inheritance) read context.tree.
 * @param {Array}  blocks  Block tree (or flat list when context.flat).
 * @param {Object} context Run context ({ flat, tree, … }).
 * @param {Array}  checks  Check set to run.
 */
export function runChecks( blocks, context = {}, checks = ALL_CHECKS ) {
	// `context.flat` means `blocks` is already a complete flat list (the live
	// path passes getClientIdsWithDescendants output, which includes controlled
	// blocks — post content + template parts — that .innerBlocks would miss).
	const flat = context.flat ? blocks : flatten( blocks );
	const ctx = {
		...context,
		tree: context.tree || ( context.flat ? [] : blocks ),
	};
	const findings = [];
	for ( const check of checks ) {
		try {
			findings.push( ...check( flat, ctx ) );
		} catch ( e ) {
			// A linter check must never break the editor.
		}
	}
	return findings;
}
