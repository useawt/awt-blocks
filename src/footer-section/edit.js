import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import IconPicker from '../shared/icon-picker';

const ALLOWED = [ 'awt/footer-link' ];
const TEMPLATE = [
	[ 'awt/footer-link', { text: 'About', href: '/about' } ],
	[ 'awt/footer-link', { text: 'Privacy', href: '/privacy' } ],
];

export default function Edit( { attributes, setAttributes } ) {
	const { title, iconName } = attributes;
	const blockProps = useBlockProps( { className: 'cds--footer__section' } );
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'cds--footer__links',
			style: { listStyle: 'none', margin: 0, padding: 0 },
		},
		{ allowedBlocks: ALLOWED, template: TEMPLATE, orientation: 'vertical' }
	);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Footer section', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<IconPicker
						label={ __( 'Icon (optional)', 'awt-blocks' ) }
						value={ iconName }
						onChange={ ( value ) =>
							setAttributes( { iconName: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<RichText
					tagName="h2"
					className="cds--footer__heading"
					value={ title }
					onChange={ ( value ) => setAttributes( { title: value } ) }
					placeholder={ __(
						'Section heading (optional)',
						'awt-blocks'
					) }
					allowedFormats={ [] }
				/>
				<ul { ...innerBlocksProps } />
			</div>
		</>
	);
}
