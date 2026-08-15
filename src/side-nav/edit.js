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
						'On wide screens the side nav sits beside your content. On narrow screens its links move into the header menu, behind the header’s menu button.',
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
							label={ __( 'HTML id', 'awt-blocks' ) }
							help={ __(
								'The id given to the side nav in the page’s HTML. Change it only if something else on the page already uses this one.',
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
								'What a screen reader calls this navigation. Give each navigation on the page a different name.',
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
						'The side nav is switched off, so it does not appear on the published page.',
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
