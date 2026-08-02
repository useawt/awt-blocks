import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	Notice,
} from '@wordpress/components';

const KIND_OPTIONS = [
	{ value: 'icon-only', label: __( 'Icon only', 'awt' ) },
	{ value: 'with-label', label: __( 'Icon with label', 'awt' ) },
	{
		value: 'segmented',
		label: __( 'Segmented (Light / Auto / Dark)', 'awt' ),
	},
];

// Carbon's `light` icon, mirroring render.php so the editor preview shows the
// same icon the published page will render. The preview is always the
// light-mode state, so render.php's `asleep` counterpart has no place here.
const SunIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 16 16"
		width="20"
		height="20"
		fill="currentColor"
		focusable="false"
		aria-hidden="true"
	>
		<path d="M7.5 1H8.5V3.5H7.5z" />
		<path
			d="M10.8 3.4H13.3V4.4H10.8z"
			transform="rotate(-45 12.041 3.923)"
		/>
		<path d="M12.5 7.5H15V8.5H12.5z" />
		<path
			d="M11.6 10.8H12.6V13.3H11.6z"
			transform="rotate(-45 12.075 12.04)"
		/>
		<path d="M7.5 12.5H8.5V15H7.5z" />
		<path d="M2.7 11.6H5.2V12.6H2.7z" transform="rotate(-45 3.96 12.078)" />
		<path d="M1 7.5H3.5V8.5H1z" />
		<path d="M3.4 2.7H4.4V5.2H3.4z" transform="rotate(-45 3.925 3.961)" />
		<path d="M8,6c1.1,0,2,0.9,2,2s-0.9,2-2,2S6,9.1,6,8S6.9,6,8,6 M8,5C6.3,5,5,6.3,5,8s1.3,3,3,3s3-1.3,3-3S9.7,5,8,5z" />
	</svg>
);

// Mirror render.php: segmented kind → role=group div with 3 buttons;
// icon-only / with-label → single <button> with .cds--header__action sizing.
// All visual rules live in theme.css so editor and published match.
const CLASS_BY_KIND = {
	segmented: 'awt-color-scheme-toggle awt-color-scheme-toggle--segmented',
	'with-label':
		'awt-color-scheme-toggle awt-color-scheme-toggle--with-label cds--header__action',
	'icon-only':
		'awt-color-scheme-toggle awt-color-scheme-toggle--icon-only cds--header__action',
};

export default function Edit( { attributes, setAttributes } ) {
	const { kind, lightLabel, darkLabel, autoLabel } = attributes;
	const isSegmented = kind === 'segmented';

	const blockProps = useBlockProps( {
		className: CLASS_BY_KIND[ kind ] || CLASS_BY_KIND[ 'icon-only' ],
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Color scheme toggle', 'awt' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Kind', 'awt' ) }
						value={ kind }
						options={ KIND_OPTIONS }
						onChange={ ( v ) => setAttributes( { kind: v } ) }
					/>
					<TextControl
						label={ __( 'Light-state label', 'awt' ) }
						value={ lightLabel }
						onChange={ ( v ) => setAttributes( { lightLabel: v } ) }
					/>
					{ isSegmented && (
						<TextControl
							label={ __( 'Auto-state label', 'awt' ) }
							value={ autoLabel }
							onChange={ ( v ) =>
								setAttributes( { autoLabel: v } )
							}
						/>
					) }
					<TextControl
						label={ __( 'Dark-state label', 'awt' ) }
						value={ darkLabel }
						onChange={ ( v ) => setAttributes( { darkLabel: v } ) }
					/>
					<Notice status="info" isDismissible={ false }>
						{ __(
							'Only renders on the front-end when allowVisitorOverride is enabled in theme settings.',
							'awt'
						) }
					</Notice>
				</PanelBody>
			</InspectorControls>
			{ isSegmented ? (
				<div
					{ ...blockProps }
					role="group"
					aria-label={ __( 'Color scheme', 'awt' ) }
				>
					<button
						type="button"
						data-awt-scheme="light"
						aria-pressed="false"
						onClick={ ( e ) => e.preventDefault() }
					>
						{ lightLabel }
					</button>
					<button
						type="button"
						data-awt-scheme="auto"
						aria-pressed="true"
						onClick={ ( e ) => e.preventDefault() }
					>
						{ autoLabel }
					</button>
					<button
						type="button"
						data-awt-scheme="dark"
						aria-pressed="false"
						onClick={ ( e ) => e.preventDefault() }
					>
						{ darkLabel }
					</button>
				</div>
			) : (
				<button
					{ ...blockProps }
					type="button"
					// A toggle button named after what it turns on, with the
					// state in aria-pressed. Mirrors render.php, where
					// with-label takes its name from the visible label instead.
					aria-label={ kind === 'with-label' ? undefined : darkLabel }
					aria-pressed="false"
					onClick={ ( e ) => e.preventDefault() }
				>
					<span className="awt-color-scheme-toggle__icon">
						<SunIcon />
					</span>
					{ kind === 'with-label' && (
						<span className="awt-color-scheme-toggle__label">
							{ darkLabel }
						</span>
					) }
				</button>
			) }
		</>
	);
}
