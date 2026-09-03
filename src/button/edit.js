/**
 * AWT Button — Edit component.
 *
 * The author sees a Carbon-class-styled preview in the canvas; the inspector
 * exposes every semantic attribute defined in block.json.
 */

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
import PremiumNotice from '../shared/premium-notice';

const KIND_OPTIONS = [
	{ label: 'Primary', value: 'primary' },
	{ label: 'Secondary', value: 'secondary' },
	{ label: 'Tertiary', value: 'tertiary' },
	{ label: 'Ghost', value: 'ghost' },
	{ label: 'Danger', value: 'danger' },
	{ label: 'Danger tertiary', value: 'danger--tertiary' },
	{ label: 'Danger ghost', value: 'danger--ghost' },
];

const SIZE_OPTIONS = [
	{ label: 'Small (sm)', value: 'sm' },
	{ label: 'Medium (md)', value: 'md' },
	{ label: 'Large (lg)', value: 'lg' },
	{ label: 'Extra large (xl)', value: 'xl' },
	{ label: '2x extra large (2xl)', value: '2xl' },
];

const TARGET_OPTIONS = [
	{ label: 'Same window', value: '' },
	{ label: 'New tab/window', value: '_blank' },
	{ label: 'Parent frame', value: '_parent' },
	{ label: 'Top frame', value: '_top' },
];

const ICON_POSITION_OPTIONS = [
	{ label: 'Leading', value: 'leading' },
	{ label: 'Trailing', value: 'trailing' },
];

export default function Edit( { attributes, setAttributes } ) {
	const {
		text,
		kind,
		size,
		type,
		href,
		target,
		rel,
		disabled,
		iconName,
		iconPosition,
		isExpressive,
		// onClickFunction stays in block.json for round-trip of Premium-authored
		// content, but the editor only shows the Premium upsell (no control).
	} = attributes;

	const classes = [
		'cds--btn',
		`cds--btn--${ kind }`,
		`cds--btn--${ size }`,
		// Carbon's button height is set via `--cds-layout-size-height` which
		// the `cds--layout--size-{size}` utility class supplies (see
		// render.php for the longer note). Without this class the `--{size}`
		// modifier above only handles peripheral details and every size
		// renders at the same 3rem (lg) baseline.
		`cds--layout--size-${ size }`,
		isExpressive ? 'cds--btn--expressive' : null,
		disabled ? 'cds--btn--disabled' : null,
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps( { className: classes } );

	const Tag = href ? 'a' : 'button';
	// Mirror render.php's icon: a masked <span> painted in the button's text
	// color (CSS mask + `background: currentColor`), the same technique
	// awt/icon and header-action use in the editor. `cds--btn__icon` supplies
	// the label↔icon gap. Always request the size-32 SVG (full Carbon
	// coverage) and scale it into the 16px box via `mask-size: contain`.
	const iconEl = iconName ? (
		<span
			className="cds--btn__icon"
			aria-hidden="true"
			style={ {
				display: 'inline-block',
				inlineSize: '16px',
				blockSize: '16px',
				background: 'currentColor',
				WebkitMaskImage: `url(${ iconPreviewUrl( iconName, [ 32 ] ) })`,
				maskImage: `url(${ iconPreviewUrl( iconName, [ 32 ] ) })`,
				WebkitMaskRepeat: 'no-repeat',
				maskRepeat: 'no-repeat',
				WebkitMaskPosition: 'center',
				maskPosition: 'center',
				WebkitMaskSize: 'contain',
				maskSize: 'contain',
			} }
		/>
	) : null;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Button', 'awt-blocks' ) } initialOpen>
					<SelectControl
						label={ __( 'Kind', 'awt-blocks' ) }
						value={ kind }
						options={ KIND_OPTIONS }
						onChange={ ( v ) => setAttributes( { kind: v } ) }
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ SIZE_OPTIONS }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<ToggleControl
						label={ __( 'Expressive text size', 'awt-blocks' ) }
						help={ __(
							'Larger text that grows with the screen. Suits landing pages and marketing content.',
							'awt-blocks'
						) }
						checked={ isExpressive }
						onChange={ ( v ) =>
							setAttributes( { isExpressive: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Submit the form', 'awt-blocks' ) }
						help={
							href
								? __(
										'Not available while a URL is set. A URL turns the button into a link.',
										'awt-blocks'
								  )
								: __(
										'Turn on for the button that sends a form. Place the button inside a Form block.',
										'awt-blocks'
								  )
						}
						checked={ type === 'submit' && ! href }
						disabled={ !! href }
						onChange={ ( v ) =>
							setAttributes( { type: v ? 'submit' : 'button' } )
						}
					/>
					<ToggleControl
						label={ __( 'Disabled', 'awt-blocks' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Link', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __(
							'URL (turns the button into a link)',
							'awt-blocks'
						) }
						value={ href }
						onChange={ ( v ) => setAttributes( { href: v } ) }
						type="url"
					/>
					<SelectControl
						label={ __( 'Target', 'awt-blocks' ) }
						value={ target }
						options={ TARGET_OPTIONS }
						onChange={ ( v ) => setAttributes( { target: v } ) }
						disabled={ ! href }
					/>
					<TextControl
						label={ __( 'Link relationship', 'awt-blocks' ) }
						value={ rel }
						onChange={ ( v ) => setAttributes( { rel: v } ) }
						help={ __(
							'Sets the link’s rel attribute. Links that open in a new tab already get “noopener noreferrer”. Fill this in only if you need something different.',
							'awt-blocks'
						) }
						disabled={ ! href }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Icon', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<IconPicker
						label={ __( 'Icon', 'awt-blocks' ) }
						help={ __(
							'Search the Carbon icon library. Leave empty for no icon.',
							'awt-blocks'
						) }
						value={ iconName }
						onChange={ ( v ) => setAttributes( { iconName: v } ) }
					/>
					<SelectControl
						label={ __( 'Icon position', 'awt-blocks' ) }
						value={ iconPosition }
						options={ ICON_POSITION_OPTIONS }
						onChange={ ( v ) =>
							setAttributes( { iconPosition: v } )
						}
						disabled={ ! iconName }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'On click', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<PremiumNotice
						title={ __(
							'Run a JavaScript function',
							'awt-blocks'
						) }
						description={ __(
							'Call a JavaScript function by name when clicked.',
							'awt-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>

			{ /* useBlockProps goes on the <a>/<button> itself (not a wrapping
			     <div>, which would be block-level and stack the buttons
			     vertically — Carbon buttons are inline-flex). The label is a
			     child RichText span + the icon span, matching render.php's
			     `<button><span>label</span><icon/></button>` so the editor icon
			     renders in the same leading/trailing slot as the front end. */ }
			<Tag
				{ ...blockProps }
				href={ href || undefined }
				type={ href ? undefined : 'button' }
				aria-disabled={ disabled || undefined }
				// In the editor a real href would navigate away on click, so the
				// author could never select/edit a linked button. Swallow the
				// anchor's default navigation here (editor preview only; the
				// front-end render.php emits a normal working link).
				onClick={ href ? ( e ) => e.preventDefault() : undefined }
			>
				{ iconPosition === 'leading' && iconEl }
				<RichText
					tagName="span"
					value={ text }
					onChange={ ( v ) => setAttributes( { text: v } ) }
					placeholder={ __( 'Button label', 'awt-blocks' ) }
					allowedFormats={ [] }
				/>
				{ iconPosition !== 'leading' && iconEl }
			</Tag>
		</>
	);
}
