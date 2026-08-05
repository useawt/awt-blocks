import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	RichText,
} from '@wordpress/block-editor';

const ALLOWED = [ 'awt/tile' ];

// The template hands the author a working group rather than an empty box: two
// tiles already sharing a group name, which is what makes them one choice
// instead of two unrelated toggles.
const TEMPLATE = [
	[
		'awt/tile',
		{ variant: 'selectable', groupName: 'tile-choice', value: 'option-1' },
		[ [ 'core/paragraph', { content: __( 'Option 1', 'awt' ) } ] ],
	],
	[
		'awt/tile',
		{ variant: 'selectable', groupName: 'tile-choice', value: 'option-2' },
		[ [ 'core/paragraph', { content: __( 'Option 2', 'awt' ) } ] ],
	],
];

export default function Edit( { attributes, setAttributes } ) {
	const { label } = attributes;
	const blockProps = useBlockProps( { className: 'cds--tile-group' } );
	// Destructure `children` so the legend can be rendered BEFORE the tiles.
	// Wrapping the inner blocks in an extra element instead would make the
	// editor's structure differ from the server's, which is the exact class of
	// divergence scripts/check-class-parity.js exists to catch.
	const { children, ...innerProps } = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED,
		template: TEMPLATE,
		orientation: 'vertical',
	} );

	return (
		<fieldset { ...innerProps }>
			<RichText
				tagName="legend"
				className="cds--label"
				value={ label }
				onChange={ ( v ) => setAttributes( { label: v } ) }
				allowedFormats={ [] }
				placeholder={ __( 'What is this choice about?', 'awt' ) }
			/>
			{ children }
		</fieldset>
	);
}
