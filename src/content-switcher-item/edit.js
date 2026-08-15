import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';

export default function Edit( { attributes, setAttributes } ) {
	const { label, value, disabled } = attributes;
	// Mirror render.php: a single Carbon content-switcher button. The
	// `cds--content-switcher-btn` class gives the segmented styling; the
	// `__label` span keeps the text above Carbon's selected-state overlay.
	const blockProps = useBlockProps( {
		className: 'cds--content-switcher-btn',
		role: 'tab',
		'aria-selected': 'false',
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Segment', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Value (optional)', 'awt-blocks' ) }
						help={ __(
							'Sent in the awt:content-switcher-change event for app/JS consumers. Not needed for plain content switching.',
							'awt-blocks'
						) }
						value={ value }
						onChange={ ( v ) => setAttributes( { value: v } ) }
					/>
					<ToggleControl
						label={ __( 'Disabled', 'awt-blocks' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<button
				{ ...blockProps }
				type="button"
				disabled={ disabled }
				onClick={ ( e ) => e.preventDefault() }
			>
				<RichText
					tagName="span"
					className="cds--content-switcher__label"
					value={ label }
					onChange={ ( v ) => setAttributes( { label: v } ) }
					placeholder={ __( 'Segment label', 'awt-blocks' ) }
					allowedFormats={ [] }
				/>
			</button>
		</>
	);
}
