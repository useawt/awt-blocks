import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';

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
					{ external && <span aria-hidden="true"> ↗</span> }
				</a>
			</li>
		</>
	);
}
