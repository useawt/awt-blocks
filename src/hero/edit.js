import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createBlock, cloneBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	Button,
} from '@wordpress/components';

// The hero body is a real block container (v2): every piece of content —
// eyebrow, heading, description, extra paragraphs/lists, CTA row — is an
// inner block, so it all appears in List View and is directly selectable.
const ALLOWED = [
	'core/paragraph',
	'core/heading',
	'core/list',
	'awt/inline-set',
	'awt/button',
	'awt/link',
];

// Image sizing options. Plain-language labels keep the real ratio in parens so
// authors who know "16:9" still recognise it. Values map to theme.css modifier
// classes (awt-hero__image--ratio-*, awt-hero--img-*); see render.php for the
// server side. '' ratio = keep the image's own proportions (no crop).
const RATIO_OPTIONS = [
	{ value: '', label: __( 'Original proportions', 'awt-blocks' ) },
	{ value: '1x1', label: __( 'Square (1:1)', 'awt-blocks' ) },
	{ value: '4x3', label: __( 'Landscape (4:3)', 'awt-blocks' ) },
	{ value: '3x2', label: __( 'Landscape (3:2)', 'awt-blocks' ) },
	{ value: '16x9', label: __( 'Widescreen (16:9)', 'awt-blocks' ) },
	{ value: '3x4', label: __( 'Portrait (3:4)', 'awt-blocks' ) },
	{ value: '4x5', label: __( 'Portrait (4:5)', 'awt-blocks' ) },
];
const WIDTH_OPTIONS = [
	{ value: 'equal', label: __( 'Equal to text', 'awt-blocks' ) },
	{ value: 'narrow', label: __( 'Narrower than text', 'awt-blocks' ) },
	{ value: 'wide', label: __( 'Wider than text', 'awt-blocks' ) },
];

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		version,
		eyebrow,
		heading,
		headingLevel,
		description,
		layout,
		imageUrl,
		imageAlt,
		imageRatio,
		imageWidth,
	} = attributes;
	const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const getBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks,
		[]
	);

	// v1 → v2 upgrade, run once when a v1 hero mounts. Converts the legacy
	// attribute text fields into real inner blocks (eyebrow paragraph, heading,
	// description paragraph) and wraps the legacy CTA children in an inline-set.
	// Runs at edit time — not as a block deprecation — so inline formats like
	// Highlight (<mark>) are registered and survive the rich-text conversion.
	// The change lands unsaved: the author reviews and saves; until then the
	// front end keeps rendering the stored v1 markup via render.php's v1 branch.
	useEffect( () => {
		if ( Number( version ) === 2 ) {
			return;
		}
		const body = [];
		if ( eyebrow ) {
			body.push(
				createBlock( 'core/paragraph', {
					className: 'awt-hero__eyebrow',
					content: eyebrow,
				} )
			);
		}
		if ( heading ) {
			body.push(
				createBlock( 'core/heading', {
					level: Number( headingLevel ) === 2 ? 2 : 1,
					className: 'awt-hero__heading',
					content: heading,
				} )
			);
		}
		if ( description ) {
			body.push(
				createBlock( 'core/paragraph', {
					className: 'awt-hero__description',
					content: description,
				} )
			);
		}
		const existing = getBlocks( clientId );
		if ( existing.length ) {
			body.push(
				createBlock(
					'awt/inline-set',
					{},
					existing.map( ( b ) => cloneBlock( b ) )
				)
			);
		}
		__unstableMarkNextChangeAsNotPersistent();
		replaceInnerBlocks( clientId, body, false );
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( {
			version: 2,
			eyebrow: '',
			heading: '',
			description: '',
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ version ] );

	// Mirror render.php's class grammar (awt-hero + awt-hero--{layout}) so the
	// theme.css rules drive styling identically in editor and front-end. The
	// image column-width modifier only applies in the two-column layout.
	const hasImageLayout = layout === 'text-with-image-right';
	const wrapperClass = [
		'awt-hero',
		`awt-hero--${ layout }`,
		hasImageLayout && imageWidth !== 'equal'
			? `awt-hero--img-${ imageWidth }`
			: '',
	]
		.filter( Boolean )
		.join( ' ' );
	const imageClass = [
		'awt-hero__image',
		imageRatio ? `awt-hero__image--ratio-${ imageRatio }` : '',
	]
		.filter( Boolean )
		.join( ' ' );
	const blockProps = useBlockProps( {
		className: wrapperClass,
	} );
	const innerProps = useInnerBlocksProps(
		{ className: 'awt-hero__text' },
		{ allowedBlocks: ALLOWED }
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Hero', 'awt-blocks' ) }>
					<SelectControl
						label={ __( 'Layout', 'awt-blocks' ) }
						value={ layout }
						options={ [
							{
								value: 'text-only',
								label: __(
									'Text only (centered)',
									'awt-blocks'
								),
							},
							{
								value: 'text-with-image-right',
								label: __(
									'Text + image on right',
									'awt-blocks'
								),
							},
						] }
						onChange={ ( v ) => setAttributes( { layout: v } ) }
					/>
					{ layout === 'text-with-image-right' && (
						<>
							<MediaUploadCheck>
								<MediaUpload
									onSelect={ ( m ) =>
										setAttributes( {
											imageUrl: m.url,
											imageAlt: imageAlt || m.alt || '',
										} )
									}
									allowedTypes={ [ 'image' ] }
									render={ ( { open } ) => (
										<Button
											variant="secondary"
											onClick={ open }
										>
											{ imageUrl
												? __(
														'Replace image',
														'awt-blocks'
												  )
												: __(
														'Upload image',
														'awt-blocks'
												  ) }
										</Button>
									) }
								/>
							</MediaUploadCheck>
							{ imageUrl && (
								<>
									<TextControl
										label={ __(
											'Image alt text',
											'awt-blocks'
										) }
										value={ imageAlt }
										onChange={ ( v ) =>
											setAttributes( { imageAlt: v } )
										}
									/>
									<SelectControl
										label={ __(
											'Image shape',
											'awt-blocks'
										) }
										help={ __(
											'Crop the image to a fixed shape. "Original proportions" keeps the image uncropped.',
											'awt-blocks'
										) }
										value={ imageRatio }
										options={ RATIO_OPTIONS }
										onChange={ ( v ) =>
											setAttributes( { imageRatio: v } )
										}
									/>
									<SelectControl
										label={ __(
											'Image column width',
											'awt-blocks'
										) }
										help={ __(
											'How much horizontal space the image gets next to the text. Applies on wider screens; the image stacks below the text on small screens.',
											'awt-blocks'
										) }
										value={ imageWidth }
										options={ WIDTH_OPTIONS }
										onChange={ ( v ) =>
											setAttributes( { imageWidth: v } )
										}
									/>
								</>
							) }
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div { ...innerProps } />
				{ hasImageLayout && imageUrl && (
					<img
						className={ imageClass }
						src={ imageUrl }
						alt={ imageAlt }
					/>
				) }
			</div>
		</>
	);
}
