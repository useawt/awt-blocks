/**
 * §4 Part 2 — per-block Accessibility panel.
 *
 * Adds an "Accessibility" inspector panel to every awt/* block with: the
 * block's computed accessible name (read-only, with a plain-language caption),
 * aria-label, aria-describedby + aria-labelledby (typed element IDs), a role
 * override restricted to roles valid for the block's element, and an element
 * lang (BCP-47) selector. Stored as ariaLabel / ariaDescribedby / ariaLabelledby
 * / awtRole / awtLang (registered + emitted server-side in global-controls.php).
 *
 * It also adds a Language-only control to core text blocks (paragraph, heading,
 * list item) so authors can mark a passage's language there too.
 */

import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment, useState } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	SelectControl,
	ComboboxControl,
} from '@wordpress/components';
import { LANGUAGE_OPTIONS } from './shared/language-tags';

const PREFIX = 'awt/';

// Core text blocks that get a Language control (but not the full a11y panel).
const LANG_CORE_BLOCKS = [ 'core/paragraph', 'core/heading', 'core/list-item' ];

// Role overrides restricted to roles valid for each block's rendered element.
// `roles()` always leads with "— none —". Blocks not listed fall back to a safe
// generic-container set. This is a curated subset (not the full WAI-ARIA matrix)
// chosen to avoid roles that would break a block's built-in semantics.
const roles = ( ...vals ) => [
	{ value: '', label: __( 'None', 'awt-blocks' ) },
	...vals.map( ( v ) => ( { value: v, label: v } ) ),
];
const ROLE_GENERIC = roles(
	'group',
	'region',
	'note',
	'complementary',
	'presentation'
);
const ROLE_BUCKETS = {
	container: ROLE_GENERIC,
	region: roles( 'region', 'group', 'complementary', 'note', 'presentation' ),
	list: roles( 'list', 'group', 'presentation' ),
	nav: roles( 'navigation', 'presentation' ),
	button: roles( 'link' ), // a <button> may legitimately announce as a link if it navigates
	link: roles( 'button' ), // an <a> may announce as a button if it triggers an action
	status: roles( 'status', 'alert', 'note' ),
};
const BLOCK_ROLE_BUCKET = {
	'awt/list': 'list',
	'awt/breadcrumb': 'nav',
	'awt/header-nav': 'nav',
	'awt/side-nav': 'nav',
	'awt/button': 'button',
	'awt/link': 'link',
	'awt/notification': 'status',
	'awt/section': 'region',
	'awt/hero': 'region',
	'awt/feature-grid': 'region',
	'awt/stat': 'region',
	'awt/testimonial': 'region',
	'awt/tile': 'region',
	'awt/inline-set': 'region',
};
function rolesFor( name ) {
	const bucket = BLOCK_ROLE_BUCKET[ name ];
	return bucket ? ROLE_BUCKETS[ bucket ] : ROLE_GENERIC;
}

// Help for a leftover name on a block that writes none (see nameNote()).
const UNUSED_HELP = __(
	'This block does not use this name. Clear it to remove it.',
	'awt-blocks'
);
const LANG_HELP = __(
	'Search and pick the content’s language so screen readers pronounce it correctly. Leave blank to inherit the page language.',
	'awt-blocks'
);
const LANG_PLACEHOLDER = __( 'Search languages…', 'awt-blocks' );

// Simplified per-block-type accessible-name computation (spec §4 precedence).
// The name is the one the panel's own fields replace: a field's, a button's or
// a link's, so each case reads the attribute that names that element.
// Text as a screen reader gets it: tags dropped, entities (`&amp;`) decoded.
const plain = ( s ) => {
	const box = document.createElement( 'textarea' );
	box.innerHTML = ( s || '' ).replace( /<[^>]*>/g, '' );
	return box.value.trim();
};
function computeAccessibleName( name, attrs ) {
	if ( name === 'awt/icon' && attrs.decorative ) {
		return '';
	}
	const aria = ( attrs.ariaLabel || '' ).trim();
	if ( aria ) {
		return aria;
	}
	switch ( name ) {
		case 'awt/button':
		case 'awt/link':
		case 'awt/header-nav-item':
		case 'awt/side-nav-link':
		case 'awt/breadcrumb-item':
		case 'awt/modal-opener':
		case 'awt/footer-link':
		case 'awt/tag':
		case 'awt/header-menu':
			return plain( attrs.text );
		case 'awt/header-action':
		case 'awt/text-input':
		case 'awt/password-input':
		case 'awt/text-area':
		case 'awt/select':
		case 'awt/dropdown':
		case 'awt/checkbox':
		case 'awt/radio-button':
		case 'awt/toggle':
		case 'awt/menu-button':
		case 'awt/tab':
		case 'awt/content-switcher-item':
		case 'awt/tile-group':
		case 'awt/icon':
			return plain( attrs.label );
		case 'awt/accordion-item':
		case 'awt/side-nav-section':
			return plain( attrs.title );
		case 'awt/faq-item':
			return plain( attrs.question );
		case 'awt/modal':
			return plain( attrs.heading );
		case 'awt/data-table':
			return plain( attrs.caption );
		case 'awt/radio-button-group':
			return plain( attrs.legend );
		case 'awt/tile':
			return attrs.variant === 'expandable' ? plain( attrs.summary ) : '';
		case 'awt/header-brand':
			return [ attrs.siteTitle || '', attrs.prefix || '' ]
				.map( ( s ) => s.trim() )
				.filter( Boolean )
				.join( ' ' );
		default:
			return '';
	}
}

// Blocks with nothing a name could go on, or whose name comes from elsewhere
// by design. The server writes no aria-label or aria-labelledby for them
// (NAME_TARGETS in shared/global-controls.php, `none`), so the panel says why
// instead of offering fields that would do nothing.
function nameNote( name, attrs ) {
	switch ( name ) {
		case 'awt/tab-panel':
			return __(
				'A tab panel takes its name from its tab. To change it, change the tab’s label.',
				'awt-blocks'
			);
		case 'awt/content-switcher-panel':
			return __(
				'A switcher panel takes its name from its switcher segment. To change it, change the segment’s label.',
				'awt-blocks'
			);
		case 'awt/side-nav-divider':
			return __(
				'A divider is decorative, so it has no name.',
				'awt-blocks'
			);
		case 'awt/icon':
			return __(
				'Name the icon in its Icon settings: turn off Decorative and fill in Accessible name.',
				'awt-blocks'
			);
		case 'awt/tag':
			return ! attrs.href && ! attrs.filter
				? __(
						'Screen readers read the tag’s text. To change what they hear, change the text.',
						'awt-blocks'
				  )
				: '';
		default:
			return '';
	}
}

// Register the element-lang attribute on the core text blocks so setAttributes
// persists it and the PHP render_block filter can emit it onto the tag.
addFilter(
	'blocks.registerBlockType',
	'awt/lang-attr-on-core-text',
	( settings, name ) => {
		if ( LANG_CORE_BLOCKS.indexOf( name ) === -1 ) {
			return settings;
		}
		return {
			...settings,
			attributes: {
				...settings.attributes,
				awtLang: { type: 'string', default: '' },
			},
		};
	}
);

const withAccessibilityPanel = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { name, attributes, setAttributes } = props;
		// On a block that writes no name, a leftover value keeps its field so
		// it can be cleared. Decided once, so the field does not vanish (and
		// take keyboard focus with it) as the last character goes.
		const [ keepLabel ] = useState( () => !! attributes.ariaLabel );
		const [ keepLabelledby ] = useState(
			() => !! attributes.ariaLabelledby
		);
		const isAwt = name && name.indexOf( PREFIX ) === 0;
		const isLangCore = LANG_CORE_BLOCKS.indexOf( name ) !== -1;

		if ( ! isAwt && ! isLangCore ) {
			return <BlockEdit { ...props } />;
		}

		// Core text blocks: a Language control only.
		if ( ! isAwt ) {
			const { awtLang = '' } = attributes;
			return (
				<Fragment>
					<BlockEdit { ...props } />
					<InspectorControls>
						<PanelBody
							title={ __( 'Accessibility', 'awt-blocks' ) }
							initialOpen={ false }
						>
							<ComboboxControl
								label={ __( 'Language (lang)', 'awt-blocks' ) }
								value={ awtLang }
								options={ LANGUAGE_OPTIONS }
								onChange={ ( v ) =>
									setAttributes( { awtLang: v || '' } )
								}
								placeholder={ LANG_PLACEHOLDER }
								allowReset
								help={ LANG_HELP }
							/>
						</PanelBody>
					</InspectorControls>
				</Fragment>
			);
		}

		const {
			ariaLabel = '',
			ariaDescribedby = '',
			ariaLabelledby = '',
			awtRole = '',
			awtLang = '',
		} = attributes;
		const computed = computeAccessibleName( name, attributes );
		const labelledByActive = !! ariaLabelledby;
		const note = nameNote( name, attributes );

		let accessibleNameNode;
		if ( labelledByActive ) {
			accessibleNameNode = (
				<em>{ `(${ __(
					'from the aria-labelledby element',
					'awt-blocks'
				) }: #${ ariaLabelledby })` }</em>
			);
		} else if ( computed ) {
			accessibleNameNode = <code>{ computed }</code>;
		} else {
			accessibleNameNode = (
				<em>
					{ __(
						'(none: screen readers may have nothing to read out)',
						'awt-blocks'
					) }
				</em>
			);
		}

		return (
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody
						title={ __( 'Accessibility', 'awt-blocks' ) }
						initialOpen={ false }
					>
						{ note ? (
							<p
								style={ {
									margin: '0 0 12px',
									fontSize: '0.8125rem',
								} }
							>
								{ note }
							</p>
						) : (
							<>
								<p
									style={ {
										margin: '0 0 4px',
										fontSize: '0.8125rem',
									} }
								>
									<strong>
										{ __(
											'Accessible name:',
											'awt-blocks'
										) }
									</strong>
									{ accessibleNameNode }
								</p>
								<p
									style={ {
										margin: '0 0 12px',
										fontSize: '0.75rem',
										color: '#757575',
									} }
								>
									{ __(
										'What screen readers will most likely read out. Only change it below if you have a clear reason.',
										'awt-blocks'
									) }
								</p>
							</>
						) }

						{ ( ! note || keepLabel ) && (
							<TextControl
								label={ __(
									'Accessible name (aria-label)',
									'awt-blocks'
								) }
								value={ ariaLabel }
								onChange={ ( v ) =>
									setAttributes( { ariaLabel: v } )
								}
								help={
									note
										? UNUSED_HELP
										: __(
												'Replaces the name above. Leave blank to keep it.',
												'awt-blocks'
										  )
								}
							/>
						) }
						<TextControl
							label={ __(
								'Described by (aria-describedby)',
								'awt-blocks'
							) }
							value={ ariaDescribedby }
							onChange={ ( v ) =>
								setAttributes( { ariaDescribedby: v } )
							}
							help={ __(
								'Type the ID of another element on the page whose text adds a longer description (without the “#”).',
								'awt-blocks'
							) }
						/>
						{ ( ! note || keepLabelledby ) && (
							<TextControl
								label={ __(
									'Labelled by (aria-labelledby)',
									'awt-blocks'
								) }
								value={ ariaLabelledby }
								onChange={ ( v ) =>
									setAttributes( { ariaLabelledby: v } )
								}
								help={
									note
										? UNUSED_HELP
										: __(
												'Type the ID of another element whose text should be this block’s accessible name (without the “#”).',
												'awt-blocks'
										  )
								}
							/>
						) }
						<SelectControl
							label={ __( 'Role', 'awt-blocks' ) }
							value={ awtRole }
							options={ rolesFor( name ) }
							onChange={ ( v ) =>
								setAttributes( { awtRole: v } )
							}
							help={ __(
								'Only roles that suit this block’s element are listed.',
								'awt-blocks'
							) }
						/>
						<ComboboxControl
							label={ __( 'Language (lang)', 'awt-blocks' ) }
							value={ awtLang }
							options={ LANGUAGE_OPTIONS }
							onChange={ ( v ) =>
								setAttributes( { awtLang: v || '' } )
							}
							placeholder={ LANG_PLACEHOLDER }
							allowReset
							help={ LANG_HELP }
						/>
					</PanelBody>
				</InspectorControls>
			</Fragment>
		);
	};
}, 'withAwtAccessibilityPanel' );

addFilter(
	'editor.BlockEdit',
	'awt/accessibility-panel',
	withAccessibilityPanel
);
