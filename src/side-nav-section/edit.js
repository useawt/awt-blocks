import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import IconPicker from '../shared/icon-picker';

const ALLOWED = [ 'awt/side-nav-link', 'awt/side-nav-divider' ];

export default function Edit( { attributes, setAttributes } ) {
	const { title, iconName } = attributes;
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
					title={ __( 'Side nav section', 'awt-blocks' ) }
					initialOpen={ true }
				>
					{ /*
					 * No "Default expanded" toggle. It set an attribute that
					 * produced `cds--side-nav__section--expanded`, a class no
					 * stylesheet defines — neither Carbon's nor ours — so both
					 * positions rendered identically. Same phantom-control family
					 * as the four dropped from awt/side-nav; a section is a static
					 * group and there is nothing to expand. The attribute stays
					 * registered in block.json so saved content round-trips.
					 */ }
					<IconPicker
						label={ __( 'Icon', 'awt-blocks' ) }
						value={ iconName }
						onChange={ ( value ) =>
							setAttributes( { iconName: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				{ /*
				 * `cds--side-nav__heading`, the same class render.php emits — not
				 * Carbon's `__submenu`, which this used to carry. That mismatch was
				 * not cosmetic: theme.css un-collapses a section's link list with
				 * `.cds--side-nav__heading + .cds--side-nav__menu`, because Carbon
				 * ships `.cds--side-nav__menu { max-block-size: 0; visibility:
				 * hidden }` and expects a real toggle button to open it. With the
				 * wrong class on the heading that rule matched nothing in the
				 * editor, so every section in the canvas showed its title with its
				 * links collapsed to zero height — including the ones the theme
				 * ships. The heading's own styling comes from the same stylesheet,
				 * so there is no inline style here either: canvas and published
				 * page now render the identical thing.
				 */ }
				<RichText
					tagName="div"
					id={ headingId }
					className="cds--side-nav__heading"
					value={ title }
					onChange={ ( value ) => setAttributes( { title: value } ) }
					placeholder={ __(
						'Section heading (optional)',
						'awt-blocks'
					) }
					allowedFormats={ [] }
				/>
				<ul { ...innerBlocksProps } />
			</li>
		</>
	);
}
