import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';

const ALLOWED = [ 'awt/tab', 'awt/tab-panel' ];
const TEMPLATE = [
	[ 'awt/tab', { label: 'Tab 1' } ],
	[ 'awt/tab', { label: 'Tab 2' } ],
	[
		'awt/tab-panel',
		{},
		[ [ 'core/paragraph', { content: 'First tab panel content.' } ] ],
	],
	[
		'awt/tab-panel',
		{},
		[ [ 'core/paragraph', { content: 'Second tab panel content.' } ] ],
	],
];

export default function Edit( { attributes, setAttributes } ) {
	const { orientation, ariaLabel } = attributes;
	// Pass blockProps to useInnerBlocksProps so our `cds--tabs` classes survive
	// the merge with Gutenberg's own block-list wrapper class.
	//
	// The published page nests a tab list inside this wrapper and keeps the panels
	// as its siblings. Reproducing that here would mean splitting tab vs tab-panel
	// children into two outputs, which InnerBlocks can't do — so the children stay
	// flat under this one wrapper and theme.css places them by block class.
	//
	// That also rules out putting the tab list's own class on this element: every
	// rule keyed on it expects the list to be a separate element inside
	// `.cds--tabs`, so here it would match nothing, and on a real inner element it
	// would treat the panels as tabs — laying them out beside the buttons in one
	// scrolling row, or inside the vertical layout's narrow first column. The
	// class-parity check records that as a deliberate difference.
	const blockProps = useBlockProps( {
		className: `cds--tabs cds--tabs--${ orientation }`,
	} );
	const innerProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED,
		template: TEMPLATE,
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Tabs', 'awt' ) } initialOpen={ true }>
					<SelectControl
						label={ __( 'Orientation', 'awt' ) }
						value={ orientation }
						options={ [
							{ label: 'Horizontal', value: 'horizontal' },
							{ label: 'Vertical', value: 'vertical' },
						] }
						onChange={ ( v ) =>
							setAttributes( { orientation: v } )
						}
					/>
					<TextControl
						label={ __( 'Accessible name (aria-label)', 'awt' ) }
						value={ ariaLabel }
						onChange={ ( v ) => setAttributes( { ariaLabel: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerProps } />
		</>
	);
}
