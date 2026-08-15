import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';

const KINDS = [ 'info', 'success', 'warning', 'error' ];

// Carbon filled-icon SVG paths for the four notification kinds. These match
// the icon names render.php passes to the server-side icon() helper so editor
// and front-end show the same glyphs.
const KIND_ICONS = {
	info: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			width="20"
			height="20"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
		>
			<path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,6a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,16,8Zm4,16.125H12v-2.25h2.875v-6.75H13v-2.25h4.125v9H20Z" />
		</svg>
	),
	success: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			width="20"
			height="20"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
		>
			<path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2ZM14,21.5908l-5-5L10.5906,15,14,18.4092,21.41,11l1.5957,1.5859Z" />
		</svg>
	),
	warning: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			width="20"
			height="20"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
		>
			<path d="M16,2C8.3,2,2,8.3,2,16s6.3,14,14,14s14-6.3,14-14C30,8.3,23.7,2,16,2z M14.9,8h2.2v11h-2.2V8z M16,25	c-0.8,0-1.5-0.7-1.5-1.5S15.2,22,16,22c0.8,0,1.5,0.7,1.5,1.5S16.8,25,16,25z" />
		</svg>
	),
	error: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			width="20"
			height="20"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
		>
			<path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm5.4,19L11,10.6,12.6,9,23,19.4Z" />
		</svg>
	),
};

export default function Edit( { attributes, setAttributes } ) {
	const {
		kind,
		title,
		subtitle,
		caption,
		lowContrast,
		hideCloseButton,
		variant,
	} = attributes;
	// Let theme.css drive the appearance — same classes as the front-end so
	// authoring matches published rendering. The editor iframe enqueues
	// theme.css via enqueue_block_assets, so all `.cds--inline-notification--*`
	// rules (dark-bg + colored left border or low-contrast tinted bg) apply.
	const base =
		variant === 'toast'
			? 'cds--toast-notification'
			: 'cds--inline-notification';
	const blockProps = useBlockProps( {
		className: [
			base,
			`${ base }--${ kind }`,
			lowContrast ? `${ base }--low-contrast` : null,
		]
			.filter( Boolean )
			.join( ' ' ),
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Notification', 'awt-blocks' ) }>
					<SelectControl
						label={ __( 'Kind', 'awt-blocks' ) }
						value={ kind }
						options={ KINDS.map( ( k ) => ( {
							value: k,
							label: k,
						} ) ) }
						onChange={ ( v ) => setAttributes( { kind: v } ) }
					/>
					<SelectControl
						label={ __( 'Variant', 'awt-blocks' ) }
						value={ variant }
						options={ [
							{
								value: 'inline',
								label: __( 'Inline', 'awt-blocks' ),
							},
							{
								value: 'toast',
								label: __( 'Toast', 'awt-blocks' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { variant: v } ) }
					/>
					<ToggleControl
						label={ __( 'Low contrast', 'awt-blocks' ) }
						checked={ lowContrast }
						onChange={ ( v ) =>
							setAttributes( { lowContrast: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Hide close button', 'awt-blocks' ) }
						checked={ hideCloseButton }
						onChange={ ( v ) =>
							setAttributes( { hideCloseButton: v } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div
				{ ...blockProps }
				role={ kind === 'error' ? 'alert' : 'status' }
				aria-live={ kind === 'error' ? 'assertive' : 'polite' }
			>
				<div className={ `${ base }__details` }>
					<div className={ `${ base }__icon` } aria-hidden="true">
						{ KIND_ICONS[ kind ] || KIND_ICONS.info }
					</div>
					<div className={ `${ base }__text-wrapper` }>
						<p
							className={ `${ base }__title` }
							style={ { margin: 0 } }
						>
							<RichText
								tagName="span"
								value={ title }
								onChange={ ( v ) =>
									setAttributes( { title: v } )
								}
								placeholder={ __(
									'Notification title',
									'awt-blocks'
								) }
								allowedFormats={ [] }
							/>{ ' ' }
							<RichText
								tagName="span"
								className={ `${ base }__subtitle` }
								value={ subtitle }
								onChange={ ( v ) =>
									setAttributes( { subtitle: v } )
								}
								placeholder={ __(
									'Subtitle (optional)',
									'awt-blocks'
								) }
							/>
						</p>
						{ variant === 'toast' && (
							<RichText
								tagName="div"
								className={ `${ base }__caption` }
								value={ caption }
								onChange={ ( v ) =>
									setAttributes( { caption: v } )
								}
								placeholder={ __(
									'Caption (toast only)',
									'awt-blocks'
								) }
							/>
						) }
					</div>
				</div>
				{ ! hideCloseButton && (
					<button
						type="button"
						className={ `${ base }__close-button` }
						aria-label={ __( 'Close notification', 'awt-blocks' ) }
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 32 32"
							width="20"
							height="20"
							fill="currentColor"
							aria-hidden="true"
							focusable="false"
						>
							<path d="M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4l6.6 6.6L8 22.6 9.4 24l6.6-6.6 6.6 6.6 1.4-1.4-6.6-6.6L24 9.4z" />
						</svg>
					</button>
				) }
			</div>
		</>
	);
}
