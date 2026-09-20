/**
 * Shared import helpers for the List and Data table blocks.
 *
 * `sanitizeInlineHtml` reduces pasted/imported HTML to a tight inline allowlist
 * — links, emphasis, inline code, line breaks, images — stripping every other
 * attribute (class, style, id, data-*, on*) and unwrapping unknown tags (so the
 * text inside a `<span class="…">` survives, the wrapper doesn't). Dangerous
 * tags (script/style/svg/iframe/…) are removed wholesale. It mirrors the PHP
 * `inline_kses_allowed()` allowlist in render-helpers.php; the server runs the
 * same allowlist on render as the real security boundary, this is the
 * clean-storage + faithful-preview layer.
 *
 * `mdInline` converts inline Markdown (links, bold, italic, code, images) to
 * that same safe HTML — it escapes first, so raw HTML/SVG embedded in Markdown
 * becomes inert text.
 */

// tag -> allowed attribute names. Mirror of PHP inline_kses_allowed().
const ALLOWED = {
	a: [ 'href', 'title', 'target', 'rel' ],
	strong: [],
	b: [],
	em: [],
	i: [],
	code: [],
	br: [],
	img: [ 'src', 'alt', 'width', 'height' ],
};

// Tags removed entirely, contents and all (not unwrapped) — never want their
// payload as text either.
const DROP_WITH_CONTENT = new Set( [
	'script',
	'style',
	'svg',
	'iframe',
	'object',
	'embed',
	'template',
	'noscript',
	'math',
	'link',
	'meta',
] );

// Allowed URL shapes for href/src. Everything else (javascript:, data:, vbscript:…) is dropped.
const SAFE_URL = /^\s*(https?:|mailto:|tel:|#|\/|\.|[^:]*$)/i;

function escapeHtml( s ) {
	return String( s )
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
}

function cleanEl( el ) {
	const tag = el.tagName.toLowerCase();
	if ( DROP_WITH_CONTENT.has( tag ) ) {
		el.remove();
		return;
	}
	// Clean descendants first (snapshot — we mutate the tree).
	Array.from( el.children ).forEach( cleanEl );

	const allowedAttrs = ALLOWED[ tag ];
	if ( ! allowedAttrs ) {
		// Unknown tag → unwrap, keeping its (already-cleaned) children.
		const parent = el.parentNode;
		if ( parent ) {
			while ( el.firstChild ) {
				parent.insertBefore( el.firstChild, el );
			}
			parent.removeChild( el );
		}
		return;
	}
	// Strip every attribute not on the per-tag allowlist; validate URLs.
	Array.from( el.attributes ).forEach( ( attr ) => {
		const name = attr.name.toLowerCase();
		if ( allowedAttrs.indexOf( name ) === -1 ) {
			el.removeAttribute( attr.name );
			return;
		}
		if (
			( name === 'href' || name === 'src' ) &&
			! SAFE_URL.test( attr.value )
		) {
			el.removeAttribute( attr.name );
		}
	} );
	// Harden new-tab links.
	if ( tag === 'a' && el.getAttribute( 'target' ) === '_blank' ) {
		el.setAttribute( 'rel', 'noopener noreferrer' );
	}
}

export function sanitizeInlineHtml( html ) {
	const raw = ( html || '' ).trim();
	if ( ! raw ) {
		return '';
	}
	const doc = new window.DOMParser().parseFromString(
		'<div id="__awt_root">' + raw + '</div>',
		'text/html'
	);
	const root = doc.getElementById( '__awt_root' );
	if ( ! root ) {
		return '';
	}
	Array.from( root.children ).forEach( cleanEl );
	return root.innerHTML.trim();
}

// Inline Markdown → safe HTML. Escapes literal HTML first (so embedded markup
// is inert), then turns Markdown tokens into the allowlisted tags, then runs
// the whole thing back through the sanitizer to validate URLs.
export function mdInline( s ) {
	let out = escapeHtml( s );
	out = out.replace(
		/!\[([^\]]*)\]\(([^)\s]+)\)/g,
		'<img src="$2" alt="$1" />'
	); // images (before links)
	out = out.replace( /\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>' ); // links
	out = out.replace( /(\*\*|__)(.+?)\1/g, '<strong>$2</strong>' );
	out = out.replace( /(\*|_)(.+?)\1/g, '<em>$2</em>' );
	out = out.replace( /`([^`]+)`/g, '<code>$1</code>' );
	return sanitizeInlineHtml( out );
}

// Comma-separated text → the trimmed values, empties dropped. Line breaks
// split as well, so a value never carries a stray line break into an item.
export function splitCommaSeparated( s ) {
	return String( s || '' )
		.split( /[,\r\n]+/ )
		.map( ( v ) => v.trim() )
		.filter( Boolean );
}

export { escapeHtml };
