import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ToggleControl,
	Notice,
} from '@wordpress/components';
import IconPicker, { iconPreviewUrl } from '../shared/icon-picker';

const SIZE_OPTIONS = [ '16', '20', '24', '32' ].map( ( v ) => ( {
	value: v,
	label: `${ v }px`,
} ) );

const COLOR_OPTIONS = [
	{ value: 'inherit', label: __( 'Inherit from text', 'awt-blocks' ) },
	{ value: 'text-primary', label: __( 'Body text', 'awt-blocks' ) },
	{ value: 'text-secondary', label: __( 'Secondary text', 'awt-blocks' ) },
	{ value: 'support-success', label: __( 'Success (green)', 'awt-blocks' ) },
	{ value: 'support-warning', label: __( 'Warning (yellow)', 'awt-blocks' ) },
	{ value: 'support-error', label: __( 'Error (red)', 'awt-blocks' ) },
	{ value: 'support-info', label: __( 'Information (blue)', 'awt-blocks' ) },
	{ value: 'link-primary', label: __( 'Link', 'awt-blocks' ) },
];

export default function Edit( { attributes, setAttributes } ) {
	const { iconName, size, label, decorative, color, inline } = attributes;
	// Match the front-end render's wrapper class + style — `<span class="awt-icon
	// [awt-icon--inline]">…</span>`, inline-displayed by default so multiple
	// adjacent icon blocks flow horizontally on the published page. Previously
	// the editor used `display: flex` which made each icon block-level and
	// stacked them vertically; now editor matches front-end.
	const iconColor =
		color !== 'inherit' ? `var(--cds-${ color })` : 'currentColor';
	const blockProps = useBlockProps( {
		className: `awt-icon${
			inline ? ' awt-icon--inline' : ''
		} awt-icon-preview`,
		style: {
			display: 'inline-block',
			verticalAlign: 'middle',
			width: `${ size }px`,
			height: `${ size }px`,
			color: iconColor,
		},
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Icon', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<IconPicker
						label={ __( 'Carbon icon', 'awt-blocks' ) }
						help={ __(
							'Search by name or alias; click an icon to select.',
							'awt-blocks'
						) }
						value={ iconName }
						onChange={ ( value ) =>
							setAttributes( { iconName: value } )
						}
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ SIZE_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { size: value } )
						}
					/>
					<SelectControl
						label={ __( 'Color', 'awt-blocks' ) }
						value={ color }
						options={ COLOR_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { color: value } )
						}
					/>
					<ToggleControl
						label={ __( 'Align with text baseline', 'awt-blocks' ) }
						help={ __(
							'Lines the icon up with text on the same line. You only see a difference when the icon sits next to text or other icons.',
							'awt-blocks'
						) }
						checked={ inline }
						onChange={ ( value ) =>
							setAttributes( { inline: value } )
						}
					/>
					<ToggleControl
						label={ __( 'Decorative', 'awt-blocks' ) }
						help={ __(
							'Decorative icons are hidden from screen readers. Uncheck to provide an accessible name.',
							'awt-blocks'
						) }
						checked={ decorative }
						onChange={ ( value ) =>
							setAttributes( { decorative: value } )
						}
					/>
					{ ! decorative && (
						<TextControl
							label={ __( 'Accessible name', 'awt-blocks' ) }
							value={ label }
							onChange={ ( value ) =>
								setAttributes( { label: value } )
							}
						/>
					) }
					{ ! decorative && ! label && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'An icon that carries meaning needs an accessible name. Accessibility checks report a missing one as an Error.',
								'awt-blocks'
							) }
						</Notice>
					) }
				</PanelBody>
			</InspectorControls>
			<span { ...blockProps }>
				{ iconName ? (
					// CSS `mask` paints the icon as a solid-color shape using the
					// SVG file as a stencil. The fill comes from `background:
					// currentColor` which the parent's `color` style (set to a
					// Carbon support token like `var(--cds-support-success)`)
					// supplies. Result: editor and front-end show the SAME
					// colored icon for the same `color` attribute, despite
					// editor using <img> via mask vs front-end inlining SVG.
					//
					// Always request the size-32 SVG — Carbon's icon library
					// has full coverage at 32 but spotty coverage at 16/20/24.
					// We scale visually via the outer wrapper's width/height,
					// which uses `mask-size: contain` to fit the size-32
					// glyph into whatever pixel box the author selected.
					<span
						aria-hidden="true"
						style={ {
							display: 'inline-block',
							width: '100%',
							height: '100%',
							background: 'currentColor',
							WebkitMaskImage: `url(${ iconPreviewUrl( iconName, [
								32,
							] ) })`,
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
				) : (
					// No icon chosen yet — show a muted placeholder glyph (Carbon
					// "image" icon) filling the size box, instead of the literal
					// word "icon", so the preview reads as an icon slot.
					<svg
						viewBox="0 0 32 32"
						width="100%"
						height="100%"
						fill="var(--cds-text-placeholder, #a8a8a8)"
						role="img"
						aria-label={ __( 'No icon selected', 'awt-blocks' ) }
						focusable="false"
					>
						<path d="M19 14a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0-4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
						<path d="M26 4H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 22H6v-6l5-5 5.59 5.58a2 2 0 0 0 2.82 0L21 19l5 5zm0-4.83-3.59-3.59a2 2 0 0 0-2.82 0L18 19.17l-5.59-5.59a2 2 0 0 0-2.82 0L6 17.36V6h20z" />
					</svg>
				) }
			</span>
		</>
	);
}
