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

const SIZE_OPTIONS = [
	{ label: 'Small (sm)', value: 'sm' },
	{ label: 'Medium (md)', value: 'md' },
];

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		label,
		name,
		size,
		toggled,
		disabled,
		readonly,
		labelA,
		labelB,
		hideLabel,
	} = attributes;
	// Carbon's `--sm` modifier targets `.cds--toggle__appearance--sm`
	// (the inner span), NOT the wrapper. Wrapper modifier alone doesn't
	// shrink the switch — see render.php comment for the longer story.
	const wrapperClasses = [
		'cds--toggle',
		disabled ? 'cds--toggle--disabled' : null,
	]
		.filter( Boolean )
		.join( ' ' );
	const appearanceClasses = [
		'cds--toggle__appearance',
		size === 'sm' ? 'cds--toggle__appearance--sm' : null,
	]
		.filter( Boolean )
		.join( ' ' );
	const switchClasses = [
		'cds--toggle__switch',
		toggled ? 'cds--toggle__switch--checked' : null,
	]
		.filter( Boolean )
		.join( ' ' );
	const id = `awt-toggle-${ clientId.slice( 0, 8 ) }`;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Toggle', 'awt-blocks' ) }>
					<TextControl
						label={ __( 'Name', 'awt-blocks' ) }
						value={ name }
						onChange={ ( v ) => setAttributes( { name: v } ) }
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ SIZE_OPTIONS }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<ToggleControl
						label={ __( 'On by default', 'awt-blocks' ) }
						checked={ toggled }
						onChange={ ( v ) => setAttributes( { toggled: v } ) }
					/>
					<ToggleControl
						label={ __( 'Visually hide label', 'awt-blocks' ) }
						checked={ hideLabel }
						onChange={ ( v ) => setAttributes( { hideLabel: v } ) }
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
				</PanelBody>
				<PanelBody
					title={ __( 'State labels', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __( 'Off state label', 'awt-blocks' ) }
						value={ labelA }
						onChange={ ( v ) => setAttributes( { labelA: v } ) }
					/>
					<TextControl
						label={ __( 'On state label', 'awt-blocks' ) }
						value={ labelB }
						onChange={ ( v ) => setAttributes( { labelB: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps( { className: 'awt-block-wrap' } ) }>
				<div className={ wrapperClasses }>
					<input
						type="checkbox"
						id={ id }
						className="cds--toggle__button"
						role="switch"
						aria-checked={ toggled }
						defaultChecked={ toggled }
						disabled={ disabled }
						readOnly
					/>
					<label htmlFor={ id } className="cds--toggle__label">
						<RichText
							tagName="span"
							className={
								hideLabel
									? 'cds--toggle__label-text cds--visually-hidden'
									: 'cds--toggle__label-text'
							}
							value={ label }
							onChange={ ( v ) => setAttributes( { label: v } ) }
							placeholder={ __( 'Toggle label', 'awt-blocks' ) }
							allowedFormats={ [] }
						/>
						<span className={ appearanceClasses }>
							<span className={ switchClasses }></span>
							<span className="cds--toggle__text">
								{ toggled ? labelB : labelA }
							</span>
						</span>
					</label>
				</div>
			</div>
		</>
	);
}
