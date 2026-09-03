import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';

const ALLOWED = [ 'awt/tile', 'core/group', 'core/column' ];
const TEMPLATE = [
	[
		'awt/tile',
		{},
		[
			[ 'awt/icon', { iconName: 'checkmark', size: '24' } ],
			[ 'core/heading', { level: 3, content: 'Feature one' } ],
			[
				'core/paragraph',
				{ content: 'Brief description of this feature.' },
			],
		],
	],
	[
		'awt/tile',
		{},
		[
			[ 'awt/icon', { iconName: 'checkmark', size: '24' } ],
			[ 'core/heading', { level: 3, content: 'Feature two' } ],
			[
				'core/paragraph',
				{ content: 'Brief description of this feature.' },
			],
		],
	],
	[
		'awt/tile',
		{},
		[
			[ 'awt/icon', { iconName: 'checkmark', size: '24' } ],
			[ 'core/heading', { level: 3, content: 'Feature three' } ],
			[
				'core/paragraph',
				{ content: 'Brief description of this feature.' },
			],
		],
	],
];

export default function Edit( { attributes, setAttributes } ) {
	const { columns, gap } = attributes;
	// Use the same `awt-feature-grid--cols-{N}` modifier class render.php
	// emits; theme.css drives the grid-template-columns based on that class.
	// Drop the inline grid-template-columns style.
	const blockProps = useBlockProps( {
		className: `awt-feature-grid awt-feature-grid--cols-${ columns }`,
		style: {
			gap: `var(--cds-spacing-${ gap }, 1.5rem)`,
		},
	} );
	// Pass blockProps as the first arg so its className/style merge with
	// useInnerBlocksProps's (which adds `block-editor-block-list__layout`
	// itself). Previous `{ ...blockProps } { ...innerProps }` spread dropped
	// our `awt-feature-grid awt-feature-grid--cols-N` class because innerProps
	// won, leaving the editor with no grid at all.
	const innerProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED,
		template: TEMPLATE,
		orientation: 'horizontal',
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Feature grid', 'awt-blocks' ) }>
					<SelectControl
						label={ __( 'Columns', 'awt-blocks' ) }
						value={ String( columns ) }
						options={ [ '2', '3', '4' ].map( ( c ) => ( {
							value: c,
							label: c,
						} ) ) }
						onChange={ ( v ) =>
							setAttributes( { columns: parseInt( v, 10 ) } )
						}
					/>
					<SelectControl
						label={ __( 'Space between tiles', 'awt-blocks' ) }
						value={ gap }
						options={ [ '04', '05', '06', '07', '08', '09' ].map(
							( v ) => ( { value: v, label: `Spacing ${ v }` } )
						) }
						onChange={ ( v ) => setAttributes( { gap: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerProps } />
		</>
	);
}
