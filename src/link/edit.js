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
} from '@wordpress/components';
import IconPicker, { iconPreviewUrl } from '../shared/icon-picker';

const SIZE_OPTIONS = [
	{ label: 'Small (sm)', value: 'sm' },
	{ label: 'Medium (md)', value: 'md' },
	{ label: 'Large (lg)', value: 'lg' },
];

const TARGET_OPTIONS = [
	{ label: 'Same window', value: '' },
	{ label: 'New tab/window', value: '_blank' },
	{ label: 'Parent frame', value: '_parent' },
	{ label: 'Top frame', value: '_top' },
];

export default function Edit( { attributes, setAttributes } ) {
	const {
		text,
		href,
		target,
		rel,
		size,
		inline,
		visited,
		disabled,
		iconName,
	} = attributes;
	// Carbon's `cds--link--visited` is the OPT-IN modifier — without it,
	// links stay blue even after the visitor clicks them (Carbon overrides
	// the browser's :visited purple). Setting `visited: true` in our block
	// attributes opts INTO the purple-on-visit behavior. The browser only
	// paints :visited after the URL is actually visited; in this preview
	// the modifier is in the DOM but the color doesn't change until clicked.
	const classes = [
		'cds--link',
		`cds--link--${ size }`,
		inline ? 'cds--link--inline' : null,
		visited ? 'cds--link--visited' : null,
		disabled ? 'cds--link--disabled' : null,
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Link', 'awt-blocks' ) }>
					<TextControl
						label={ __( 'URL', 'awt-blocks' ) }
						value={ href }
						onChange={ ( v ) => setAttributes( { href: v } ) }
						type="url"
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ SIZE_OPTIONS }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<ToggleControl
						label={ __( 'Inline style', 'awt-blocks' ) }
						checked={ inline }
						onChange={ ( v ) => setAttributes( { inline: v } ) }
					/>
					<ToggleControl
						label={ __( 'Show visited state', 'awt-blocks' ) }
						checked={ visited }
						onChange={ ( v ) => setAttributes( { visited: v } ) }
					/>
					<ToggleControl
						label={ __( 'Disabled', 'awt-blocks' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Target & icon', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __( 'Target', 'awt-blocks' ) }
						value={ target }
						options={ TARGET_OPTIONS }
						onChange={ ( v ) => setAttributes( { target: v } ) }
					/>
					<TextControl
						label={ __( 'rel', 'awt-blocks' ) }
						value={ rel }
						onChange={ ( v ) => setAttributes( { rel: v } ) }
					/>
					<IconPicker
						label={ __( 'Trailing icon', 'awt-blocks' ) }
						help={ __(
							'Search the Carbon icon library. Leave empty for none.',
							'awt-blocks'
						) }
						value={ iconName }
						onChange={ ( v ) => setAttributes( { iconName: v } ) }
					/>
				</PanelBody>
			</InspectorControls>

			{ /* Mirror render.php's `<a>{text}<span class="cds--link__icon">{svg}</span></a>`
			     structure. RichText holds the text as a <span> inside the outer
			     <a>; the trailing icon then sits as the next child inside the
			     anchor so editor matches published exactly when iconName is set. */ }
			<a
				{ ...useBlockProps( { className: classes } ) }
				href={ href || undefined }
				onClick={ ( e ) => e.preventDefault() }
			>
				<RichText
					tagName="span"
					value={ text }
					onChange={ ( v ) => setAttributes( { text: v } ) }
					placeholder={ __( 'Link text', 'awt-blocks' ) }
					allowedFormats={ [] }
				/>
				{ iconName && (
					<span className="cds--link__icon" aria-hidden="true">
						<span
							style={ {
								display: 'inline-block',
								width: '1rem',
								height: '1rem',
								background: 'currentColor',
								WebkitMaskImage: `url(${ iconPreviewUrl(
									iconName,
									[ 32 ]
								) })`,
								maskImage: `url(${ iconPreviewUrl( iconName, [
									32,
								] ) })`,
								WebkitMaskRepeat: 'no-repeat',
								maskRepeat: 'no-repeat',
								WebkitMaskPosition: 'center',
								maskPosition: 'center',
								WebkitMaskSize: 'contain',
								maskSize: 'contain',
							} }
						/>
					</span>
				) }
			</a>
		</>
	);
}
