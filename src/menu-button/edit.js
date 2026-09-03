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
	ToggleControl,
	Button as WPButton,
} from '@wordpress/components';

const KIND_OPTIONS = [
	{ label: 'Primary', value: 'primary' },
	{ label: 'Secondary', value: 'secondary' },
	{ label: 'Tertiary', value: 'tertiary' },
	{ label: 'Ghost', value: 'ghost' },
];

const SIZE_OPTIONS = [
	{ label: 'Small (sm)', value: 'sm' },
	{ label: 'Medium (md)', value: 'md' },
	{ label: 'Large (lg)', value: 'lg' },
];

const ALIGN_OPTIONS = [
	{ label: 'Bottom', value: 'bottom' },
	{ label: 'Bottom start', value: 'bottom-start' },
	{ label: 'Bottom end', value: 'bottom-end' },
	{ label: 'Top', value: 'top' },
	{ label: 'Top start', value: 'top-start' },
	{ label: 'Top end', value: 'top-end' },
];

export default function Edit( { attributes, setAttributes } ) {
	const { label, kind, size, menuAlignment, disabled, items } = attributes;

	const triggerClasses = [
		'cds--menu-button__trigger',
		'cds--btn',
		`cds--btn--${ kind }`,
		`cds--btn--${ size }`,
	].join( ' ' );

	const setItem = ( idx, patch ) => {
		const next = items.map( ( it, i ) =>
			i === idx ? { ...it, ...patch } : it
		);
		setAttributes( { items: next } );
	};
	const addItem = () =>
		setAttributes( {
			items: [ ...items, { label: 'New item', value: '', link: '' } ],
		} );
	const removeItem = ( idx ) =>
		setAttributes( { items: items.filter( ( _, i ) => i !== idx ) } );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Menu button', 'awt-blocks' ) }>
					<SelectControl
						label={ __( 'Kind', 'awt-blocks' ) }
						value={ kind }
						options={ KIND_OPTIONS }
						onChange={ ( v ) => setAttributes( { kind: v } ) }
					/>
					<SelectControl
						label={ __( 'Size', 'awt-blocks' ) }
						value={ size }
						options={ SIZE_OPTIONS }
						onChange={ ( v ) => setAttributes( { size: v } ) }
					/>
					<SelectControl
						label={ __( 'Menu alignment', 'awt-blocks' ) }
						value={ menuAlignment }
						options={ ALIGN_OPTIONS }
						onChange={ ( v ) =>
							setAttributes( { menuAlignment: v } )
						}
					/>
					<ToggleControl
						label={ __( 'Disabled', 'awt-blocks' ) }
						checked={ disabled }
						onChange={ ( v ) => setAttributes( { disabled: v } ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Items', 'awt-blocks' ) }>
					{ items.map( ( item, idx ) => (
						<div
							key={ idx }
							style={ {
								borderTop: idx ? '1px solid #ddd' : 'none',
								paddingTop: 12,
								marginTop: 12,
							} }
						>
							<TextControl
								label={ __( 'Label', 'awt-blocks' ) }
								value={ item.label }
								onChange={ ( v ) =>
									setItem( idx, { label: v } )
								}
							/>
							<TextControl
								label={ __( 'Link (optional)', 'awt-blocks' ) }
								help={ __(
									'Where this item takes visitors. Leave it empty if the item runs an action instead, then fill in Value.',
									'awt-blocks'
								) }
								value={ item.link || '' }
								onChange={ ( v ) =>
									setItem( idx, { link: v } )
								}
							/>
							<TextControl
								label={ __( 'Value', 'awt-blocks' ) }
								value={ item.value }
								onChange={ ( v ) =>
									setItem( idx, { value: v } )
								}
							/>
							<ToggleControl
								label={ __( 'Disabled', 'awt-blocks' ) }
								checked={ !! item.disabled }
								onChange={ ( v ) =>
									setItem( idx, { disabled: v } )
								}
							/>
							<WPButton
								isDestructive
								isSmall
								onClick={ () => removeItem( idx ) }
							>
								{ __( 'Remove', 'awt-blocks' ) }
							</WPButton>
						</div>
					) ) }
					<WPButton
						variant="secondary"
						onClick={ addItem }
						style={ { marginTop: 12 } }
					>
						{ __( 'Add item', 'awt-blocks' ) }
					</WPButton>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps( { className: 'awt-block-wrap' } ) }>
				<div className="cds--menu-button">
					<button
						type="button"
						className={ triggerClasses }
						disabled={ disabled }
						aria-haspopup="menu"
						aria-expanded="false"
					>
						<RichText
							tagName="span"
							value={ label }
							onChange={ ( v ) => setAttributes( { label: v } ) }
							placeholder={ __( 'Menu label', 'awt-blocks' ) }
							allowedFormats={ [] }
						/>
						{ /* Use `cds--btn__icon` class (matches render.php's `icon( 'chevron-down', 16, 'cds--btn__icon' )`)
					     so the chevron picks up Carbon's margin-inline-start: 0.5rem and the
					     180-deg rotate-on-open transition rule. No inline marginLeft. */ }
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							width="16"
							height="16"
							fill="currentColor"
							aria-hidden="true"
							focusable="false"
							className="cds--btn__icon"
						>
							<path d="M8 11L3 6l.7-.7L8 9.6l4.3-4.3.7.7z" />
						</svg>
					</button>
					<ul
						className={ `cds--menu cds--menu--${ menuAlignment }` }
						role="menu"
						aria-label={ label }
						hidden
					>
						{ items.map( ( item, idx ) => (
							<li
								key={ idx }
								className="cds--menu-item"
								role="menuitem"
								aria-disabled={ item.disabled || undefined }
							>
								<button
									type="button"
									className="cds--menu-item__button"
									data-value={ item.value }
								>
									{ item.label }
								</button>
							</li>
						) ) }
					</ul>
				</div>
			</div>
		</>
	);
}
