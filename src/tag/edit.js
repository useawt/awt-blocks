import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	TextControl,
} from '@wordpress/components';

const TYPES = [
	'red',
	'magenta',
	'purple',
	'blue',
	'cyan',
	'teal',
	'green',
	'gray',
	'cool-gray',
	'warm-gray',
	'outline',
	'high-contrast',
];

const TARGET_OPTIONS = [
	{ label: 'Same window', value: '' },
	{ label: 'New tab/window', value: '_blank' },
];

export default function Edit( { attributes, setAttributes } ) {
	const { text, type, size, filter, href, target, rel } = attributes;
	const isLink = !! href;
	// A linked tag renders as an <a>; a dismissible (filter) tag has a close
	// <button>. The two are mutually exclusive — a link wins.
	const showClose = filter && ! isLink;
	const Wrapper = isLink ? 'a' : 'span';
	const blockProps = useBlockProps( {
		className: `cds--tag cds--tag--${ type } cds--tag--${ size }${
			showClose ? ' cds--tag--filter' : ''
		}${ isLink ? ' awt-tag--link' : '' }`,
		// Real href would navigate away in the editor — prevent it so the block
		// stays selectable/editable. render.php emits a working link.
		...( isLink ? { href, onClick: ( e ) => e.preventDefault() } : {} ),
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Tag', 'awt-blocks' ) }>
					<SelectControl
						label={ __( 'Color', 'awt-blocks' ) }
						value={ type }
						options={ TYPES.map( ( t ) => ( {
							value: t,
							label: t,
						} ) ) }
						onChange={ ( v ) => setAttributes( { type: v } ) }
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ [
							{ value: 'sm', label: 'sm' },
							{ value: 'md', label: 'md' },
							{ value: 'lg', label: 'lg' },
						] }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<ToggleControl
						label={ __( 'Filter (dismissible)', 'awt-blocks' ) }
						help={
							isLink
								? __(
										'Not available while a link URL is set. A linked tag can’t be dismissible.',
										'awt-blocks'
								  )
								: undefined
						}
						checked={ filter }
						disabled={ isLink }
						onChange={ ( v ) => setAttributes( { filter: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Link', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<TextControl
						label={ __(
							'URL (makes the tag a link)',
							'awt-blocks'
						) }
						value={ href }
						onChange={ ( v ) => setAttributes( { href: v } ) }
						type="url"
					/>
					<SelectControl
						label={ __( 'Target', 'awt-blocks' ) }
						value={ target }
						options={ TARGET_OPTIONS }
						onChange={ ( v ) => setAttributes( { target: v } ) }
						disabled={ ! href }
					/>
					<TextControl
						label={ __( 'Link relationship', 'awt-blocks' ) }
						value={ rel }
						onChange={ ( v ) => setAttributes( { rel: v } ) }
						help={ __(
							'Sets the link’s rel attribute. Links that open in a new tab already get “noopener noreferrer”. Fill this in only if you need something different.',
							'awt-blocks'
						) }
						disabled={ ! href }
					/>
				</PanelBody>
			</InspectorControls>
			<Wrapper { ...blockProps }>
				<RichText
					tagName="span"
					className="cds--tag__label"
					value={ text }
					onChange={ ( v ) => setAttributes( { text: v } ) }
					allowedFormats={ [] }
				/>
				{ showClose && (
					<button
						type="button"
						className="cds--tag__close-icon"
						aria-label={ __( 'Dismiss', 'awt-blocks' ) }
						tabIndex={ -1 }
						onClick={ ( e ) => e.preventDefault() }
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 32 32"
							width="16"
							height="16"
							fill="currentColor"
							aria-hidden="true"
							focusable="false"
						>
							<path d="M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16z" />
						</svg>
					</button>
				) }
			</Wrapper>
		</>
	);
}
