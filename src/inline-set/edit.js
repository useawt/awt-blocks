import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';

const ALLOWED = [ 'awt/button', 'awt/link', 'awt/tag', 'awt/icon' ];

const TEMPLATE = [
	[ 'awt/button', { label: 'Primary action', kind: 'primary' } ],
	[ 'awt/button', { label: 'Secondary action', kind: 'secondary' } ],
];

const ORIENTATION = [
	{ label: __( 'Horizontal', 'awt-blocks' ), value: 'horizontal' },
	{ label: __( 'Vertical', 'awt-blocks' ), value: 'vertical' },
];

const GAP = [
	{ label: __( 'Small (0.25rem)', 'awt-blocks' ), value: 'sm' },
	{ label: __( 'Medium (0.5rem)', 'awt-blocks' ), value: 'md' },
	{ label: __( 'Large (1rem)', 'awt-blocks' ), value: 'lg' },
	{ label: __( 'X-large (1.5rem)', 'awt-blocks' ), value: 'xl' },
];

const ALIGN = [
	{ label: __( 'Start', 'awt-blocks' ), value: 'start' },
	{ label: __( 'Center', 'awt-blocks' ), value: 'center' },
	{ label: __( 'End', 'awt-blocks' ), value: 'end' },
	{ label: __( 'Space between', 'awt-blocks' ), value: 'between' },
];

export default function Edit( { attributes, setAttributes } ) {
	const { orientation, gap, align, wrap } = attributes;
	const classes = [
		'awt-inline-set',
		`awt-inline-set--${ orientation }`,
		`awt-inline-set--gap-${ gap }`,
		`awt-inline-set--align-${ align }`,
		wrap ? 'awt-inline-set--wrap' : 'awt-inline-set--nowrap',
	].join( ' ' );

	const blockProps = useBlockProps( { className: classes } );
	const innerProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		allowedBlocks: ALLOWED,
		orientation: orientation === 'vertical' ? 'vertical' : 'horizontal',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Inline set', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Orientation', 'awt-blocks' ) }
						value={ orientation }
						options={ ORIENTATION }
						onChange={ ( v ) =>
							setAttributes( { orientation: v } )
						}
					/>
					<SelectControl
						label={ __( 'Gap', 'awt-blocks' ) }
						value={ gap }
						options={ GAP }
						onChange={ ( v ) => setAttributes( { gap: v } ) }
					/>
					<SelectControl
						label={ __( 'Alignment', 'awt-blocks' ) }
						value={ align }
						options={ ALIGN }
						onChange={ ( v ) => setAttributes( { align: v } ) }
					/>
					<ToggleControl
						label={ __(
							'Wrap to next line when out of space',
							'awt-blocks'
						) }
						checked={ wrap }
						onChange={ ( v ) => setAttributes( { wrap: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerProps } />
		</>
	);
}
