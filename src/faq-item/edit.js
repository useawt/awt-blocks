import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl, SelectControl } from '@wordpress/components';
import PremiumNotice from '../shared/premium-notice';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			content:
				'Answer body. Replace with paragraphs, lists, code, links — anything.',
		},
	],
];

export default function Edit( { attributes, setAttributes, context } ) {
	// `answer` (the plain-text SEO shadow) is intentionally not destructured: the
	// attribute stays in block.json for clean round-trip of Premium-authored
	// content, but the editable control is Premium-gated (see below).
	const { question, defaultExpanded, level } = attributes;
	const HeadingTag = `h${ level }`;
	// Mirrors render.php: <li> only when an awt/accordion is above us (it
	// renders the <ul>), <div> when this question stands on its own, because a
	// lone <li> outside a list is an invalid list structure.
	const RootTag = context?.[ 'awt/accordion/size' ] ? 'li' : 'div';
	const blockProps = useBlockProps( {
		className: `awt-faq-item cds--accordion__item${
			defaultExpanded ? ' cds--accordion__item--active' : ''
		}`,
	} );
	const innerProps = useInnerBlocksProps(
		{ className: 'cds--accordion__content awt-faq-item__answer' },
		{ template: TEMPLATE }
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'FAQ question', 'awt' ) }>
					<SelectControl
						label={ __( 'Question heading level', 'awt' ) }
						help={ __(
							"The semantic heading level that wraps the question. Default H3 matches Carbon's accordion convention; override based on the surrounding page hierarchy.",
							'awt'
						) }
						value={ level }
						options={ [
							{ value: '2', label: __( 'Heading 2', 'awt' ) },
							{
								value: '3',
								label: __( 'Heading 3 (default)', 'awt' ),
							},
							{ value: '4', label: __( 'Heading 4', 'awt' ) },
							{ value: '5', label: __( 'Heading 5', 'awt' ) },
							{ value: '6', label: __( 'Heading 6', 'awt' ) },
						] }
						onChange={ ( v ) => setAttributes( { level: v } ) }
					/>
					<ToggleControl
						label={ __( 'Open by default', 'awt' ) }
						checked={ defaultExpanded }
						onChange={ ( v ) =>
							setAttributes( { defaultExpanded: v } )
						}
					/>
					<PremiumNotice
						title={ __( 'FAQ rich results', 'awt' ) }
						description={ __(
							'Output FAQ structured data (the JSON Google reads to show this Q&A directly in search results). Available in AWT Premium.',
							'awt'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<RootTag { ...blockProps }>
				<HeadingTag
					className="awt-faq-item__question-heading"
					style={ { margin: 0 } }
				>
					<button
						type="button"
						className="cds--accordion__heading awt-faq-item__trigger"
						aria-expanded={ defaultExpanded ? 'true' : 'false' }
						style={ {
							background: 'transparent',
							border: 0,
							borderBlockEnd:
								'1px solid var(--cds-border-subtle, #e0e0e0)',
							padding: '0.75rem 0',
							inlineSize: '100%',
							textAlign: 'start',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							font: 'inherit',
							color: 'inherit',
							cursor: 'pointer',
						} }
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
							className="cds--accordion__title awt-faq-item__question"
							value={ question }
							onChange={ ( v ) =>
								setAttributes( { question: v } )
							}
							placeholder={ __( 'Question?', 'awt' ) }
							allowedFormats={ [] }
						/>
					</button>
				</HeadingTag>
				<div { ...innerProps } />
			</RootTag>
		</>
	);
}
