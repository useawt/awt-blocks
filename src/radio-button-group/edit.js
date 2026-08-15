import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';

const TEMPLATE = [
	[
		'awt/radio-button',
		{ label: 'Option one', value: 'one', checked: true },
	],
	[ 'awt/radio-button', { label: 'Option two', value: 'two' } ],
];

const ORIENTATION = [
	{ label: 'Horizontal', value: 'horizontal' },
	{ label: 'Vertical', value: 'vertical' },
];

const LABEL_POSITION = [
	{ label: 'Left', value: 'left' },
	{ label: 'Right', value: 'right' },
];

export default function Edit( { attributes, setAttributes } ) {
	const {
		name,
		legend,
		orientation,
		labelPosition,
		helperText,
		invalid,
		invalidText,
		required,
	} = attributes;
	const classes = [
		'cds--radio-button-group',
		`cds--radio-button-group--${ orientation }`,
		`cds--radio-button-group--label-${ labelPosition }`,
		invalid ? 'cds--radio-button-group--invalid' : null,
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps( { className: classes } );
	const innerProps = useInnerBlocksProps(
		{},
		{
			template: TEMPLATE,
			allowedBlocks: [ 'awt/radio-button' ],
			orientation: orientation === 'vertical' ? 'vertical' : 'horizontal',
		}
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Group', 'awt-blocks' ) }>
					<TextControl
						label={ __( 'Shared name attribute', 'awt-blocks' ) }
						value={ name }
						onChange={ ( v ) => setAttributes( { name: v } ) }
					/>
					<TextControl
						label={ __( 'Legend', 'awt-blocks' ) }
						value={ legend }
						onChange={ ( v ) => setAttributes( { legend: v } ) }
					/>
					<SelectControl
						label={ __( 'Orientation', 'awt-blocks' ) }
						value={ orientation }
						options={ ORIENTATION }
						onChange={ ( v ) =>
							setAttributes( { orientation: v } )
						}
					/>
					<SelectControl
						label={ __( 'Label position', 'awt-blocks' ) }
						value={ labelPosition }
						options={ LABEL_POSITION }
						onChange={ ( v ) =>
							setAttributes( { labelPosition: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Required', 'awt-blocks' ) }
						checked={ required }
						onChange={ ( v ) => setAttributes( { required: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Help & validation', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __( 'Helper text', 'awt-blocks' ) }
						value={ helperText }
						onChange={ ( v ) => setAttributes( { helperText: v } ) }
					/>
					<ToggleControl
						label={ __( 'Invalid state', 'awt-blocks' ) }
						checked={ invalid }
						onChange={ ( v ) => setAttributes( { invalid: v } ) }
					/>
					<TextControl
						label={ __( 'Invalid message', 'awt-blocks' ) }
						value={ invalidText }
						onChange={ ( v ) =>
							setAttributes( { invalidText: v } )
						}
						disabled={ ! invalid }
					/>
				</PanelBody>
			</InspectorControls>
			<fieldset { ...blockProps }>
				<legend className="cds--label">{ legend }</legend>
				<div { ...innerProps } />
				{ helperText && (
					<div className="cds--form__helper-text">{ helperText }</div>
				) }
				{ invalid && invalidText && (
					<div className="cds--form-requirement">{ invalidText }</div>
				) }
			</fieldset>
		</>
	);
}
