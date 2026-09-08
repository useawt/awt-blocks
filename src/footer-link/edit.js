import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { iconMaskImage } from '../shared/icon-preview-url';

export default function Edit( { attributes, setAttributes } ) {
	const { text, href, external } = attributes;
	const blockProps = useBlockProps( { className: 'cds--footer__link' } );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Footer link', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Link URL', 'awt-blocks' ) }
						value={ href }
						onChange={ ( value ) =>
							setAttributes( { href: value } )
						}
					/>
					<ToggleControl
						label={ __( 'External link', 'awt-blocks' ) }
						help={ __(
							'Opens in a new tab and adds an external-link icon.',
							'awt-blocks'
						) }
						checked={ external }
						onChange={ ( value ) =>
							setAttributes( { external: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				<a
					className="cds--link"
					href={ href || '#' }
					onClick={ ( e ) => e.preventDefault() }
				>
					<RichText
						tagName="span"
						value={ text }
						onChange={ ( value ) =>
							setAttributes( { text: value } )
						}
						placeholder={ __( 'Link label', 'awt-blocks' ) }
						allowedFormats={ [] }
					/>
					{ /* The page draws Carbon's `launch` here; a typed arrow
					     was standing in for it, so the editor showed a
					     different mark from the one the link would have. */ }
					{ external && (
						<span
							aria-hidden="true"
							style={ {
								display: 'inline-block',
								inlineSize: '1rem',
								blockSize: '1rem',
								background: 'currentColor',
								WebkitMaskImage: iconMaskImage( 'launch', [
									32,
								] ),
								maskImage: iconMaskImage( 'launch', [ 32 ] ),
								WebkitMaskRepeat: 'no-repeat',
								maskRepeat: 'no-repeat',
								WebkitMaskPosition: 'center',
								maskPosition: 'center',
								WebkitMaskSize: 'contain',
								maskSize: 'contain',
							} }
						/>
					) }
				</a>
			</li>
		</>
	);
}
