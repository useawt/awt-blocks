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
						label={ __( 'Link target (href)', 'awt-blocks' ) }
						value={ href }
						onChange={ ( value ) =>
							setAttributes( { href: value } )
						}
					/>
					<SelectControl
						label={ __( 'Current-URL match mode', 'awt-blocks' ) }
						help={ __(
							'Exact: only this URL highlights. Prefix: this URL and any descendant route highlight (useful for section roots).',
							'awt-blocks'
						) }
						value={ matchMode }
						options={ [
							{
								value: 'exact',
								label: __( 'Exact', 'awt-blocks' ),
							},
							{
								value: 'prefix',
								label: __( 'Prefix', 'awt-blocks' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { matchMode: value } )
						}
					/>
					<ToggleControl
						label={ __(
							'Force aria-current="page"',
							'awt-blocks'
						) }
						checked={ isCurrent }
						onChange={ ( value ) =>
							setAttributes( { isCurrent: value } )
						}
						help={ __(
							'Overrides automatic URL matching for edge cases.',
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
