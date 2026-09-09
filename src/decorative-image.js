/**
 * "Mark as decorative", wherever an image asks for alt text.
 *
 * WordPress tells an author to leave alt text empty when an image is
 * decorative, and an empty alt is indeed the right markup for one. But an
 * empty alt and a forgotten alt look identical in the block's attributes, so
 * a checker cannot tell a deliberate choice from an oversight without the
 * author saying which it is.
 *
 * Core says it for the Image block: a "Mark as decorative" checkbox that sets
 * `isDecorative`. Our accessibility check was reading a different attribute
 * that nothing has ever set, so ticking core's checkbox left the error
 * standing and the fix it suggested — "mark it as decorative" — could not be
 * carried out (found on a live site, 2026-09-09). The check now reads core's
 * attribute; see linter/checks.js.
 *
 * Cover and Media & Text ask for alt text the same way and core gives them no
 * such checkbox, so this adds one, deliberately identical to core's in name,
 * wording and attribute — an author meets one idea, not three.
 *
 * The two sentences above the field are rewritten to match: the link carries
 * the name of the thing it opens, and the line about leaving alt empty now
 * says what else to do. Rewritten through the i18n filter, keyed on the
 * untranslated source, so a translated editor gets our replacement rather
 * than an English string that happened not to match.
 */

import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { CheckboxControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

// Blocks that ask for alt text but ship no way to say the emptiness is meant.
// Image is absent on purpose: core covers it, and a second checkbox beside
// core's would be two answers to one question. The value is the block's own
// alt attribute, cleared when the box is ticked.
const NEEDS_CONTROL = {
	'core/cover': 'alt',
	'core/media-text': 'mediaAlt',
};

/**
 * Give those blocks the attribute core's Image block already has.
 *
 * Same name as core's, so the checks and anything else reading it need not
 * care which block they are looking at. It has no `source`, so it lives in
 * the block comment and the saved HTML is unchanged — the block still
 * validates with the plugin switched off.
 *
 * @param {Object} settings Block settings.
 * @param {string} name     Block name.
 * @return {Object} Settings, with the attribute added where it belongs.
 */
function addAttribute( settings, name ) {
	if ( ! NEEDS_CONTROL[ name ] ) {
		return settings;
	}
	return {
		...settings,
		attributes: {
			...settings.attributes,
			isDecorative: { type: 'boolean', default: false },
		},
	};
}

addFilter( 'blocks.registerBlockType', 'awt/decorative-image', addAttribute );

const withDecorativeControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { name, attributes, setAttributes, isSelected } = props;
		const altKey = NEEDS_CONTROL[ name ];
		if ( ! altKey || ! isSelected ) {
			return <BlockEdit { ...props } />;
		}
		return (
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorControls group="settings">
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( 'Mark as decorative', 'awt-blocks' ) }
						help={ __(
							'Hidden from assistive technologies.',
							'awt-blocks'
						) }
						checked={ !! attributes.isDecorative }
						onChange={ ( value ) =>
							// Alt text and this are two answers to one
							// question, so choosing this clears the other.
							setAttributes(
								value
									? { isDecorative: true, [ altKey ]: '' }
									: { isDecorative: false }
							)
						}
					/>
				</InspectorControls>
			</Fragment>
		);
	};
}, 'withDecorativeControl' );

addFilter( 'editor.BlockEdit', 'awt/decorative-image', withDecorativeControl );

// Keyed on the untranslated source string, which the filter is handed next to
// the translation. Both sentences appear in more than one block, and in the
// Image block's toolbar popover as well as its sidebar, so neither replacement
// points at a place on the screen.
const REWRITTEN = {
	'Describe the purpose of the image.': () =>
		__( 'An alt Decision Tree', 'awt-blocks' ),
	'Leave empty if decorative.': () =>
		__( 'Leave it empty and tick “Mark as decorative”.', 'awt-blocks' ),
};

addFilter(
	'i18n.gettext_default',
	'awt/decorative-image',
	( translation, text ) =>
		REWRITTEN[ text ] ? REWRITTEN[ text ]() : translation
);
