import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	Button,
} from '@wordpress/components';
import IconPicker, { iconMaskImage } from '../shared/icon-picker';
import looksLikeUrl from '../shared/looks-like-url';

// Inline SVGs mirror the four mark variants from render.php so the editor
// preview shows the same opening quotation glyph the published page renders.
const MARK_SVGS = {
	'double-curved': (
		<svg
			className="awt-testimonial__mark awt-testimonial__mark--open"
			viewBox="0 0 40 32"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M14.4 0c-7.95 0-14.4 6.45-14.4 14.4v17.6h17.6v-17.6h-8.8c0-4.85 3.95-8.8 8.8-8.8v-5.6zm22.4 0c-7.95 0-14.4 6.45-14.4 14.4v17.6h17.6v-17.6h-8.8c0-4.85 3.95-8.8 8.8-8.8v-5.6z"
				fill="currentColor"
			/>
		</svg>
	),
	'double-straight': (
		<svg
			className="awt-testimonial__mark awt-testimonial__mark--open"
			viewBox="0 0 40 32"
			aria-hidden="true"
			focusable="false"
		>
			<rect x="2" y="2" width="14" height="20" fill="currentColor" />
			<rect x="24" y="2" width="14" height="20" fill="currentColor" />
		</svg>
	),
	'single-curved': (
		<svg
			className="awt-testimonial__mark awt-testimonial__mark--open"
			viewBox="0 0 20 32"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M14.4 0c-7.95 0-14.4 6.45-14.4 14.4v17.6h17.6v-17.6h-8.8c0-4.85 3.95-8.8 8.8-8.8v-5.6z"
				fill="currentColor"
			/>
		</svg>
	),
};

export default function Edit( { attributes, setAttributes } ) {
	const {
		quote,
		authorName,
		authorRole,
		authorOrg,
		authorAvatarUrl,
		authorAvatarAlt,
		markStyle,
		quoteSize,
		attributionStyle,
		kind,
		align,
		href,
		linkText,
		target,
		rel,
		iconName,
	} = attributes;

	const blockProps = useBlockProps( {
		className: `awt-testimonial awt-testimonial--${ kind } awt-testimonial--${ quoteSize } awt-testimonial--align-${ align } awt-testimonial--mark-${ markStyle } awt-testimonial--attr-${ attributionStyle }`,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Testimonial', 'awt-blocks' ) }>
					<SelectControl
						label={ __( 'Quote size', 'awt-blocks' ) }
						value={ quoteSize }
						options={ [
							{
								value: 'md',
								label: __( 'Medium (24px)', 'awt-blocks' ),
							},
							{
								value: 'lg',
								label: __(
									'Large (36px — default)',
									'awt-blocks'
								),
							},
							{
								value: 'xl',
								label: __( 'Extra large (48px)', 'awt-blocks' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { quoteSize: v } ) }
					/>
					<SelectControl
						label={ __( 'Quotation mark', 'awt-blocks' ) }
						help={ __(
							'The quotation mark shown at the start of the quote.',
							'awt-blocks'
						) }
						value={ markStyle }
						options={ [
							{
								value: 'double-curved',
								label: __(
									'Double curly “ ” (default)',
									'awt-blocks'
								),
							},
							{
								value: 'double-straight',
								label: __(
									'Double straight " "',
									'awt-blocks'
								),
							},
							{
								value: 'single-curved',
								label: __( 'Single curly ‘ ’', 'awt-blocks' ),
							},
							{
								value: 'none',
								label: __( 'None', 'awt-blocks' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { markStyle: v } ) }
					/>
					<SelectControl
						label={ __( 'Kind', 'awt-blocks' ) }
						value={ kind }
						options={ [
							{
								value: 'plain',
								label: __(
									'Plain (no background)',
									'awt-blocks'
								),
							},
							{
								value: 'card',
								label: __(
									'Card (shaded background)',
									'awt-blocks'
								),
							},
						] }
						onChange={ ( v ) => setAttributes( { kind: v } ) }
					/>
					<SelectControl
						label={ __( 'Attribution layout', 'awt-blocks' ) }
						value={ attributionStyle }
						options={ [
							{
								value: 'stacked',
								label: __(
									'Stacked (name / role / org on separate lines)',
									'awt-blocks'
								),
							},
							{
								value: 'inline',
								label: __(
									'Inline (name · role · org)',
									'awt-blocks'
								),
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { attributionStyle: v } )
						}
					/>
					<SelectControl
						label={ __( 'Alignment', 'awt-blocks' ) }
						value={ align }
						options={ [
							{
								value: 'start',
								label: __( 'Start', 'awt-blocks' ),
							},
							{
								value: 'center',
								label: __( 'Center', 'awt-blocks' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { align: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Source link', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __( 'URL', 'awt-blocks' ) }
						help={ __(
							'Where the quote can be read in full. Leave empty for no link.',
							'awt-blocks'
						) }
						value={ href }
						onChange={ ( v ) => setAttributes( { href: v } ) }
						type="url"
					/>
					{ href && ! looksLikeUrl( href ) && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'That does not look like a web address, so nothing will link to it. Paste the full address, or a path that starts with a slash.',
								'awt-blocks'
							) }
						</Notice>
					) }
					<TextControl
						label={ __( 'Link text', 'awt-blocks' ) }
						help={ __(
							'What the link says. Write something that makes sense read on its own, away from the quote.',
							'awt-blocks'
						) }
						value={ linkText }
						onChange={ ( v ) => setAttributes( { linkText: v } ) }
					/>
					<ToggleControl
						label={ __( 'Open in a new tab', 'awt-blocks' ) }
						checked={ target === '_blank' }
						onChange={ ( v ) =>
							setAttributes( { target: v ? '_blank' : '' } )
						}
					/>
					<TextControl
						label={ __( 'Link relationship', 'awt-blocks' ) }
						value={ rel }
						onChange={ ( v ) => setAttributes( { rel: v } ) }
						help={ __(
							'Sets the link’s rel attribute. Links that open in a new tab already get “noopener noreferrer”. Fill this in only if you need something different.',
							'awt-blocks'
						) }
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
				<PanelBody
					title={ __( 'Author avatar', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ ( m ) =>
								setAttributes( {
									authorAvatarUrl: m.url,
									authorAvatarAlt:
										authorAvatarAlt || m.alt || '',
								} )
							}
							allowedTypes={ [ 'image' ] }
							render={ ( { open } ) => (
								<Button variant="secondary" onClick={ open }>
									{ authorAvatarUrl
										? __( 'Replace avatar', 'awt-blocks' )
										: __( 'Upload avatar', 'awt-blocks' ) }
								</Button>
							) }
						/>
					</MediaUploadCheck>
					{ authorAvatarUrl && (
						<>
							<TextControl
								label={ __( 'Avatar alt text', 'awt-blocks' ) }
								help={ __(
									'Required when an avatar is set. Accessibility checks report missing alt text as an Error.',
									'awt-blocks'
								) }
								value={ authorAvatarAlt }
								onChange={ ( v ) =>
									setAttributes( { authorAvatarAlt: v } )
								}
							/>
							<Button
								variant="link"
								onClick={ () =>
									setAttributes( {
										authorAvatarUrl: '',
										authorAvatarAlt: '',
									} )
								}
							>
								{ __( 'Remove avatar', 'awt-blocks' ) }
							</Button>
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<figure { ...blockProps }>
				{ MARK_SVGS[ markStyle ] || null }
				<RichText
					tagName="blockquote"
					className="awt-testimonial__quote"
					value={ quote }
					onChange={ ( v ) => setAttributes( { quote: v } ) }
					placeholder={ __( 'Write the quote here', 'awt-blocks' ) }
					allowedFormats={ [ 'core/bold', 'core/italic' ] }
				/>
				<figcaption className="awt-testimonial__source">
					{ authorAvatarUrl && (
						<img
							className="awt-testimonial__avatar"
							src={ authorAvatarUrl }
							alt={ authorAvatarAlt }
						/>
					) }
					<div className="awt-testimonial__source-details">
						<RichText
							tagName="div"
							className="awt-testimonial__source-name"
							value={ authorName }
							onChange={ ( v ) =>
								setAttributes( { authorName: v } )
							}
							placeholder={ __( 'Author name', 'awt-blocks' ) }
							allowedFormats={ [] }
						/>
						<RichText
							tagName="div"
							className="awt-testimonial__source-role"
							value={ authorRole }
							onChange={ ( v ) =>
								setAttributes( { authorRole: v } )
							}
							placeholder={ __( 'Role', 'awt-blocks' ) }
							allowedFormats={ [] }
						/>
						<RichText
							tagName="div"
							className="awt-testimonial__source-org"
							value={ authorOrg }
							onChange={ ( v ) =>
								setAttributes( { authorOrg: v } )
							}
							placeholder={ __( 'Organization', 'awt-blocks' ) }
							allowedFormats={ [] }
						/>
						{ /* Mirrors render.php: the link is the last line of
						     the attribution, and only exists once there is an
						     address to point at. Not clickable here — a click
						     in the canvas selects the block. */ }
						{ href && (
							<span className="awt-testimonial__source-link cds--link">
								{ linkText ||
									__( 'Read the full story', 'awt-blocks' ) }
								{ iconName && (
									<span
										className="cds--link__icon"
										aria-hidden="true"
									>
										<span
											style={ {
												display: 'inline-block',
												width: '1rem',
												height: '1rem',
												background: 'currentColor',
												WebkitMaskImage: iconMaskImage(
													iconName,
													[ 32 ]
												),
												maskImage: iconMaskImage(
													iconName,
													[ 32 ]
												),
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
							</span>
						) }
					</div>
				</figcaption>
			</figure>
		</>
	);
}
