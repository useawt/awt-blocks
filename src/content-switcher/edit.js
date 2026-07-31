import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

const ALLOWED = [ 'awt/content-switcher-item', 'awt/content-switcher-panel' ];
const TEMPLATE = [
	[ 'awt/content-switcher-item', { label: 'First' } ],
	[ 'awt/content-switcher-item', { label: 'Second' } ],
	[
		'awt/content-switcher-panel',
		{},
		[ [ 'core/paragraph', { content: 'First panel content.' } ] ],
	],
	[
		'awt/content-switcher-panel',
		{},
		[ [ 'core/paragraph', { content: 'Second panel content.' } ] ],
	],
];

export default function Edit( { attributes, setAttributes } ) {
	const { size, ariaLabel } = attributes;
	// Active segment index. Mirrors the published view store, which shows the
	// Nth panel for the Nth selected segment. InnerBlocks renders items and
	// panels in one flat flow; we can't split them into the published DOM
	// (a `.cds--content-switcher` tablist + sibling panels) natively. So we
	// reshape visually: editor CSS lays the item buttons out as a horizontal
	// segmented control with the panels stacked full-width below, and this
	// effect hides every panel except the active one + marks the active
	// segment selected — matching what a visitor sees on the front end.
	const [ active, setActive ] = useState( 0 );
	const listRef = useRef( null );

	// `cds--content-switcher` is the segmented control's own class: it carries the
	// group's visible edge, and every hover / active / focus rule for the segment
	// buttons is written as a descendant of it. The published markup puts it on an
	// inner element holding just the segments; here it has to sit on the wrapper
	// that also holds the panels, so theme.css undoes the two wrapper declarations
	// that assumption breaks (the fixed one-row height and the outline) and draws
	// the edge over the segment row instead.
	const blockProps = useBlockProps( {
		className: `awt-content-switcher awt-content-switcher--editor cds--content-switcher cds--content-switcher--${ size } cds--layout--size-${ size }`,
	} );
	const innerProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED,
		template: TEMPLATE,
	} );
	const mergedRef = useMergeRefs( [ innerProps.ref, listRef ] );

	useEffect( () => {
		const node = listRef.current;
		if ( ! node ) {
			return;
		}
		const apply = () => {
			const items = node.querySelectorAll(
				':scope > [data-type="awt/content-switcher-item"]'
			);
			const panels = node.querySelectorAll(
				':scope > [data-type="awt/content-switcher-panel"]'
			);
			const count = Math.max( items.length, panels.length );
			const act = count ? Math.min( active, count - 1 ) : 0;
			items.forEach( ( it, i ) => {
				it.dataset.awtSeg = String( i );
				// The item's block wrapper IS the <button.cds--content-switcher-btn>
				// (useBlockProps spreads onto the button), so toggle state on it
				// directly — fall back to a descendant if a future wrapper nests it.
				const btn = it.classList.contains( 'cds--content-switcher-btn' )
					? it
					: it.querySelector( '.cds--content-switcher-btn' );
				if ( btn ) {
					btn.classList.toggle(
						'cds--content-switcher--selected',
						i === act
					);
					btn.setAttribute(
						'aria-selected',
						i === act ? 'true' : 'false'
					);
				}
			} );
			panels.forEach( ( p, i ) =>
				p.toggleAttribute( 'hidden', i !== act )
			);
		};
		apply();
		// Re-apply when segments/panels are added or removed.
		const mo = new MutationObserver( apply );
		mo.observe( node, { childList: true } );
		const onClick = ( e ) => {
			const seg = e.target.closest(
				'[data-type="awt/content-switcher-item"]'
			);
			if ( seg && node.contains( seg ) ) {
				const idx = Number( seg.dataset.awtSeg );
				if ( ! Number.isNaN( idx ) ) {
					setActive( idx );
				}
			}
		};
		node.addEventListener( 'click', onClick );
		return () => {
			mo.disconnect();
			node.removeEventListener( 'click', onClick );
		};
	}, [ active ] );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Content switcher', 'awt' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Size', 'awt' ) }
						value={ size }
						options={ [
							{ label: 'sm', value: 'sm' },
							{ label: 'md', value: 'md' },
							{ label: 'lg', value: 'lg' },
						] }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<TextControl
						label={ __( 'Accessible name (aria-label)', 'awt' ) }
						value={ ariaLabel }
						onChange={ ( v ) => setAttributes( { ariaLabel: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerProps } ref={ mergedRef } />
		</>
	);
}
