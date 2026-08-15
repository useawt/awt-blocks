import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';

const TEMPLATE = [
	[ 'awt/breadcrumb-item', { text: 'Home', href: '/' } ],
	[ 'awt/breadcrumb-item', { text: 'Section', href: '#' } ],
	[ 'awt/breadcrumb-item', { text: 'Current page', isCurrentPage: true } ],
];

export default function Edit( { attributes, setAttributes } ) {
	const { noTrailingSlash, ariaLabel } = attributes;
	const classes = [
		'cds--breadcrumb',
		noTrailingSlash ? 'cds--breadcrumb--no-trailing-slash' : null,
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps( {
		className: classes,
		'aria-label': ariaLabel || 'Breadcrumbs',
	} );
	const innerProps = useInnerBlocksProps(
		{ className: 'cds--breadcrumb__list' },
		{
			template: TEMPLATE,
			allowedBlocks: [ 'awt/breadcrumb-item' ],
			orientation: 'horizontal',
		}
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Breadcrumb', 'awt-blocks' ) }>
					<TextControl
						label={ __(
							'Accessible name (aria-label)',
							'awt-blocks'
						) }
						value={ ariaLabel }
						onChange={ ( v ) => setAttributes( { ariaLabel: v } ) }
					/>
					<ToggleControl
						label={ __( 'No trailing slash', 'awt-blocks' ) }
						checked={ noTrailingSlash }
						onChange={ ( v ) =>
							setAttributes( { noTrailingSlash: v } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<nav { ...blockProps }>
				<ol { ...innerProps } />
			</nav>
		</>
	);
}
