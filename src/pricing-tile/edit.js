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

export default function Edit( { attributes, setAttributes } ) {
	const {
		tierName,
		price,
		pricePeriod,
		description,
		ctaText,
		ctaHref,
		ctaKind,
		featured,
		badge,
		selectable,
	} = attributes;

	const classes = [
		'awt-pricing-tile',
		featured ? 'awt-pricing-tile--featured' : '',
		selectable ? 'awt-pricing-tile--selectable' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps( { className: classes } );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Pricing tile', 'awt-blocks' ) }>
					<ToggleControl
						label={ __( 'Featured', 'awt-blocks' ) }
						help={ __(
							'Visual emphasis (accent border + slight elevation). Typically one per row.',
							'awt-blocks'
						) }
						checked={ featured }
						onChange={ ( v ) => setAttributes( { featured: v } ) }
					/>
					<TextControl
						label={ __( 'Badge text', 'awt-blocks' ) }
						help={ __(
							'Optional. E.g. "Most popular", "Best value".',
							'awt-blocks'
						) }
						value={ badge }
						onChange={ ( v ) => setAttributes( { badge: v } ) }
					/>
					<ToggleControl
						label={ __(
							'Selectable (radio-tile style)',
							'awt-blocks'
						) }
						help={ __(
							'Tiles act as a radio group — picking one clears the others. Visual treatment only at Stage 1; selection state is purely decorative.',
							'awt-blocks'
						) }
						checked={ selectable }
						onChange={ ( v ) => setAttributes( { selectable: v } ) }
					/>
					<TextControl
						label={ __( 'Price period', 'awt-blocks' ) }
						help={ __(
							'E.g. "/month", "/year". Rendered inline after the price. Leave empty for "Free" or "Custom" pricing.',
							'awt-blocks'
						) }
						value={ pricePeriod }
						onChange={ ( v ) =>
							setAttributes( { pricePeriod: v } )
						}
					/>
					<SelectControl
						label={ __( 'CTA button kind', 'awt-blocks' ) }
						value={ ctaKind }
						options={ [
							{
								value: 'primary',
								label: __( 'Primary', 'awt-blocks' ),
							},
							{
								value: 'secondary',
								label: __( 'Secondary', 'awt-blocks' ),
							},
							{
								value: 'tertiary',
								label: __( 'Tertiary', 'awt-blocks' ),
							},
							{
								value: 'ghost',
								label: __( 'Ghost', 'awt-blocks' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { ctaKind: v } ) }
					/>
					<TextControl
						label={ __( 'CTA href', 'awt-blocks' ) }
						value={ ctaHref }
						onChange={ ( v ) => setAttributes( { ctaHref: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ badge && (
					<div className="awt-pricing-tile__badge">{ badge }</div>
				) }
				<RichText
					tagName="h3"
					className="awt-pricing-tile__tier-name"
					value={ tierName }
					onChange={ ( v ) => setAttributes( { tierName: v } ) }
					placeholder={ __( 'Tier name', 'awt-blocks' ) }
					allowedFormats={ [] }
				/>
				<div className="awt-pricing-tile__price-row">
					<RichText
						tagName="span"
						className="awt-pricing-tile__price"
						value={ price }
						onChange={ ( v ) => setAttributes( { price: v } ) }
						placeholder={ __( 'Price (e.g. $49)', 'awt-blocks' ) }
						allowedFormats={ [] }
					/>
					{ pricePeriod && (
						<span className="awt-pricing-tile__price-period">
							{ pricePeriod }
						</span>
					) }
				</div>
				<RichText
					tagName="p"
					className="awt-pricing-tile__description"
					value={ description }
					onChange={ ( v ) => setAttributes( { description: v } ) }
					placeholder={ __(
						'1–3 sentence pitch for this tier',
						'awt-blocks'
					) }
					allowedFormats={ [
						'core/bold',
						'core/italic',
						'core/link',
					] }
				/>
				{ /* Mirrors render.php → classes_for('button', {kind, size:'lg'}): kind + size
				     modifier + the cds--layout--size-lg the resolver emits, so the editor CTA
				     matches the published button exactly (editor previews stay Carbon-styled). */ }
				<a
					className={ `cds--btn cds--btn--${ ctaKind } cds--btn--lg cds--layout--size-lg awt-pricing-tile__cta` }
					href={ ctaHref }
				>
					<RichText
						tagName="span"
						value={ ctaText }
						onChange={ ( v ) => setAttributes( { ctaText: v } ) }
						placeholder={ __( 'Get started', 'awt-blocks' ) }
						allowedFormats={ [] }
					/>
				</a>
			</div>
		</>
	);
}
