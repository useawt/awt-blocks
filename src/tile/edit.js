import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';

const TEMPLATE = [
	[ 'core/heading', { level: 3, content: 'Tile heading' } ],
	[
		'core/paragraph',
		{ content: 'Tile body text. Describe what this tile represents.' },
	],
];

export default function Edit( { attributes, setAttributes } ) {
	const { variant, href, groupName, value, summary, defaultOpen } =
		attributes;

	const classes = [
		'cds--tile',
		variant !== 'default' ? `cds--tile--${ variant }` : null,
		// A grouped selectable tile renders as a <label> for a radio on the
		// server, and Carbon's radio-tile styling hangs off this class. The
		// preview has to carry it or the canvas shows a different tile from the
		// published page — the divergence check-class-parity.js exists for.
		variant === 'selectable' && groupName ? 'cds--tile--radio' : null,
	]
		.filter( Boolean )
		.join( ' ' );
	const blockProps = useBlockProps( { className: classes } );
	const innerProps = useInnerBlocksProps( {}, { template: TEMPLATE } );

	// Inline chevron for expandable preview (matches render.php's SVG).
	const Chevron = () => (
		<span className="cds--tile__chevron" aria-hidden="true">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 16"
				width="16"
				height="16"
				fill="currentColor"
				focusable="false"
			>
				<path d="M8 11L3 6l.7-.7L8 9.6l4.3-4.3.7.7z" />
			</svg>
		</span>
	);

	const inspector = (
		<InspectorControls>
			<PanelBody title={ __( 'Tile', 'awt-blocks' ) }>
				<SelectControl
					label={ __( 'Variant', 'awt-blocks' ) }
					value={ variant }
					options={ [
						{
							value: 'default',
							label: __( 'Default (read-only)', 'awt-blocks' ),
						},
						{
							value: 'clickable',
							label: __(
								'Clickable (renders as link)',
								'awt-blocks'
							),
						},
						{
							value: 'selectable',
							label: __(
								'Selectable (checkbox / radio-tile)',
								'awt-blocks'
							),
						},
						{
							value: 'expandable',
							label: __(
								'Expandable (details / summary)',
								'awt-blocks'
							),
						},
					] }
					onChange={ ( v ) => setAttributes( { variant: v } ) }
				/>
				{ variant === 'clickable' && (
					<TextControl
						label={ __( 'Link URL', 'awt-blocks' ) }
						help={ __(
							'The address this tile links to.',
							'awt-blocks'
						) }
						value={ href }
						onChange={ ( v ) => setAttributes( { href: v } ) }
						type="url"
					/>
				) }
				{ variant === 'selectable' && (
					<>
						<TextControl
							label={ __( 'Group name', 'awt-blocks' ) }
							help={ __(
								'Give every tile in one choice the same group name, and people can pick only one of them. Leave it empty for a tile that switches on and off by itself. Put the tiles in a Tile group block so the choice also has a heading.',
								'awt-blocks'
							) }
							value={ groupName }
							onChange={ ( v ) =>
								setAttributes( { groupName: v } )
							}
						/>
						{ groupName && (
							<TextControl
								label={ __( 'Value', 'awt-blocks' ) }
								help={ __(
									'What this tile sends when the form is submitted, such as "large". Only needed if the tiles are inside a form.',
									'awt-blocks'
								) }
								value={ value }
								onChange={ ( v ) =>
									setAttributes( { value: v } )
								}
							/>
						) }
					</>
				) }
				{ variant === 'expandable' && (
					<>
						<TextControl
							label={ __(
								'Summary (visible header)',
								'awt-blocks'
							) }
							value={ summary }
							onChange={ ( v ) =>
								setAttributes( { summary: v } )
							}
						/>
						<ToggleControl
							label={ __( 'Open by default', 'awt-blocks' ) }
							checked={ defaultOpen }
							onChange={ ( v ) =>
								setAttributes( { defaultOpen: v } )
							}
						/>
					</>
				) }
			</PanelBody>
		</InspectorControls>
	);

	// Mirror render.php's structure for each variant so the editor preview
	// matches the published page.
	if ( variant === 'expandable' ) {
		return (
			<>
				{ inspector }
				<details { ...blockProps } open={ defaultOpen }>
					<summary className="cds--tile__summary">
						<span className="cds--tile__summary-row">
							<span className="cds--tile__summary-text">
								{ summary }
							</span>
							<Chevron />
						</span>
					</summary>
					<div className="cds--tile__content">
						<div { ...innerProps } />
					</div>
				</details>
			</>
		);
	}

	// A selectable tile previews with the checkmark the server renders, so the
	// canvas shows the control the visitor will meet. `aria-hidden` matches the
	// server: the checkmark is decoration, and the state is already carried by
	// the radio or by aria-checked.
	const Checkmark = ( { persistent } ) => (
		<span
			className={ `cds--tile__checkmark${
				persistent ? ' cds--tile__checkmark--persistent' : ''
			}` }
			aria-hidden="true"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 16"
				width="16"
				height="16"
				fill="currentColor"
				focusable="false"
			>
				<path d="M8,1C4.1,1,1,4.1,1,8c0,3.9,3.1,7,7,7s7-3.1,7-7C15,4.1,11.9,1,8,1z M7,11L4.3,8.3l0.9-0.8L7,9.3l4-3.9l0.9,0.8L7,11z" />
			</svg>
		</span>
	);

	if ( variant === 'selectable' ) {
		// Grouped tiles are a real radio + <label> on the server, so the preview
		// is a <label> too. Ungrouped ones stay role="checkbox", which is what
		// the server renders and what Carbon itself uses for that case.
		if ( groupName ) {
			// A plain <div> carrying the radio classes, not a <label> and not
			// role="radio". The server pairs a real radio input with a label; the
			// canvas has neither the input nor a group around it, so a <label>
			// would label nothing and a lone role="radio" would announce a radio
			// button that belongs to no group — the exact defect being fixed,
			// reintroduced in the author's canvas. The classes are what the
			// parity check compares, and they match.
			return (
				<>
					{ inspector }
					<div { ...blockProps }>
						<Checkmark />
						<span className="cds--tile-content">
							<span { ...innerProps } />
						</span>
					</div>
				</>
			);
		}
		return (
			<>
				{ inspector }
				<div
					{ ...blockProps }
					role="checkbox"
					aria-checked="false"
					tabIndex={ 0 }
				>
					<Checkmark persistent />
					<span className="cds--tile-content">
						<span { ...innerProps } />
					</span>
				</div>
			</>
		);
	}

	return (
		<>
			{ inspector }
			<div { ...blockProps }>
				<div { ...innerProps } />
			</div>
		</>
	);
}
