import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';

const ALIGN_OPTIONS = [
	{ label: 'Top', value: 'top' },
	{ label: 'Top start', value: 'top-start' },
	{ label: 'Top end', value: 'top-end' },
	{ label: 'Bottom', value: 'bottom' },
	{ label: 'Bottom start', value: 'bottom-start' },
	{ label: 'Bottom end', value: 'bottom-end' },
	{ label: 'Left', value: 'left' },
	{ label: 'Right', value: 'right' },
];

export default function Edit( { attributes, setAttributes, isSelected } ) {
	const {
		description,
		align,
		defaultOpen,
		enterDelayMs,
		leaveDelayMs,
		triggerText,
	} = attributes;
	const classes = [ 'cds--tooltip', `cds--tooltip--${ align }` ].join( ' ' );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Tooltip', 'awt-blocks' ) }>
					<TextareaControl
						label={ __( 'Description', 'awt-blocks' ) }
						value={ description }
						onChange={ ( v ) =>
							setAttributes( { description: v } )
						}
					/>
					<SelectControl
						label={ __( 'Alignment', 'awt-blocks' ) }
						value={ align }
						options={ ALIGN_OPTIONS }
						onChange={ ( v ) => setAttributes( { align: v } ) }
					/>
					<ToggleControl
						label={ __( 'Open by default', 'awt-blocks' ) }
						checked={ defaultOpen }
						onChange={ ( v ) =>
							setAttributes( { defaultOpen: v } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Delays (ms)', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __( 'Show delay', 'awt-blocks' ) }
						type="number"
						value={ enterDelayMs }
						onChange={ ( v ) =>
							setAttributes( { enterDelayMs: Number( v ) || 0 } )
						}
					/>
					<TextControl
						label={ __( 'Hide delay', 'awt-blocks' ) }
						type="number"
						value={ leaveDelayMs }
						onChange={ ( v ) =>
							setAttributes( { leaveDelayMs: Number( v ) || 0 } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps( { className: 'awt-block-wrap' } ) }>
				<span className={ classes }>
					<RichText
						tagName="span"
						className="cds--tooltip__trigger"
						value={ triggerText }
						onChange={ ( v ) =>
							setAttributes( { triggerText: v } )
						}
						placeholder={ __( 'Trigger text', 'awt-blocks' ) }
						allowedFormats={ [ 'core/bold', 'core/italic' ] }
						tabIndex={ 0 }
					/>
					{ /* Reveal the tooltip while the block is selected so the author can
					     preview the chosen alignment (positioned via the editor-only CSS
					     keyed on data-placement). On the front-end it stays hover/focus
					     triggered. */ }
					<span
						className="cds--tooltip__content"
						role="tooltip"
						data-placement={ align }
						hidden={ ! isSelected && ! defaultOpen }
					>
						{ description }
					</span>
				</span>
			</div>
		</>
	);
}
