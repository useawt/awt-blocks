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
} from '@wordpress/components';
import CarbonDefaultToggle, {
	fieldFrameClass,
} from '../shared/carbon-default-toggle';

const SIZE_OPTIONS = [
	{ label: 'Small (sm)', value: 'sm' },
	{ label: 'Medium (md)', value: 'md' },
	{ label: 'Large (lg)', value: 'lg' },
];

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		label,
		name,
		placeholder,
		helperText,
		invalid,
		invalidText,
		warn,
		warnText,
		disabled,
		required,
		size,
		hideLabel,
		showLabel,
		hidePasswordLabel,
		autocomplete,
		carbonDefault,
	} = attributes;
	const id = `awt-pi-${ clientId.slice( 0, 8 ) }`;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Password input', 'awt' ) }>
					<TextControl
						label={ __( 'Name', 'awt' ) }
						value={ name }
						onChange={ ( v ) => setAttributes( { name: v } ) }
					/>
					<TextControl
						label={ __( 'Placeholder', 'awt' ) }
						value={ placeholder }
						onChange={ ( v ) =>
							setAttributes( { placeholder: v } )
						}
					/>
					<SelectControl
						label={ __( 'Size', 'awt' ) }
						value={ size }
						options={ SIZE_OPTIONS }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<ToggleControl
						label={ __( 'Required', 'awt' ) }
						checked={ required }
						onChange={ ( v ) => setAttributes( { required: v } ) }
					/>
					<ToggleControl
						label={ __( 'Disabled', 'awt' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
					<ToggleControl
						label={ __( 'Visually hide label', 'awt' ) }
						checked={ hideLabel }
						onChange={ ( v ) => setAttributes( { hideLabel: v } ) }
					/>
					<TextControl
						label={ __( 'Autocomplete', 'awt' ) }
						value={ autocomplete }
						onChange={ ( v ) =>
							setAttributes( { autocomplete: v } )
						}
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
					title={ __( 'Toggle button labels', 'awt' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __( 'Show-password label', 'awt' ) }
						value={ showLabel }
						onChange={ ( v ) => setAttributes( { showLabel: v } ) }
					/>
					<TextControl
						label={ __( 'Hide-password label', 'awt' ) }
						value={ hidePasswordLabel }
						onChange={ ( v ) =>
							setAttributes( { hidePasswordLabel: v } )
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
					<ToggleControl
						label={ __( 'Warning', 'awt' ) }
						checked={ warn }
						onChange={ ( v ) => setAttributes( { warn: v } ) }
					/>
					<TextControl
						label={ __( 'Warning message', 'awt' ) }
						value={ warnText }
						onChange={ ( v ) => setAttributes( { warnText: v } ) }
						disabled={ ! warn }
					/>
				</PanelBody>
			</InspectorControls>
			<div
				{ ...useBlockProps( {
					className: [
						'cds--form-item cds--text-input-wrapper cds--password-input-wrapper',
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
				<div className="cds--text-input__field-outer-wrapper">
					<div
						className={ [
							'cds--text-input__field-wrapper',
							invalid
								? 'cds--text-input__field-wrapper--invalid'
								: null,
							warn && ! invalid
								? 'cds--text-input__field-wrapper--warning'
								: null,
						]
							.filter( Boolean )
							.join( ' ' ) }
						// Carbon reveals the error message from
						// `[data-invalid]`, not from the `--invalid`
						// class above. Mirrors render.php; see the note
						// in text-input/edit.js.
						data-invalid={ invalid ? 'true' : undefined }
					>
						<input
							id={ id }
							type="password"
							className={ [
								'cds--text-input',
								`cds--text-input--${ size }`,
								`cds--layout--size-${ size }`,
								'cds--password-input',
								invalid ? 'cds--text-input--invalid' : null,
								warn && ! invalid
									? 'cds--text-input--warning'
									: null,
							]
								.filter( Boolean )
								.join( ' ' ) }
							placeholder={ placeholder }
							disabled={ disabled }
							readOnly
							aria-invalid={ invalid ? 'true' : undefined }
						/>
						<button
							type="button"
							className="cds--text-input--password__visibility__toggle"
							aria-label={ showLabel }
							disabled={ disabled }
							onClick={ ( e ) => e.preventDefault() }
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								width="16"
								height="16"
								fill="currentColor"
								aria-hidden="true"
								focusable="false"
							>
								<path d="M8 3C4.5 3 1.7 5 .3 8 1.7 11 4.5 13 8 13c3.5 0 6.3-2 7.7-5C14.3 5 11.5 3 8 3zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5S6.1 4.5 8 4.5s3.5 1.6 3.5 3.5S9.9 11.5 8 11.5z" />
								<circle cx="8" cy="8" r="2" />
							</svg>
						</button>
					</div>
					{ invalid && invalidText && (
						<div className="cds--form-requirement">
							{ invalidText }
						</div>
					) }
					{ warn && ! invalid && warnText && (
						<div className="cds--form-requirement">
							{ warnText }
						</div>
					) }
				</div>
				{ helperText && (
					<div className="cds--form__helper-text">{ helperText }</div>
				) }
			</div>
		</>
	);
}
