/**
 * A block's icon in the inserter, the toolbar, List View and "Transform to",
 * drawn from a Carbon icon.
 *
 * Each block's index.js imports its own icon from @carbon/icons (the 32px
 * grid, which reads best at the 24px the editor draws) and passes it here.
 * Carbon ships each icon as a plain description of its SVG; this turns that
 * into the element WordPress expects. The icon is decorative: the block's
 * title is always shown or announced beside it.
 */

import { createElement } from '@wordpress/element';

// Carbon writes SVG attributes as in markup (`stroke-width`); React wants
// them camel-cased (`strokeWidth`).
const reactName = ( name ) =>
	name.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );

function toElement( { elem, attrs = {}, content = [] }, key ) {
	const props = { key };
	for ( const [ name, value ] of Object.entries( attrs ) ) {
		props[ reactName( name ) ] = value;
	}
	return createElement( elem, props, ...content.map( toElement ) );
}

/**
 * @param {Object} descriptor A Carbon icon, e.g. the default export of
 *                            `@carbon/icons/es/list--bulleted/32`.
 * @return {Element} An SVG element, 24px.
 */
export function blockIcon( descriptor ) {
	const svg = toElement( descriptor );
	return createElement( 'svg', {
		...svg.props,
		key: undefined,
		width: 24,
		height: 24,
		'aria-hidden': true,
		focusable: false,
	} );
}
