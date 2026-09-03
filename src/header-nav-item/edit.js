import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';

export default function Edit( { attributes, setAttributes } ) {
	const { text, href, isCurrent, matchMode } = attributes;
	// Mirror render.php exactly: the <li> carries no Carbon class (just the
	// block wrapper) and `cds--header__menu-item` goes on the <a>. The old
	// editor markup put that class on the <li> and an invented
	// `cds--header__menu-item-link` (which doesn't exist in Carbon's CSS) on
	// the <a>, so editor nav items rendered as unstyled blue underlined links.
	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Nav item', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Link URL', 'awt-blocks' ) }
						value={ href }
						onChange={ ( value ) =>
							setAttributes( { href: value } )
						}
					/>
					<SelectControl
						label={ __( 'Highlight this link when', 'awt-blocks' ) }
						help={ __(
							'Use the second option for a link to a section, so it stays highlighted on every page inside that section.',
							'awt-blocks'
						) }
						value={ matchMode }
						options={ [
							{
								value: 'exact',
								label: __( 'This address only', 'awt-blocks' ),
							},
							{
								value: 'prefix',
								label: __(
									'This address or any page under it',
									'awt-blocks'
								),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { matchMode: value } )
						}
					/>
					<ToggleControl
						label={ __(
							'Always mark as the current page',
							'awt-blocks'
						) }
						checked={ isCurrent }
						onChange={ ( value ) =>
							setAttributes( { isCurrent: value } )
						}
						help={ __(
							'Turn this on when the automatic address matching gets it wrong.',
							'awt-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				<a
					className="cds--header__menu-item"
					href={ href || '#' }
					onClick={ ( e ) => e.preventDefault() }
				>
					<RichText
						tagName="span"
						value={ text }
						onChange={ ( value ) =>
							setAttributes( { text: value } )
						}
						placeholder={ __( 'Nav item label', 'awt-blocks' ) }
						allowedFormats={ [] }
					/>
				</a>
			</li>
		</>
	);
}
