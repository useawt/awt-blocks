/**
 * Column helpers shared by the Data table editor and its block transforms.
 */

// Make a stable column key from a header label (falls back to col1, col2 …).
export function slugifyKey( text, i ) {
	const s = String( text )
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-+|-+$/g, '' );
	return s || `col${ i + 1 }`;
}

// Plain text of a cell's HTML: option labels, column keys, captions.
export function plainText( html ) {
	const doc = new window.DOMParser().parseFromString(
		String( html || '' ),
		'text/html'
	);
	return ( doc.body.textContent || '' ).trim();
}

// De-duplicate column keys in place (Carbon needs one key per column).
export function dedupeKeys( headers ) {
	const seen = {};
	headers.forEach( ( h ) => {
		let k = h.key;
		while ( seen[ k ] ) {
			k = `${ k }-2`;
		}
		seen[ k ] = true;
		h.key = k;
	} );
	return headers;
}
