import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

const ALLOWED = [ 'awt/header-nav-item', 'awt/header-menu' ];
const TEMPLATE = [
	[ 'awt/header-nav-item', { text: 'Home', href: '/' } ],
	[ 'awt/header-nav-item', { text: 'Docs', href: '/docs' } ],
];

export default function Edit( { attributes, setAttributes } ) {
	const { ariaLabel } = attributes;
	const blockProps = useBlockProps( {
		className: 'cds--header__nav',
		'aria-label': ariaLabel || 'Primary',
	} );
	// Match render.php: the <ul> carries `cds--header__menu-bar` (Carbon's
	// flex menu-bar layout) rather than ad-hoc inline flex, so the editor nav
	// bar lays out identically to the published header.
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'cds--header__menu-bar' },
		{
			allowedBlocks: ALLOWED,
			template: TEMPLATE,
			orientation: 'horizontal',
		}
	);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Header navigation', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __(
							'Accessible name (aria-label)',
							'awt-blocks'
						) }
						value={ ariaLabel }
						onChange={ ( value ) =>
							setAttributes( { ariaLabel: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<nav { ...blockProps }>
				<ul { ...innerBlocksProps } />
			</nav>
		</>
	);
}
