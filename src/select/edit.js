import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ToggleControl,
	TextareaControl,
} from '@wordpress/components';
import CarbonDefaultToggle, {
	fieldFrameClass,
} from '../shared/carbon-default-toggle';

function parseOptions( raw ) {
	return raw
		.split( '\n' )
		.map( ( line ) => {
			const [ value, ...rest ] = line.split( '|' );
			const label =
				rest.length > 0 ? rest.join( '|' ).trim() : value.trim();
			return value.trim() ? { value: value.trim(), label } : null;
		} )
		.filter( Boolean );
}

function stringifyOptions( opts ) {
	return ( opts || [] )
		.map( ( o ) => `${ o.value }|${ o.label }` )
		.join( '\n' );
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		label,
		name,
		helperText,
		invalid,
		invalidText,
		disabled,
		required,
		size,
		hideLabel,
		placeholder,
		options,
		carbonDefault,
	} = attributes;
	const id = `awt-select-${ clientId.slice( 0, 8 ) }`;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Select', 'awt' ) }>
					<TextControl
						label={ __( 'Name', 'awt' ) }
						value={ name }
						onChange={ ( v ) => setAttributes( { name: v } ) }
					/>
					<TextControl
						label={ __( 'Placeholder (first option)', 'awt' ) }
						value={ placeholder }
						onChange={ ( v ) =>
							setAttributes( { placeholder: v } )
						}
					/>
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
					<ToggleControl
						label={ __( 'Disabled', 'awt' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
					<ToggleControl
						label={ __( 'Required', 'awt' ) }
						checked={ required }
						onChange={ ( v ) => setAttributes( { required: v } ) }
					/>
					<ToggleControl
						label={ __( 'Visually hide label', 'awt' ) }
						checked={ hideLabel }
						onChange={ ( v ) => setAttributes( { hideLabel: v } ) }
					/>
					<TextareaControl
						label={ __(
							'Options (one per line: value|label)',
							'awt'
						) }
						value={ stringifyOptions( options ) }
						onChange={ ( v ) =>
							setAttributes( { options: parseOptions( v ) } )
						}
						rows={ 6 }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Style', 'awt' ) } initialOpen={ false }>
					<CarbonDefaultToggle
						value={ carbonDefault }
						onChange={ ( v ) =>
							setAttributes( { carbonDefault: v } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Help & validation', 'awt' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __( 'Helper text', 'awt' ) }
						value={ helperText }
						onChange={ ( v ) => setAttributes( { helperText: v } ) }
					/>
					<ToggleControl
						label={ __( 'Invalid', 'awt' ) }
						checked={ invalid }
						onChange={ ( v ) => setAttributes( { invalid: v } ) }
					/>
					<TextControl
						label={ __( 'Invalid message', 'awt' ) }
						value={ invalidText }
						onChange={ ( v ) =>
							setAttributes( { invalidText: v } )
						}
						disabled={ ! invalid }
					/>
				</PanelBody>
			</InspectorControls>
			<div
				{ ...useBlockProps( {
					className: [
						'cds--form-item cds--select',
						fieldFrameClass( carbonDefault ),
					]
						.filter( Boolean )
						.join( ' ' ),
				} ) }
			>
				<RichText
					tagName="label"
					htmlFor={ id }
					className={ [
						'cds--label',
						hideLabel ? 'cds--visually-hidden' : null,
					]
						.filter( Boolean )
						.join( ' ' ) }
					value={ label }
					onChange={ ( v ) => setAttributes( { label: v } ) }
					placeholder={ __( 'Label', 'awt' ) }
					allowedFormats={ [] }
				/>
				<div className="cds--select-input__wrapper">
					<select
						id={ id }
						className={ `cds--select-input cds--select-input--${ size } cds--layout--size-${ size }${
							invalid ? ' cds--select-input--invalid' : ''
						}` }
						disabled={ disabled }
						defaultValue=""
					>
						{ /* Visible + disabled, never `hidden` — see render.php. */ }
						{ !! placeholder && (
							<option value="" disabled>
								{ placeholder }
							</option>
						) }
						{ ( options || [] ).map( ( o ) => (
							<option key={ o.value } value={ o.value }>
								{ o.label }
							</option>
						) ) }
					</select>
					<svg
						className="cds--select__arrow"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						width="16"
						height="16"
						fill="currentColor"
						aria-hidden="true"
						focusable="false"
					>
						<path d="M8 11L3 6l.7-.7L8 9.6l4.3-4.3.7.7z" />
					</svg>
				</div>
				{ invalid && invalidText && (
					<div className="cds--form-requirement">{ invalidText }</div>
				) }
				{ helperText && (
					<div className="cds--form__helper-text">{ helperText }</div>
				) }
			</div>
		</>
	);
}
