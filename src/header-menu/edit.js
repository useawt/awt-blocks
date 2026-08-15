import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

const ALLOWED = [ 'awt/header-nav-item' ];
const TEMPLATE = [
	[ 'awt/header-nav-item', { text: 'Sub-link 1', href: '#' } ],
	[ 'awt/header-nav-item', { text: 'Sub-link 2', href: '#' } ],
];

export default function Edit( {
	attributes,
	setAttributes,
	clientId,
	isSelected,
} ) {
	const { text, ariaLabel } = attributes;

	// Open the submenu in the canvas ONLY while this block (or one of its
	// sub-links) is selected — same affordance as the core Navigation submenu.
	// Otherwise it stays collapsed so it doesn't cover the content below the
	// header during authoring. Click the menu (or a sub-link in the List View)
	// to expand it for editing.
	const hasSelectedChild = useSelect(
		( select ) =>
			select( 'core/block-editor' ).hasSelectedInnerBlock(
				clientId,
				true
			),
		[ clientId ]
	);
	const open = isSelected || hasSelectedChild;

	const blockProps = useBlockProps( { className: 'cds--header__submenu' } );

	// Mirror render.php's <ul class="cds--header__menu">. When open we force it
	// static + in-flow (inline styles beat Carbon's stylesheet) so the children
	// are visible and editable without overlapping siblings; when closed we let
	// Carbon's bundled CSS hide it (its reveal is keyed on aria-expanded="true").
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'cds--header__menu',
			'aria-label': ariaLabel || text || __( 'Menu', 'awt-blocks' ),
			style: open
				? {
						display: 'block',
						position: 'static',
						transform: 'none',
						boxShadow: 'none',
						insetBlockStart: 'auto',
				  }
				: undefined,
		},
		{ allowedBlocks: ALLOWED, template: TEMPLATE, orientation: 'vertical' }
	);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Header menu', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __(
							'Accessible name (aria-label)',
							'awt-blocks'
						) }
						help={ __(
							'Names the submenu for screen readers. Defaults to the menu label.',
							'awt-blocks'
						) }
						value={ ariaLabel }
						onChange={ ( value ) =>
							setAttributes( { ariaLabel: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid -- preview mirrors Carbon's header-menu reference markup (anchor with role=button), which render.php ships; the href is inert in the editor */ }
				<a
					className="cds--header__menu-item cds--header__menu-title"
					role="button"
					aria-haspopup="menu"
					aria-expanded={ open ? 'true' : 'false' }
					href="#"
					onClick={ ( e ) => e.preventDefault() }
				>
					<RichText
						tagName="span"
						value={ text }
						onChange={ ( value ) =>
							setAttributes( { text: value } )
						}
						placeholder={ __( 'Menu', 'awt-blocks' ) }
						allowedFormats={ [] }
					/>
					<svg
						className="cds--header__menu-arrow"
						focusable="false"
						preserveAspectRatio="xMidYMid meet"
						fill="currentColor"
						width="16"
						height="16"
						viewBox="0 0 16 16"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M8 11 3 6 3.7 5.3 8 9.6 12.3 5.3 13 6z" />
					</svg>
				</a>
				<ul { ...innerBlocksProps } />
			</li>
		</>
	);
}
