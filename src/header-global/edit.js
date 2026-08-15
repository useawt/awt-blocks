import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

const ALLOWED = [
	'awt/header-action',
	'awt/color-scheme-toggle',
	'awt/button',
];
const TEMPLATE = [
	[
		'awt/header-action',
		{ iconName: 'search', label: 'Search', panelId: 'search-panel' },
	],
	[ 'awt/color-scheme-toggle', {} ],
];

export default function Edit( { attributes, setAttributes } ) {
	const { ariaLabel } = attributes;
	const blockProps = useBlockProps( {
		className: 'cds--header__global',
		'aria-label': ariaLabel || undefined,
		style: { display: 'flex', gap: '0.5rem', marginInlineStart: 'auto' },
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED,
		template: TEMPLATE,
		orientation: 'horizontal',
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Header global actions', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __(
							'Region label (aria-label, optional)',
							'awt-blocks'
						) }
						value={ ariaLabel }
						onChange={ ( value ) =>
							setAttributes( { ariaLabel: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
