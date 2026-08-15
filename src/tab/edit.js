import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';

export default function Edit( { attributes, setAttributes } ) {
	const { label, disabled } = attributes;
	// Mirror render.php's `<li><button class="cds--tabs__nav-link"><span
	// class="cds--tabs__nav-item-label">…</span></button></li>`. The Carbon
	// CSS for `.cds--tabs__nav-link` provides padding, line-height, hover,
	// focus, and the active-state underline — no inline styles needed. The
	// previous edit.js used a bare <span> inline-styled with a border, which
	// didn't look like Carbon tabs at all.
	const classes =
		'cds--tabs__nav-item' +
		( disabled ? ' cds--tabs__nav-item--disabled' : '' );
	const blockProps = useBlockProps( { className: classes } );
	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Tab', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<ToggleControl
						label={ __( 'Disabled', 'awt-blocks' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps } role="presentation">
				<button
					className="cds--tabs__nav-link"
					type="button"
					role="tab"
					aria-selected="false"
					tabIndex={ -1 }
					disabled={ disabled }
					onClick={ ( e ) => e.preventDefault() }
				>
					<RichText
						tagName="span"
						className="cds--tabs__nav-item-label"
						value={ label }
						onChange={ ( v ) => setAttributes( { label: v } ) }
						placeholder={ __( 'Tab label', 'awt-blocks' ) }
						allowedFormats={ [] }
					/>
				</button>
			</li>
		</>
	);
}
