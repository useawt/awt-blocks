import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

const SPACING_OPTIONS = [
	'01',
	'02',
	'03',
	'04',
	'05',
	'06',
	'07',
	'08',
	'09',
	'10',
	'11',
	'12',
	'13',
].map( ( v ) => ( {
	value: v,
	label: __( 'Spacing', 'awt' ) + v,
} ) );

const MAX_WIDTH_OPTIONS = [
	{ value: 'none', label: __( 'None (full width)', 'awt' ) },
	{ value: 'narrow', label: __( 'Narrow (42rem)', 'awt' ) },
	{ value: 'content', label: __( 'Content (66rem)', 'awt' ) },
	{ value: 'wide', label: __( 'Wide (82.5rem)', 'awt' ) },
	{ value: 'custom', label: __( 'Custom', 'awt' ) },
];

const SCOPE_OPTIONS = [
	{ value: 'inherit', label: __( 'Inherit from page', 'awt' ) },
	{ value: 'light', label: __( 'Light (active light variant)', 'awt' ) },
	{ value: 'dark', label: __( 'Dark (active dark variant)', 'awt' ) },
	{ value: 'g10', label: __( 'Force g10', 'awt' ) },
	{ value: 'g100', label: __( 'Force g100', 'awt' ) },
];

const TAG_OPTIONS = [ 'section', 'div', 'article', 'aside' ].map( ( v ) => ( {
	value: v,
	label: `<${ v }>`,
} ) );

// Carbon's layer-01/02/03 tokens are a CONTEXTUAL set (they alternate by
// nesting depth via cds--layer-* wrappers), not an ascending background ramp.
// Applied as a flat section fill they collapse to duplicates — in the White
// theme layer-02 == background (#fff) and layer-03 == layer-01 (#f4f4f4). So we
// expose only surfaces that stay visually distinct in every scope:
// background / layer-01 / layer-accent-01 (#fff / #f4f4f4 / #e0e0e0 in White,
// with matching distinct dark steps in g90/g100).
const BACKGROUND_OPTIONS = [
	{ value: '', label: __( 'Transparent', 'awt' ) },
	{ value: 'background', label: 'background' },
	{ value: 'layer-01', label: 'layer-01' },
	{ value: 'layer-accent-01', label: 'layer-accent-01' },
];

export default function Edit( { attributes, setAttributes } ) {
	const {
		paddingBlock,
		paddingInline,
		noGapBelow,
		maxWidth,
		customMaxWidth,
		backgroundColor,
		themeScope,
		tagName,
		ariaLabel,
	} = attributes;

	const widthMap = {
		none: '100%',
		narrow: '42rem',
		content: '66rem',
		wide: '82.5rem',
		custom: customMaxWidth || '66rem',
	};
	// Mirror render.php's theme-scope classes so the editor island resolves
	// the same Carbon tokens (e.g. cds--g100 → dark palette) as the published
	// page. "light"/"dark" resolve to the active style variation's paired
	// scope, exposed by the theme via block_editor_settings_all
	// (awtThemeScopes). Custom keys are allowlist-filtered out of the
	// core/block-editor store's settings, so read the core/editor store;
	// fallback matches render.php's (white + g100).
	const themeScopes = useSelect(
		( select ) =>
			select( 'core/editor' )?.getEditorSettings?.().awtThemeScopes,
		[]
	);
	const SCOPE_CLASSES = {
		g10: 'cds--g10',
		g100: 'cds--g100',
		light: `awt-section--scope-light cds--${
			themeScopes?.light || 'white'
		}`,
		dark: `awt-section--scope-dark cds--${ themeScopes?.dark || 'g100' }`,
	};
	const scopeClass = SCOPE_CLASSES[ themeScope ] || '';

	const blockProps = useBlockProps( {
		className: `awt-section${ scopeClass ? ' ' + scopeClass : '' }`,
		style: {
			paddingBlock: `var(--cds-spacing-${ paddingBlock }, 2rem)`,
			paddingInline: `var(--cds-spacing-${ paddingInline }, 1.5rem)`,
			background: backgroundColor
				? `var(--cds-${ backgroundColor })`
				: undefined,
		},
	} );
	const innerProps = useInnerBlocksProps(
		{
			style: {
				maxWidth: widthMap[ maxWidth ] || '66rem',
				marginInline: 'auto',
			},
		},
		{}
	);

	const Tag = tagName;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Layout', 'awt' ) } initialOpen={ true }>
					<SelectControl
						label={ __( 'Vertical padding', 'awt' ) }
						value={ paddingBlock }
						options={ SPACING_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { paddingBlock: value } )
						}
					/>
					<SelectControl
						label={ __( 'Horizontal padding', 'awt' ) }
						value={ paddingInline }
						options={ SPACING_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { paddingInline: value } )
						}
					/>
					<ToggleControl
						label={ __( 'No gap below', 'awt' ) }
						help={ __(
							'Removes the space below this section so it sits flush against whatever comes next.',
							'awt'
						) }
						checked={ !! noGapBelow }
						onChange={ ( value ) =>
							setAttributes( { noGapBelow: value } )
						}
					/>
					<SelectControl
						label={ __( 'Max width', 'awt' ) }
						value={ maxWidth }
						options={ MAX_WIDTH_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { maxWidth: value } )
						}
					/>
					{ maxWidth === 'custom' && (
						<TextControl
							label={ __(
								'Custom max width (e.g., 720px)',
								'awt'
							) }
							value={ customMaxWidth }
							onChange={ ( value ) =>
								setAttributes( { customMaxWidth: value } )
							}
						/>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Appearance', 'awt' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __(
							'Background color (palette token)',
							'awt'
						) }
						value={ backgroundColor }
						options={ BACKGROUND_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { backgroundColor: value } )
						}
					/>
					<SelectControl
						label={ __( 'Theme scope', 'awt' ) }
						value={ themeScope }
						options={ SCOPE_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { themeScope: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Element', 'awt' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __( 'HTML tag', 'awt' ) }
						value={ tagName }
						options={ TAG_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { tagName: value } )
						}
					/>
					{ tagName === 'section' && (
						<TextControl
							label={ __(
								'Accessible name (aria-label)',
								'awt'
							) }
							help={ __(
								'Recommended when multiple <section> elements appear on the same page.',
								'awt'
							) }
							value={ ariaLabel }
							onChange={ ( value ) =>
								setAttributes( { ariaLabel: value } )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<Tag
				{ ...blockProps }
				aria-label={
					tagName === 'section' && ariaLabel ? ariaLabel : undefined
				}
			>
				<div { ...innerProps } />
			</Tag>
		</>
	);
}
