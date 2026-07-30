import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import IconPicker from '../shared/icon-picker';

const ALLOWED = [ 'awt/side-nav-link', 'awt/side-nav-divider' ];

export default function Edit( { attributes, setAttributes } ) {
	const { title, defaultExpanded, iconName } = attributes;
	const blockProps = useBlockProps( { className: 'cds--side-nav__section' } );
	// Mirrors render.php: the section title names the list it heads, so the
	// grouping a sighted user sees is conveyed programmatically too, not by
	// looks alone (WCAG 1.3.1). Untitled sections get no id and no reference.
	const headingId = useInstanceId( Edit, 'awt-side-nav-section' );
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'cds--side-nav__menu',
			'aria-labelledby': title ? headingId : undefined,
		},
		{ allowedBlocks: ALLOWED, orientation: 'vertical' }
	);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Side nav section', 'awt' ) }
					initialOpen={ true }
				>
					<ToggleControl
						label={ __( 'Default expanded', 'awt' ) }
						checked={ defaultExpanded }
						onChange={ ( value ) =>
							setAttributes( { defaultExpanded: value } )
						}
					/>
					<IconPicker
						label={ __( 'Icon', 'awt' ) }
						value={ iconName }
						onChange={ ( value ) =>
							setAttributes( { iconName: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				<RichText
					tagName="div"
					id={ headingId }
					className="cds--side-nav__submenu"
					value={ title }
					onChange={ ( value ) => setAttributes( { title: value } ) }
					placeholder={ __( 'Section heading (optional)', 'awt' ) }
					allowedFormats={ [] }
					style={ { fontWeight: 600, padding: '0.5rem 0' } }
				/>
				<ul { ...innerBlocksProps } />
			</li>
		</>
	);
}
