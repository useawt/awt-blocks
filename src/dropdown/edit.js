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
import OptionsField from '../shared/options-field';

export default function Edit( { attributes, setAttributes } ) {
	const {
		label,
		placeholder,
		helperText,
		invalid,
		invalidText,
		disabled,
		size,
		name,
		options,
		carbonDefault,
	} = attributes;
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Dropdown', 'awt-blocks' ) }>
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
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ [
							{ label: 'sm', value: 'sm' },
							{ label: 'md', value: 'md' },
							{ label: 'lg', value: 'lg' },
						] }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<ToggleControl
						label={ __( 'Disabled', 'awt-blocks' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
					<OptionsField
						options={ options }
						onChange={ ( v ) => setAttributes( { options: v } ) }
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
				</PanelBody>
			</InspectorControls>
			{ /* Mirror render.php structure: outer .cds--dropdown__wrapper, then
			     a .cds--dropdown.cds--list-box.cds--list-box--<size> root which
			     contains a .cds--list-box__field BUTTON. Carbon's CSS rules key
			     off these specific class chains — without them the editor preview
			     misses border, focus ring, and density sizing. No inline styles. */ }
			<div
				{ ...useBlockProps( {
					className: [
						'cds--dropdown__wrapper',
						fieldFrameClass( carbonDefault ),
					]
						.filter( Boolean )
						.join( ' ' ),
				} ) }
			>
				<RichText
					tagName="label"
					className="cds--label"
					value={ label }
					onChange={ ( v ) => setAttributes( { label: v } ) }
					allowedFormats={ [] }
					placeholder={ __( 'Label', 'awt-blocks' ) }
					disableLineBreaks
				/>
				<div
					className={ `cds--dropdown cds--list-box cds--list-box--${ size } cds--layout--size-${ size }${
						invalid ? ' cds--dropdown--invalid' : ''
					}${ disabled ? ' cds--dropdown--disabled' : '' }` }
					data-invalid={ invalid ? '' : undefined }
				>
					{ /* Carbon's error icon — mirrors render.php's
					     `icon( 'warning--filled', 16, … )`. No `fill`
					     attribute: Carbon's CSS fills it from the list
					     box's `data-invalid`. */ }
					{ invalid && (
						<svg
							className="cds--list-box__invalid-icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							width="16"
							height="16"
							aria-hidden="true"
							focusable="false"
						>
							<path d="M8,1C4.2,1,1,4.2,1,8s3.2,7,7,7s7-3.1,7-7S11.9,1,8,1z M7.5,4h1v5h-1C7.5,9,7.5,4,7.5,4z M8,12.2c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z" />
						</svg>
					) }
					<button
						type="button"
						className="cds--list-box__field"
						aria-haspopup="listbox"
						aria-expanded="false"
						disabled={ disabled }
						onClick={ ( e ) => e.preventDefault() }
					>
						<span className="cds--list-box__label">
							{ placeholder }
						</span>
						<div className="cds--list-box__menu-icon">
							<svg
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
					</button>
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
