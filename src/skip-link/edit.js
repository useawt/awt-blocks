import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

export default function Edit( { attributes, setAttributes, isSelected } ) {
	const { targetId, text } = attributes;
	// Resolve the label the front end would render: per-block text →
	// AWT Settings → Navigation → Skip link text → i18n default.
	const awt = ( typeof window !== 'undefined' && window.awtSettings ) || {};
	const resolvedText =
		text ||
		awt.skipLinkText ||
		awt.skipLinkDefault ||
		__( 'Skip to main content', 'awt-blocks' );

	// Skip links are visually hidden on the live site (off-screen until focus).
	// Keep them hidden in the editor too so they don't crowd the header — but
	// REVEAL the block while it's selected so it stays visible/editable. Edit
	// the label/target via the inspector panel below (select it from List View).
	const visibleStyle = {
		position: 'static',
		clip: 'auto',
		inlineSize: 'auto',
		blockSize: 'auto',
		padding: '0.5rem 1rem',
		background: 'var(--cds-link-primary, #0f62fe)',
		color: '#fff',
		textDecoration: 'underline',
		display: 'inline-block',
	};
	const hiddenStyle = {
		position: 'absolute',
		inlineSize: '1px',
		blockSize: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0 0 0 0)',
		whiteSpace: 'nowrap',
		border: 0,
	};
	const blockProps = useBlockProps( {
		className:
			'cds--skip-to-content' +
			( isSelected ? ' awt-skip-link-preview' : '' ),
		style: isSelected ? visibleStyle : hiddenStyle,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Skip link', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Visible-on-focus label', 'awt-blocks' ) }
						value={ text }
						onChange={ ( value ) =>
							setAttributes( { text: value } )
						}
					/>
					<TextControl
						label={ __( 'Target element ID', 'awt-blocks' ) }
						help={ __(
							'The id of the part of the page to jump to, such as main-content.',
							'awt-blocks'
						) }
						value={ targetId }
						onChange={ ( value ) =>
							setAttributes( { targetId: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<span { ...blockProps }>{ resolvedText }</span>
		</>
	);
}
