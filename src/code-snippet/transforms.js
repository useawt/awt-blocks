/**
 * Transforms between the Code snippet block and WordPress's own Code block.
 *
 * The Code block keeps its code as HTML (`<` saved as `&lt;`); the Code
 * snippet keeps plain text. So the code is decoded on the way in and escaped
 * on the way out, and reads the same either way. The snippet's language, copy
 * button settings and inline or single-line layout have no counterpart in the
 * Code block and are left behind going out; coming in, the snippet is
 * multi-line with a copy button.
 */

import { createBlock } from '@wordpress/blocks';
import { escapeHtml } from '../shared/import-format';

// Code block HTML → the text it shows. Older Code blocks saved line breaks as
// <br>; newer ones keep them as real line breaks.
function codeText( value ) {
	const source = String( value ?? '' ).replace( /<br\s*\/?>/gi, '\n' );
	// A <div>, not a <pre>: the parser drops a line break right after <pre>.
	const doc = new window.DOMParser().parseFromString(
		`<div>${ source }</div>`,
		'text/html'
	);
	return doc.querySelector( 'div' )?.textContent ?? '';
}

const common = ( { anchor, className } ) => ( {
	...( anchor ? { anchor } : {} ),
	...( className ? { className } : {} ),
} );

export default {
	from: [
		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform: ( attributes ) =>
				createBlock( 'awt/code-snippet', {
					...common( attributes ),
					variant: 'multi',
					code: codeText( attributes.content ),
				} ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform: ( attributes ) =>
				createBlock( 'core/code', {
					...common( attributes ),
					content: escapeHtml( attributes.code ?? '' ),
				} ),
		},
	],
};
