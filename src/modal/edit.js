import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ToggleControl,
	Notice,
} from '@wordpress/components';
import PremiumNotice from '../shared/premium-notice';

const TEMPLATE = [ [ 'core/paragraph', { content: 'Modal body content.' } ] ];

const TARGET_OPTIONS = [
	{ label: 'Same window', value: '' },
	{ label: 'New tab/window', value: '_blank' },
	{ label: 'Parent frame', value: '_parent' },
	{ label: 'Top frame', value: '_top' },
];

export default function Edit( { attributes, setAttributes } ) {
	// onClickFunction stays in block.json for round-trip of Premium-authored
	// content, but the editor only shows the Premium upsell (no control).
	const {
		id,
		heading,
		label,
		size,
		primaryAction,
		secondaryAction,
		danger,
		primaryHref,
		primaryTarget,
		primaryRel,
	} = attributes;
	// Editor-only preview wrapper. The front-end modal is display:none until
	// opened, so we render a dashed-border "preview frame" in the editor so
	// authors can see + edit the modal's content. The buttons/footer/header
	// inside use Carbon classes; loaded carbon.min.css styles them.
	const blockProps = useBlockProps( {
		className: 'awt-modal-preview',
		style: {
			border: '1px dashed var(--cds-border-strong, #8d8d8d)',
			padding: 'var(--cds-spacing-05, 1rem)',
			background: 'var(--cds-layer-01, #f4f4f4)',
		},
	} );
	const innerProps = useInnerBlocksProps(
		{ className: 'cds--modal-content' },
		{ template: TEMPLATE }
	);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Modal', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'DOM id', 'awt-blocks' ) }
						help={ __(
							'An awt/modal-opener with a matching Panel ID opens this modal.',
							'awt-blocks'
						) }
						value={ id }
						onChange={ ( v ) => setAttributes( { id: v } ) }
					/>
					<TextControl
						label={ __(
							'Optional label (above heading)',
							'awt-blocks'
						) }
						value={ label }
						onChange={ ( v ) => setAttributes( { label: v } ) }
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ [
							{ label: 'sm', value: 'sm' },
							{ label: 'md', value: 'md' },
							{ label: 'lg', value: 'lg' },
							{ label: 'xs', value: 'xs' },
						] }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<TextControl
						label={ __( 'Primary action label', 'awt-blocks' ) }
						value={ primaryAction }
						onChange={ ( v ) =>
							setAttributes( { primaryAction: v } )
						}
					/>
					<TextControl
						label={ __( 'Secondary action label', 'awt-blocks' ) }
						value={ secondaryAction }
						onChange={ ( v ) =>
							setAttributes( { secondaryAction: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Danger styling', 'awt-blocks' ) }
						checked={ danger }
						onChange={ ( v ) => setAttributes( { danger: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Primary action link', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __(
							'URL (turns the primary button into a link)',
							'awt-blocks'
						) }
						value={ primaryHref }
						onChange={ ( v ) =>
							setAttributes( { primaryHref: v } )
						}
						type="url"
					/>
					<SelectControl
						label={ __( 'Target', 'awt-blocks' ) }
						value={ primaryTarget }
						options={ TARGET_OPTIONS }
						onChange={ ( v ) =>
							setAttributes( { primaryTarget: v } )
						}
						disabled={ ! primaryHref }
					/>
					<TextControl
						label={ __(
							'rel (auto: "noopener noreferrer" for new tab)',
							'awt-blocks'
						) }
						value={ primaryRel }
						onChange={ ( v ) => setAttributes( { primaryRel: v } ) }
						disabled={ ! primaryHref }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Primary action — on click', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<PremiumNotice
						title={ __(
							'Run a JavaScript function',
							'awt-blocks'
						) }
						description={ __(
							'Call a JavaScript function by name when clicked.',
							'awt-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<Notice status="info" isDismissible={ false }>
					{ __(
						'This is a preview for editing. On your live site the modal stays hidden until a visitor opens it.',
						'awt-blocks'
					) }
				</Notice>
				{ label && (
					<p className="cds--modal-header__label">{ label }</p>
				) }
				<RichText
					tagName="h2"
					className="cds--modal-header__heading"
					value={ heading }
					onChange={ ( v ) => setAttributes( { heading: v } ) }
					placeholder={ __( 'Modal heading', 'awt-blocks' ) }
					allowedFormats={ [] }
				/>
				<div { ...innerProps } />
				<div className="cds--modal-footer">
					<button
						type="button"
						className="cds--btn cds--btn--secondary cds--btn--lg"
					>
						{ secondaryAction }
					</button>
					{ primaryHref ? (
						<a
							href={ primaryHref }
							className={ `cds--btn cds--btn--${
								danger ? 'danger' : 'primary'
							} cds--btn--lg cds--modal-primary-button` }
							onClick={ ( e ) => e.preventDefault() }
						>
							{ primaryAction }
						</a>
					) : (
						<button
							type="button"
							className={ `cds--btn cds--btn--${
								danger ? 'danger' : 'primary'
							} cds--btn--lg` }
						>
							{ primaryAction }
						</button>
					) }
				</div>
			</div>
		</>
	);
}
