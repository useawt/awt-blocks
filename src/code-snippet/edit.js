import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { iconPreviewUrl } from '../shared/icon-picker';

// Carbon's `copy` icon — mirrors render.php's `icon( 'copy', 16 )` call.
const CopyIcon = () => (
	<span
		aria-hidden="true"
		style={ {
			display: 'inline-block',
			width: '1rem',
			height: '1rem',
			background: 'currentColor',
			WebkitMaskImage: `url(${ iconPreviewUrl( 'copy', [ 32 ] ) })`,
			maskImage: `url(${ iconPreviewUrl( 'copy', [ 32 ] ) })`,
			WebkitMaskRepeat: 'no-repeat',
			maskRepeat: 'no-repeat',
			WebkitMaskPosition: 'center',
			maskPosition: 'center',
			WebkitMaskSize: 'contain',
			maskSize: 'contain',
		} }
	/>
);

const VARIANTS = [
	{ label: 'Inline', value: 'inline' },
	{ label: 'Single-line', value: 'single' },
	{ label: 'Multi-line', value: 'multi' },
];

export default function Edit( { attributes, setAttributes } ) {
	const { variant, code, language, copyLabel, copiedLabel, hideCopyBtn } =
		attributes;
	// Carbon's `.cds--snippet` + `--inline/--single/--multi` rules in
	// carbon.min.css handle font, padding, background, layout. Drop the
	// inline styles.
	const blockProps = useBlockProps( {
		className: `cds--snippet cds--snippet--${ variant }`,
	} );

	// Mirror render.php: inline variant uses <span> wrapper, single/multi
	// use <div><pre><code> + a copy button (when not hideCopyBtn).
	const showCopy = ! hideCopyBtn;
	const copyBtn = showCopy && (
		<button
			type="button"
			className={
				variant === 'inline'
					? 'cds--snippet-button cds--copy-btn cds--snippet-button--inline'
					: 'cds--snippet-button cds--copy-btn'
			}
			aria-label={ copyLabel }
			onClick={ ( e ) => e.preventDefault() }
		>
			<CopyIcon />
		</button>
	);
	const preview =
		variant === 'inline' ? (
			<>
				<code>{ code }</code>
				{ copyBtn }
			</>
		) : (
			<>
				<div className="cds--snippet-container" tabIndex={ 0 }>
					<pre>
						<code>{ code }</code>
					</pre>
				</div>
				{ copyBtn }
			</>
		);

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Code snippet', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Variant', 'awt-blocks' ) }
						value={ variant }
						options={ VARIANTS }
						onChange={ ( v ) => setAttributes( { variant: v } ) }
					/>
					<TextControl
						label={ __( 'Language', 'awt-blocks' ) }
						value={ language }
						onChange={ ( v ) => setAttributes( { language: v } ) }
						help={ __(
							'A short code such as “js” or “php”. It labels the snippet for screen readers and other tools. It does not color the code.',
							'awt-blocks'
						) }
					/>
					<TextareaControl
						label={ __( 'Code', 'awt-blocks' ) }
						value={ code }
						onChange={ ( v ) => setAttributes( { code: v } ) }
						rows={ 8 }
					/>
					<ToggleControl
						label={ __( 'Hide copy button', 'awt-blocks' ) }
						checked={ hideCopyBtn }
						onChange={ ( v ) =>
							setAttributes( { hideCopyBtn: v } )
						}
					/>
					<TextControl
						label={ __( 'Copy button label', 'awt-blocks' ) }
						value={ copyLabel }
						onChange={ ( v ) => setAttributes( { copyLabel: v } ) }
					/>
					<TextControl
						label={ __( 'Copied-state label', 'awt-blocks' ) }
						value={ copiedLabel }
						onChange={ ( v ) =>
							setAttributes( { copiedLabel: v } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>{ preview }</div>
		</>
	);
}
