import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	RichText,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';

export default function Edit( { attributes, setAttributes } ) {
	const { text, href, isCurrentPage } = attributes;
	const isLink = ! isCurrentPage && href !== '';

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Breadcrumb item', 'awt-blocks' ) }>
					<TextControl
						label={ __( 'URL', 'awt-blocks' ) }
						value={ href }
						onChange={ ( v ) => setAttributes( { href: v } ) }
						type="url"
						disabled={ isCurrentPage }
					/>
					<ToggleControl
						label={ __( 'Current page', 'awt-blocks' ) }
						checked={ isCurrentPage }
						onChange={ ( v ) =>
							setAttributes( { isCurrentPage: v } )
						}
						help={ __(
							'Sets aria-current="page" and renders as plain text.',
							'awt-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...useBlockProps( { className: 'cds--breadcrumb-item' } ) }>
				<RichText
					tagName={ isLink ? 'a' : 'span' }
					className={ isLink ? 'cds--link' : undefined }
					value={ text }
					onChange={ ( v ) => setAttributes( { text: v } ) }
					placeholder={ __( 'Item', 'awt-blocks' ) }
					allowedFormats={ [] }
					aria-current={ isCurrentPage ? 'page' : undefined }
				/>
			</li>
		</>
	);
}
