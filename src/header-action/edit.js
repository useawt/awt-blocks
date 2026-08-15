import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';
import IconPicker, { iconPreviewUrl } from '../shared/icon-picker';

const KIND_OPTIONS = [
	{ value: 'icon-only', label: __( 'Icon only', 'awt-blocks' ) },
	{ value: 'with-label', label: __( 'Icon with label', 'awt-blocks' ) },
];

export default function Edit( { attributes, setAttributes } ) {
	const { iconName, label, href, panelId, kind } = attributes;
	// Mirror render.php structure: <a> when href is set and no panel; <button>
	// otherwise. Sizing/spacing comes from `.cds--header__action` in theme.css
	// (same CSS for editor + published) — no inline styles here.
	const blockProps = useBlockProps( { className: 'cds--header__action' } );

	const iconNode = iconName && (
		<span
			aria-hidden="true"
			className="cds--header__action-icon"
			style={ {
				display: 'inline-block',
				width: '1.25rem',
				height: '1.25rem',
				background: 'currentColor',
				WebkitMaskImage: `url(${ iconPreviewUrl( iconName, [ 32 ] ) })`,
				maskImage: `url(${ iconPreviewUrl( iconName, [ 32 ] ) })`,
				WebkitMaskRepeat: 'no-repeat',
				maskRepeat: 'no-repeat',
				WebkitMaskPosition: 'center',
				maskPosition: 'center',
				WebkitMaskSize: 'contain',
				maskSize: 'contain',
			} }
		/>
	);

	const inner = (
		<>
			{ iconNode }
			{ kind === 'with-label' && label && (
				<span className="cds--header__action-label">{ label }</span>
			) }
		</>
	);

	const isAnchor = href && ! panelId;

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Header action', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<IconPicker
						label={ __( 'Icon', 'awt-blocks' ) }
						value={ iconName }
						onChange={ ( value ) =>
							setAttributes( { iconName: value } )
						}
					/>
					<TextControl
						label={ __( 'Accessible name', 'awt-blocks' ) }
						help={ __(
							'Required. Spoken by screen readers; visible only when kind is "Icon with label".',
							'awt-blocks'
						) }
						value={ label }
						onChange={ ( value ) =>
							setAttributes( { label: value } )
						}
					/>
					<SelectControl
						label={ __( 'Kind', 'awt-blocks' ) }
						value={ kind }
						options={ KIND_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { kind: value } )
						}
					/>
					<TextControl
						label={ __( 'Link target (href)', 'awt-blocks' ) }
						help={ __(
							'If set, renders as <a>. Leave blank for a button.',
							'awt-blocks'
						) }
						value={ href }
						onChange={ ( value ) =>
							setAttributes( { href: value } )
						}
					/>
					<TextControl
						label={ __( 'Panel ID', 'awt-blocks' ) }
						help={ __(
							'If set, clicking the button toggles a matching awt/panel / awt/modal / awt/side-nav.',
							'awt-blocks'
						) }
						value={ panelId }
						onChange={ ( value ) =>
							setAttributes( { panelId: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			{ isAnchor ? (
				<a
					{ ...blockProps }
					href={ href }
					aria-label={ label }
					onClick={ ( e ) => e.preventDefault() }
				>
					{ inner }
				</a>
			) : (
				<button
					{ ...blockProps }
					type="button"
					aria-label={ label }
					onClick={ ( e ) => e.preventDefault() }
				>
					{ inner }
				</button>
			) }
		</>
	);
}
