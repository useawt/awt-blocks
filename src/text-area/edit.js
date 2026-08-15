import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import CarbonDefaultToggle, {
	fieldFrameClass,
} from '../shared/carbon-default-toggle';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		label,
		name,
		placeholder,
		value,
		rows,
		cols,
		helperText,
		invalid,
		invalidText,
		warn,
		warnText,
		disabled,
		readonly,
		required,
		maxlength,
		hideLabel,
		carbonDefault,
	} = attributes;
	const id = `awt-ta-${ clientId.slice( 0, 8 ) }`;

	const wrapperClasses = [
		'cds--form-item',
		'cds--text-area-wrapper',
		readonly ? 'cds--text-area-wrapper--readonly' : null,
		fieldFrameClass( carbonDefault ),
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Text area', 'awt-blocks' ) }>
					<TextControl
						label={ __( 'Name', 'awt-blocks' ) }
						value={ name }
						onChange={ ( v ) => setAttributes( { name: v } ) }
					/>
					<TextControl
						label={ __( 'Placeholder', 'awt-blocks' ) }
						value={ placeholder }
						onChange={ ( v ) =>
							setAttributes( { placeholder: v } )
						}
					/>
					<TextControl
						label={ __( 'Default value', 'awt-blocks' ) }
						value={ value }
						onChange={ ( v ) => setAttributes( { value: v } ) }
					/>
					<TextControl
						label={ __( 'Rows', 'awt-blocks' ) }
						type="number"
						value={ rows }
						onChange={ ( v ) =>
							setAttributes( { rows: Number( v ) || 4 } )
						}
					/>
					<TextControl
						label={ __( 'Cols (0 = auto)', 'awt-blocks' ) }
						type="number"
						value={ cols }
						onChange={ ( v ) =>
							setAttributes( { cols: Number( v ) || 0 } )
						}
					/>
					<TextControl
						label={ __( 'Maxlength', 'awt-blocks' ) }
						type="number"
						value={ maxlength }
						onChange={ ( v ) =>
							setAttributes( { maxlength: Number( v ) || 0 } )
						}
					/>
					<ToggleControl
						label={ __( 'Required', 'awt-blocks' ) }
						checked={ required }
						onChange={ ( v ) => setAttributes( { required: v } ) }
					/>
					<ToggleControl
						label={ __( 'Disabled', 'awt-blocks' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
					<ToggleControl
						label={ __( 'Readonly', 'awt-blocks' ) }
						checked={ readonly }
						onChange={ ( v ) => setAttributes( { readonly: v } ) }
					/>
					<ToggleControl
						label={ __( 'Visually hide label', 'awt-blocks' ) }
						checked={ hideLabel }
						onChange={ ( v ) => setAttributes( { hideLabel: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Style', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<CarbonDefaultToggle
						value={ carbonDefault }
						onChange={ ( v ) =>
							setAttributes( { carbonDefault: v } )
						}
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
						label={ __( 'Invalid', 'awt-blocks' ) }
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
					<ToggleControl
						label={ __( 'Warning', 'awt-blocks' ) }
						checked={ warn }
						onChange={ ( v ) => setAttributes( { warn: v } ) }
					/>
					<TextControl
						label={ __( 'Warning message', 'awt-blocks' ) }
						value={ warnText }
						onChange={ ( v ) => setAttributes( { warnText: v } ) }
						disabled={ ! warn }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps( { className: wrapperClasses } ) }>
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
					placeholder={ __( 'Label', 'awt-blocks' ) }
					allowedFormats={ [] }
				/>
				<div
					className={ [
						'cds--text-area__wrapper',
						invalid ? 'cds--text-area__wrapper--invalid' : null,
						warn ? 'cds--text-area__wrapper--warn' : null,
					]
						.filter( Boolean )
						.join( ' ' ) }
					{ ...( invalid && { 'data-invalid': 'true' } ) }
					{ ...( ! invalid && warn && { 'data-warn': 'true' } ) }
				>
					<textarea
						id={ id }
						className={ [
							'cds--text-area',
							invalid ? 'cds--text-area--invalid' : null,
							warn ? 'cds--text-area--warn' : null,
						]
							.filter( Boolean )
							.join( ' ' ) }
						placeholder={ placeholder }
						defaultValue={ value }
						rows={ rows }
						cols={ cols || undefined }
						disabled={ disabled }
						readOnly={ readonly || true }
					/>
					{ invalid && (
						<svg
							focusable="false"
							preserveAspectRatio="xMidYMid meet"
							fill="currentColor"
							width="16"
							height="16"
							viewBox="0 0 16 16"
							aria-hidden="true"
							className="cds--text-area__invalid-icon"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path d="M8,1C4.2,1,1,4.2,1,8s3.2,7,7,7s7-3.1,7-7S11.9,1,8,1z M7.5,4h1v5h-1V4z M8,12.2 c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z" />
						</svg>
					) }
					{ ! invalid && warn && (
						<svg
							focusable="false"
							preserveAspectRatio="xMidYMid meet"
							fill="currentColor"
							width="16"
							height="16"
							viewBox="0 0 32 32"
							aria-hidden="true"
							className="cds--text-area__invalid-icon cds--text-area__invalid-icon--warning"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fill="none"
								d="M16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Zm-1.125-5h2.25V12h-2.25Z"
								data-icon-path="inner-path"
							/>
							<path d="M16.002,6.1714h-.004L4.6487,27.9966,4.6506,28H27.3494l.0019-.0034ZM14.875,12h2.25v9h-2.25ZM16,26a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,26Z" />
							<path d="M29,30H3a1,1,0,0,1-.8872-1.4614l13-25a1,1,0,0,1,1.7744,0l13,25A1,1,0,0,1,29,30ZM4.6507,28H27.3493l.0019-.0034L16.002,6.1714h-.004L4.6487,27.9966Z" />
						</svg>
					) }
				</div>
				{ invalid && invalidText && (
					<div className="cds--form-requirement">{ invalidText }</div>
				) }
				{ warn && ! invalid && warnText && (
					<div className="cds--form-requirement">{ warnText }</div>
				) }
				{ helperText && (
					<div className="cds--form__helper-text">{ helperText }</div>
				) }
			</div>
		</>
	);
}
