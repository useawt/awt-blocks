import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		label,
		name,
		value,
		checked,
		disabled,
		indeterminate,
		required,
		helperText,
		invalid,
		invalidText,
	} = attributes;
	const id = `awt-cb-${ clientId.slice( 0, 8 ) }`;

	// The partially-checked state has no HTML attribute — it is a property only —
	// so React cannot express it as a prop and the preview drew an indeterminate
	// checkbox as a plain empty one. Setting the property is what makes Carbon's
	// `:indeterminate` rule draw the dash. The front end does the same thing in
	// view.js.
	const inputRef = useRef( null );
	useEffect( () => {
		if ( inputRef.current ) {
			inputRef.current.indeterminate = !! indeterminate;
		}
	}, [ indeterminate ] );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Checkbox', 'awt' ) }>
					<TextControl
						label={ __( 'Name', 'awt' ) }
						value={ name }
						onChange={ ( v ) => setAttributes( { name: v } ) }
					/>
					<TextControl
						label={ __( 'Value', 'awt' ) }
						value={ value }
						onChange={ ( v ) => setAttributes( { value: v } ) }
					/>
					<ToggleControl
						label={ __( 'Checked by default', 'awt' ) }
						checked={ checked }
						onChange={ ( v ) => setAttributes( { checked: v } ) }
					/>
					<ToggleControl
						label={ __( 'Indeterminate', 'awt' ) }
						checked={ indeterminate }
						onChange={ ( v ) =>
							setAttributes( { indeterminate: v } )
						}
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
						label={ __( 'Invalid state', 'awt' ) }
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
					className: 'cds--form-item cds--checkbox-wrapper',
				} ) }
			>
				{ /* Controlled `checked` (not `defaultChecked`): browsers ignore
				     `readOnly` on checkboxes, so an uncontrolled input lets a
				     canvas click toggle it. Controlled + no onChange makes React
				     revert the click, keeping the preview at the "Checked by
				     default" attribute. */ }
				<input
					ref={ inputRef }
					type="checkbox"
					id={ id }
					className="cds--checkbox"
					checked={ !! checked }
					disabled={ disabled }
					readOnly
				/>
				<label htmlFor={ id } className="cds--checkbox-label">
					<RichText
						tagName="span"
						className="cds--checkbox-label-text"
						value={ label }
						onChange={ ( v ) => setAttributes( { label: v } ) }
						placeholder={ __( 'Checkbox label', 'awt' ) }
						allowedFormats={ [] }
					/>
				</label>
				{ helperText && (
					<div className="cds--form__helper-text">{ helperText }</div>
				) }
				{ invalid && invalidText && (
					<div className="cds--form-requirement">{ invalidText }</div>
				) }
			</div>
		</>
	);
}
