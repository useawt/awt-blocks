import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	RichText,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const { label, value, checked, disabled } = attributes;
	const id = `awt-rb-${ clientId.slice( 0, 8 ) }`;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Radio button', 'awt-blocks' ) }>
					<TextControl
						label={ __( 'Value', 'awt-blocks' ) }
						value={ value }
						onChange={ ( v ) => setAttributes( { value: v } ) }
					/>
					<ToggleControl
						label={ __( 'Checked by default', 'awt-blocks' ) }
						checked={ checked }
						onChange={ ( v ) => setAttributes( { checked: v } ) }
					/>
					<ToggleControl
						label={ __( 'Disabled', 'awt-blocks' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div
				{ ...useBlockProps( {
					className: 'cds--radio-button-wrapper',
				} ) }
			>
				{ /* Controlled `checked` (not `defaultChecked`): browsers ignore
				     `readOnly` on radios/checkboxes, so an uncontrolled input lets
				     a canvas click toggle the selection. A controlled value with
				     no onChange makes React revert the click, so the preview only
				     reflects the "Checked by default" attribute. */ }
				<input
					type="radio"
					id={ id }
					className="cds--radio-button"
					checked={ !! checked }
					disabled={ disabled }
					readOnly
				/>
				<label htmlFor={ id } className="cds--radio-button__label">
					<span className="cds--radio-button__appearance"></span>
					<RichText
						tagName="span"
						className="cds--radio-button__label-text"
						value={ label }
						onChange={ ( v ) => setAttributes( { label: v } ) }
						placeholder={ __( 'Option', 'awt-blocks' ) }
						allowedFormats={ [] }
					/>
				</label>
			</div>
		</>
	);
}
