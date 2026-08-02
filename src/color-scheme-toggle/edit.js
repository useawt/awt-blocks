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

// Inline sun SVG mirrors render.php so the editor preview shows the same icon
// the published page will render.
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
		<path d="M8 11a3 3 0 110-6 3 3 0 010 6zm0-1a2 2 0 100-4 2 2 0 000 4zM7.5 1h1v2h-1V1zm0 12h1v2h-1v-2zM1 7.5h2v1H1v-1zm12 0h2v1h-2v-1zM2.8 2.1l.7-.7 1.4 1.4-.7.7-1.4-1.4zm9.3 9.3l.7-.7 1.4 1.4-.7.7-1.4-1.4zM2.1 13.2l1.4-1.4.7.7-1.4 1.4-.7-.7zM11.4 3.9l1.4-1.4.7.7-1.4 1.4-.7-.7z" />
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
