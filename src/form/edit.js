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

const METHOD_OPTIONS = [
	{ label: 'POST', value: 'post' },
	{ label: 'GET', value: 'get' },
];

const ALLOWED = [
	'awt/text-input',
	'awt/checkbox',
	'awt/radio-button-group',
	'awt/toggle',
	'awt/button',
	'core/paragraph',
	'core/heading',
];

const TEMPLATE = [
	[
		'awt/text-input',
		{ label: 'Email', type: 'email', name: 'email', required: true },
	],
	[ 'awt/button', { text: 'Submit', kind: 'primary' } ],
];

export default function Edit( { attributes, setAttributes } ) {
	const {
		action,
		method,
		enctype,
		novalidate,
		ariaLabel,
		legend,
		description,
	} = attributes;
	const blockProps = useBlockProps( { className: 'cds--form' } );
	const innerProps = useInnerBlocksProps(
		{},
		{ allowedBlocks: ALLOWED, template: TEMPLATE, orientation: 'vertical' }
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form', 'awt-blocks' ) }>
					<TextControl
						label={ __( 'Action URL', 'awt-blocks' ) }
						value={ action }
						onChange={ ( v ) => setAttributes( { action: v } ) }
					/>
					<SelectControl
						label={ __( 'Method', 'awt-blocks' ) }
						value={ method }
						options={ METHOD_OPTIONS }
						onChange={ ( v ) => setAttributes( { method: v } ) }
					/>
					<TextControl
						label={ __( 'Enctype', 'awt-blocks' ) }
						value={ enctype }
						onChange={ ( v ) => setAttributes( { enctype: v } ) }
						help={ __(
							'Typically multipart/form-data for file uploads.',
							'awt-blocks'
						) }
					/>
					<ToggleControl
						label={ __(
							'Skip browser validation (novalidate)',
							'awt-blocks'
						) }
						checked={ novalidate }
						onChange={ ( v ) => setAttributes( { novalidate: v } ) }
					/>
					<TextControl
						label={ __(
							'Accessible name (aria-label)',
							'awt-blocks'
						) }
						value={ ariaLabel }
						onChange={ ( v ) => setAttributes( { ariaLabel: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Header', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __( 'Legend', 'awt-blocks' ) }
						value={ legend }
						onChange={ ( v ) => setAttributes( { legend: v } ) }
						help={ __(
							'Renders as <h2> at the top of the form.',
							'awt-blocks'
						) }
					/>
					<TextControl
						label={ __( 'Description', 'awt-blocks' ) }
						value={ description }
						onChange={ ( v ) =>
							setAttributes( { description: v } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<form { ...blockProps } onSubmit={ ( e ) => e.preventDefault() }>
				{ ( legend || description ) && (
					<div className="cds--form__header">
						{ legend && (
							<h2 className="cds--form__title">{ legend }</h2>
						) }
						{ description && (
							<p className="cds--form__description">
								{ description }
							</p>
						) }
					</div>
				) }
				<div { ...innerProps } />
			</form>
		</>
	);
}
