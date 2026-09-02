import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	ExternalLink,
} from '@wordpress/components';
import { iconPreviewUrl } from '../shared/icon-picker';
import CarbonDefaultToggle, {
	fieldFrameClass,
} from '../shared/carbon-default-toggle';

// Status icon — mirrors render.php's `icon( 'warning--filled', 16, ... )` call.
// `warning--filled` for invalid (red triangle with !); `warning--alt--filled`
// for warning (yellow triangle with !). Both come from the Carbon icon set so
// the editor preview uses the same SVG file the front-end inlines.
const StatusIcon = ( { variant } ) => {
	const slug =
		variant === 'invalid' ? 'warning--filled' : 'warning--alt--filled';
	const cls =
		'cds--text-input__invalid-icon' +
		( variant === 'warning'
			? ' cds--text-input__invalid-icon--warning'
			: '' );
	return (
		<span className={ cls } aria-hidden="true">
			<span
				style={ {
					display: 'inline-block',
					width: '1rem',
					height: '1rem',
					background:
						variant === 'invalid'
							? 'var(--cds-support-error, #da1e28)'
							: 'var(--cds-support-warning, #f1c21b)',
					WebkitMaskImage: `url(${ iconPreviewUrl( slug, [ 32 ] ) })`,
					maskImage: `url(${ iconPreviewUrl( slug, [ 32 ] ) })`,
					WebkitMaskRepeat: 'no-repeat',
					maskRepeat: 'no-repeat',
					WebkitMaskPosition: 'center',
					maskPosition: 'center',
					WebkitMaskSize: 'contain',
					maskSize: 'contain',
				} }
			/>
		</span>
	);
};

const TYPE_OPTIONS = [
	{ label: 'Text', value: 'text' },
	{ label: 'Email', value: 'email' },
	{ label: 'Password', value: 'password' },
	{ label: 'Tel', value: 'tel' },
	{ label: 'URL', value: 'url' },
	{ label: 'Search', value: 'search' },
	{ label: 'Number', value: 'number' },
];

const SIZE_OPTIONS = [
	{ label: 'Small (sm)', value: 'sm' },
	{ label: 'Medium (md)', value: 'md' },
	{ label: 'Large (lg)', value: 'lg' },
];

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		label,
		name,
		type,
		placeholder,
		value,
		helperText,
		invalid,
		invalidText,
		warn,
		warnText,
		disabled,
		readonly,
		required,
		size,
		hideLabel,
		inline,
		fluid,
		maxlength,
		pattern,
		autocomplete,
		carbonDefault,
	} = attributes;
	const id = `awt-ti-${ clientId.slice( 0, 8 ) }`;

	const wrapperClasses = [
		'cds--form-item',
		'cds--text-input-wrapper',
		inline ? 'cds--text-input-wrapper--inline' : null,
		readonly ? 'cds--text-input-wrapper--readonly' : null,
		// `--fluid` sits on the base `cds--text-input` namespace, not on
		// `--wrapper`: Carbon's own rule is
		// `.cds--text-input--fluid.cds--text-input-wrapper`, and its child
		// selectors read `.cds--text-input--fluid .cds--label`. The editor
		// emitted `cds--text-input-wrapper--fluid`, which matches nothing, so
		// the fluid variant previewed as an ordinary field while rendering
		// correctly on the front end. Keep this in step with render.php.
		fluid ? 'cds--text-input--fluid' : null,
		fieldFrameClass( carbonDefault ),
	]
		.filter( Boolean )
		.join( ' ' );

	const inputClasses = [
		'cds--text-input',
		`cds--text-input--${ size }`,
		// Carbon's input height is set via `--cds-layout-size-height`
		// supplied by `cds--layout--size-{size}` (longer note in
		// render.php). The `cds--text-input--{size}` modifier alone leaves
		// every input at the default md height.
		`cds--layout--size-${ size }`,
		invalid ? 'cds--text-input--invalid' : null,
		warn ? 'cds--text-input--warning' : null,
	]
		.filter( Boolean )
		.join( ' ' );

	const labelClasses = [
		'cds--label',
		hideLabel ? 'cds--visually-hidden' : null,
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Field', 'awt-blocks' ) }>
					<TextControl
						label={ __( 'Name', 'awt-blocks' ) }
						value={ name }
						onChange={ ( v ) => setAttributes( { name: v } ) }
					/>
					<SelectControl
						label={ __( 'Type', 'awt-blocks' ) }
						value={ type }
						options={ TYPE_OPTIONS }
						onChange={ ( v ) => setAttributes( { type: v } ) }
						help={ __(
							'Sets the HTML input type. Changes on-screen keyboards (mobile), browser validation and autofill — most types look identical on a desktop preview.',
							'awt-blocks'
						) }
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
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ SIZE_OPTIONS }
						onChange={ ( v ) => setAttributes( { size: v } ) }
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
					<ToggleControl
						label={ __( 'Inline layout', 'awt-blocks' ) }
						help={ __(
							'Label sits to the left of the input on one row.',
							'awt-blocks'
						) }
						checked={ inline }
						onChange={ ( v ) => setAttributes( { inline: v } ) }
					/>
					<p
						style={ {
							margin: '-4px 0 12px',
							fontSize: '0.8125rem',
						} }
					>
						<ExternalLink href="https://carbondesignsystem.com/components/text-input/usage/">
							{ __( 'Usage', 'awt-blocks' ) }
						</ExternalLink>
					</p>
					<ToggleControl
						label={ __( 'Fluid layout', 'awt-blocks' ) }
						help={ __(
							'Carbon fluid variant: label sits inside the field area. Suited to data-entry forms.',
							'awt-blocks'
						) }
						checked={ fluid }
						onChange={ ( v ) => setAttributes( { fluid: v } ) }
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
				<PanelBody
					title={ __( 'Constraints', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __( 'Maxlength', 'awt-blocks' ) }
						type="number"
						value={ maxlength }
						onChange={ ( v ) =>
							setAttributes( { maxlength: Number( v ) || 0 } )
						}
					/>
					<TextControl
						label={ __( 'Pattern', 'awt-blocks' ) }
						value={ pattern }
						onChange={ ( v ) => setAttributes( { pattern: v } ) }
					/>
					<TextControl
						label={ __( 'Autocomplete', 'awt-blocks' ) }
						value={ autocomplete }
						onChange={ ( v ) =>
							setAttributes( { autocomplete: v } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps( { className: wrapperClasses } ) }>
				<RichText
					tagName="label"
					htmlFor={ id }
					className={ labelClasses }
					value={ label }
					onChange={ ( v ) => setAttributes( { label: v } ) }
					placeholder={ __( 'Label', 'awt-blocks' ) }
					allowedFormats={ [] }
				/>
				<div className="cds--text-input__field-outer-wrapper">
					<div
						className={ [
							'cds--text-input__field-wrapper',
							invalid
								? 'cds--text-input__field-wrapper--invalid'
								: null,
							warn
								? 'cds--text-input__field-wrapper--warning'
								: null,
						]
							.filter( Boolean )
							.join( ' ' ) }
						// Carbon reveals the error message from
						// `[data-invalid]` on this element, not from
						// the `--invalid` class above (which is ours,
						// and which Carbon styles nowhere). Without it
						// the message stays `display: none` and the
						// preview would show no error text at all.
						// Mirrors render.php.
						data-invalid={ invalid ? 'true' : undefined }
					>
						<input
							id={ id }
							type={ type }
							className={ inputClasses }
							placeholder={ placeholder }
							defaultValue={ value }
							disabled={ disabled }
							readOnly={
								readonly || true /* keep stable in editor */
							}
						/>
						{ invalid && <StatusIcon variant="invalid" /> }
						{ warn && ! invalid && (
							<StatusIcon variant="warning" />
						) }
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
