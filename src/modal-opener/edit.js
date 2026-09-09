import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';

const KIND = [ 'primary', 'secondary', 'tertiary', 'ghost', 'danger' ].map(
	( v ) => ( { value: v, label: v } )
);
const SIZE = [ 'sm', 'md', 'lg', 'xl' ].map( ( v ) => ( {
	value: v,
	label: v,
} ) );

export default function Edit( { attributes, setAttributes } ) {
	const { text, kind, size, modalId } = attributes;
	const blockProps = useBlockProps( {
		// `cds--btn--{size}` sets no height; only `cds--layout--size-{size}`
		// does. Without it the canvas shows every size at Carbon's `lg`
		// default, which is what the page did too (see render.php).
		className: `cds--btn cds--btn--${ kind } cds--btn--${ size } cds--layout--size-${ size }`,
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Modal opener', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Modal id to open', 'awt-blocks' ) }
						help={ __(
							"Must match the awt/modal block's id.",
							'awt-blocks'
						) }
						value={ modalId }
						onChange={ ( v ) => setAttributes( { modalId: v } ) }
					/>
					<SelectControl
						label={ __( 'Kind', 'awt-blocks' ) }
						value={ kind }
						options={ KIND }
						onChange={ ( v ) => setAttributes( { kind: v } ) }
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ SIZE }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<button
				type="button"
				{ ...blockProps }
				onClick={ ( e ) => e.preventDefault() }
			>
				<RichText
					tagName="span"
					value={ text }
					onChange={ ( v ) => setAttributes( { text: v } ) }
					allowedFormats={ [] }
					placeholder={ __( 'Button label', 'awt-blocks' ) }
				/>
			</button>
		</>
	);
}
