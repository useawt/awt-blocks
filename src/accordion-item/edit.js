import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';

const TEMPLATE = [
	[
		'core/paragraph',
		{ content: 'Section content. Replace with anything.' },
	],
];

export default function Edit( { attributes, setAttributes } ) {
	const { title, defaultExpanded, disabled, level } = attributes;
	const HeadingTag = `h${ level }`;
	const blockProps = useBlockProps( {
		className: `cds--accordion__item${
			defaultExpanded ? ' cds--accordion__item--active' : ''
		}`,
	} );
	const innerProps = useInnerBlocksProps(
		{ className: 'cds--accordion__content' },
		{ template: TEMPLATE }
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Accordion item', 'awt-blocks' ) }>
					<SelectControl
						label={ __( 'Title heading level', 'awt-blocks' ) }
						help={ __(
							'The heading level for the section title.',
							'awt-blocks'
						) }
						value={ level }
						options={ [
							{
								value: '2',
								label: __( 'Heading 2', 'awt-blocks' ),
							},
							{
								value: '3',
								label: __(
									'Heading 3 (default)',
									'awt-blocks'
								),
							},
							{
								value: '4',
								label: __( 'Heading 4', 'awt-blocks' ),
							},
							{
								value: '5',
								label: __( 'Heading 5', 'awt-blocks' ),
							},
							{
								value: '6',
								label: __( 'Heading 6', 'awt-blocks' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { level: v } ) }
					/>
					<ToggleControl
						label={ __( 'Open by default', 'awt-blocks' ) }
						checked={ defaultExpanded }
						onChange={ ( v ) =>
							setAttributes( { defaultExpanded: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Disabled', 'awt-blocks' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			{ /* Mirror the front-end render.php DOM exactly so Carbon's
			     compiled CSS (.cds--accordion__heading, .cds--accordion__arrow,
			     .cds--accordion__item--active variants) drives the styling.
			     Previously the editor used inline styles + a +/− text glyph;
			     now editor and front-end look identical including the
			     rotated-chevron expand/collapse indicator. */ }
			<li { ...blockProps }>
				<HeadingTag
					className="awt-accordion-item__heading"
					style={ { margin: 0 } }
				>
					<button
						type="button"
						className="cds--accordion__heading"
						aria-expanded={ defaultExpanded ? 'true' : 'false' }
						disabled={ disabled }
					>
						<svg
							className="cds--accordion__arrow"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							width="16"
							height="16"
							focusable="false"
							aria-hidden="true"
						>
							<path d="M11 8L6 13l-.7-.7L9.6 8 5.3 3.7 6 3z" />
						</svg>
						<RichText
							tagName="span"
							className="cds--accordion__title"
							value={ title }
							onChange={ ( v ) => setAttributes( { title: v } ) }
							placeholder={ __( 'Section title', 'awt-blocks' ) }
							allowedFormats={ [] }
						/>
					</button>
				</HeadingTag>
				<div { ...innerProps } />
			</li>
		</>
	);
}
