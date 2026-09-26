import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	TextControl,
	Notice,
} from '@wordpress/components';

const ALLOWED = [
	'awt/side-nav-section',
	'awt/side-nav-link',
	'awt/side-nav-divider',
];
const TEMPLATE = [
	[
		'awt/side-nav-section',
		{ title: 'Section' },
		[
			[ 'awt/side-nav-link', { text: 'Overview', href: '/overview' } ],
			[
				'awt/side-nav-link',
				{ text: 'Getting started', href: '/getting-started' },
			],
		],
	],
];

export default function Edit( { attributes, setAttributes } ) {
	const { ariaLabel, mode, id } = attributes;
	const isNone = mode === 'none';
	const blockProps = useBlockProps(
		isNone
			? {}
			: {
					// `--persistent` as well, matching render.php. Without it the
					// theme's layout rules — which key on
					// `body:has(.cds--side-nav--persistent)` to clear 16rem for the
					// content and footer — matched nothing in the editor canvas, so
					// a template preview drew the nav straight over its own content.
					// Editor and render class lists diverging is the second bug of
					// this shape in this block; treat any divergence as a defect.
					className:
						'cds--side-nav cds--side-nav--persistent awt-side-nav-preview',
					'aria-label': ariaLabel,
					style: {
						background: 'var(--cds-layer-01, #f4f4f4)',
						padding: '0.5rem',
						minWidth: '12rem',
					},
			  }
	);
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'cds--side-nav__items' },
		{ allowedBlocks: ALLOWED, template: TEMPLATE, orientation: 'vertical' }
	);

	// One inspector for both states, so an author who switched the nav off can
	// switch it back on from the same place.
	const inspector = (
		<InspectorControls>
			<PanelBody
				title={ __( 'Side nav', 'awt-blocks' ) }
				initialOpen={ true }
			>
				<ToggleControl
					label={ __( 'Show the side nav', 'awt-blocks' ) }
					help={ __(
						'Shows beside your content on wide screens. On small screens, its links move into the header menu.',
						'awt-blocks'
					) }
					checked={ ! isNone }
					onChange={ ( on ) =>
						setAttributes( { mode: on ? 'persistent' : 'none' } )
					}
				/>
				{ ! isNone && (
					<>
						<TextControl
							label={ __( 'HTML ID', 'awt-blocks' ) }
							help={ __(
								'Change this only if another element on the page uses the same ID.',
								'awt-blocks'
							) }
							value={ id }
							onChange={ ( value ) =>
								setAttributes( { id: value } )
							}
						/>
						<TextControl
							label={ __(
								'Accessible name (aria-label)',
								'awt-blocks'
							) }
							help={ __(
								'What screen readers call this navigation. Use a different name for each navigation on the page.',
								'awt-blocks'
							) }
							value={ ariaLabel }
							onChange={ ( value ) =>
								setAttributes( { ariaLabel: value } )
							}
						/>
					</>
				) }
			</PanelBody>
		</InspectorControls>
	);

	if ( isNone ) {
		return (
			<div { ...blockProps }>
				<Notice status="info" isDismissible={ false }>
					{ __(
						"The side nav is off and won't show on your site.",
						'awt-blocks'
					) }
				</Notice>
				{ inspector }
			</div>
		);
	}

	return (
		<>
			{ inspector }
			<aside { ...blockProps }>
				<nav
					className="cds--side-nav__navigation"
					aria-label={ ariaLabel || 'Side navigation' }
				>
					<ul { ...innerBlocksProps } />
				</nav>
			</aside>
		</>
	);
}
