/**
 * AWT Tag — the full text of a cut-off label, as Carbon shows it.
 *
 * A label too long for the tag ends in an ellipsis. Carbon then wraps it in
 * its definition tooltip: a button around the label, with the full text in a
 * popover it opens on click, Enter or Space and closes on Escape or when focus
 * leaves (`openOnHover` off, as Carbon sets it for tags; the label's `title`
 * covers hover). This does the same, for plain tags only, and only while the
 * label is actually cut off. The check runs again when the tag changes size,
 * so text spacing or a font that loads late is caught too.
 */

import { store, getElement } from '@wordpress/interactivity';

const CONTAINER =
	'cds--popover-container cds--popover--caret cds--popover--high-contrast cds--popover--bottom cds--definition--tooltip--tag';

let counter = 0;

function isCut( label ) {
	return label.scrollWidth > label.clientWidth + 1;
}

function setOpen( container, button, open ) {
	container.classList.toggle( 'cds--popover--open', open );
	button.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
}

function wrap( tag, label ) {
	const doc = tag.ownerDocument;
	const id = `awt-tag-tip-${ ++counter }`;

	const container = doc.createElement( 'span' );
	container.className = CONTAINER;

	const button = doc.createElement( 'button' );
	button.type = 'button';
	button.className = 'cds--definition-term';
	button.setAttribute( 'aria-controls', id );
	button.setAttribute( 'aria-describedby', id );
	button.setAttribute( 'aria-expanded', 'false' );

	const popover = doc.createElement( 'span' );
	popover.id = id;
	popover.className = 'cds--popover';
	const content = doc.createElement( 'span' );
	content.className = 'cds--popover-content cds--definition-tooltip';
	content.textContent = label.textContent;
	const caret = doc.createElement( 'span' );
	caret.className = 'cds--popover-caret';
	popover.append( content, caret );

	label.replaceWith( container );
	button.append( label );
	container.append( button, popover );

	button.addEventListener( 'click', () =>
		setOpen(
			container,
			button,
			! container.classList.contains( 'cds--popover--open' )
		)
	);
	button.addEventListener( 'keydown', ( event ) => {
		if ( event.key === 'Escape' ) {
			setOpen( container, button, false );
		}
	} );
	button.addEventListener( 'blur', () =>
		setOpen( container, button, false )
	);
}

function unwrap( tag ) {
	const container = tag.querySelector( ':scope > .cds--popover-container' );
	const label = container?.querySelector( '.cds--tag__label' );
	if ( container && label ) {
		container.replaceWith( label );
	}
}

function update( tag ) {
	const label = tag.querySelector( '.cds--tag__label' );
	if ( ! label ) {
		return;
	}
	const wrapped = tag.querySelector( ':scope > .cds--popover-container' );
	const cut = isCut( label );
	if ( cut && ! wrapped ) {
		wrap( tag, label );
	} else if ( ! cut && wrapped ) {
		unwrap( tag );
	}
}

store( 'awt/tag', {
	callbacks: {
		init() {
			const tag = getElement().ref;
			update( tag );
			const view = tag.ownerDocument.defaultView;
			if ( view.ResizeObserver ) {
				new view.ResizeObserver( () => update( tag ) ).observe( tag );
			}
			tag.ownerDocument.fonts?.ready.then( () => update( tag ) );
		},
	},
} );
