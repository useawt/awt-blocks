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
	TextareaControl,
} from '@wordpress/components';

const ALIGN_OPTIONS = [
	'top',
	'top-start',
	'top-end',
	'bottom',
	'bottom-start',
	'bottom-end',
	'left',
	'right',
].map( ( v ) => ( { value: v, label: v } ) );

export default function Edit( { attributes, setAttributes } ) {
	const { label, description, ariaLabel, align } = attributes;
	const blockProps = useBlockProps();

	// Mirrors Carbon's reference DOM (label outside the popover container;
	// popover > popover-content > toggletip-content). The popover stays
	// closed in the canvas — the description is edited in the sidebar.
	const containerClass = [
		'cds--popover-container',
		'cds--popover--caret',
		'cds--popover--high-contrast',
		`cds--popover--${ align }`,
		'cds--toggletip',
	].join( ' ' );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Toggletip', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Trigger label (visible)', 'awt-blocks' ) }
						help={ __(
							'Optional. Renders before the info button.',
							'awt-blocks'
						) }
						value={ label }
						onChange={ ( v ) => setAttributes( { label: v } ) }
					/>
					<TextControl
						label={ __( 'Trigger accessible name', 'awt-blocks' ) }
						help={ __(
							'Read by screen readers (e.g., "Learn more").',
							'awt-blocks'
						) }
						value={ ariaLabel }
						onChange={ ( v ) => setAttributes( { ariaLabel: v } ) }
					/>
					<TextareaControl
						label={ __( 'Description', 'awt-blocks' ) }
						help={ __(
							'The text shown in the pop-up.',
							'awt-blocks'
						) }
						value={ description }
						onChange={ ( v ) =>
							setAttributes( { description: v } )
						}
						rows={ 4 }
					/>
					<SelectControl
						label={ __( 'Placement', 'awt-blocks' ) }
						value={ align }
						options={ ALIGN_OPTIONS }
						onChange={ ( v ) => setAttributes( { align: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<span { ...blockProps }>
				{ label && (
					<RichText
						tagName="span"
						className="cds--toggletip-label"
						value={ label }
						onChange={ ( v ) => setAttributes( { label: v } ) }
						allowedFormats={ [] }
					/>
				) }
				<span className={ containerClass }>
					<button
						type="button"
						className="cds--toggletip-button"
						aria-label={ ariaLabel }
						aria-expanded="false"
						onClick={ ( e ) => e.preventDefault() }
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							width="16"
							height="16"
							fill="currentColor"
							aria-hidden="true"
							focusable="false"
						>
							<path d="M8.5 11V6.5h-2v1h1V11H6v1h4v-1zM8 3.5A.75.75 0 108.75 4.25.75.75 0 008 3.5z" />
							<path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0-13a6 6 0 100 12A6 6 0 008 2z" />
						</svg>
					</button>
					<span className="cds--popover">
						<span className="cds--popover-content">
							<div className="cds--toggletip-content">
								<p>{ description }</p>
							</div>
						</span>
						<span className="cds--popover-caret"></span>
					</span>
				</span>
			</span>
		</>
	);
}
