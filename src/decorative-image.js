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
 * Core's checkbox only arrived in WordPress 7.1. Before that (AWT supports
 * 6.6 and up) the Image block has no `isDecorative` at all, so it gets ours
 * too, and the check's advice can be followed there (awt-workspace #25).
 *
 * An Image marked on those versions is saved without the `role="none"` that
 * 7.1 writes for a decorative image. 7.1 then reads it as an older Image
 * block, through core's deprecations, and those know nothing of
 * `isDecorative`: the mark was dropped on the way and the error came back.
 * Image's deprecations now get the attribute too, as Cover's and Media &
 * Text's already did, so the mark survives core changing how a block saves.
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

// Blocks that ask for alt text. The value is the block's own alt attribute,
// cleared when the box is ticked.
const ALT_KEY = {
	'core/image': 'alt',
	'core/cover': 'alt',
	'core/media-text': 'mediaAlt',
};

// Same name and shape as core's, so the checks and anything else reading it
// need not care which block they are looking at. It has no `source`, so it
// lives in the block comment and the saved HTML is unchanged: the block
// still validates with the plugin switched off.
const IS_DECORATIVE = { type: 'boolean', default: false };

// The blocks that get the checkbox from us: those whose core version has no
// `isDecorative`. Image leaves it from WordPress 7.1, where core has its
// own, and a second checkbox beside core's would be two answers to one
// question.
const withOurControl = new Set();

/**
 * Give those blocks the attribute.
 *
 * WordPress runs this filter again for each of a block's deprecations, with
 * the deprecation as the third argument, so they get the attribute too.
 *
 * @param {Object}  settings    Block settings.
 * @param {string}  name        Block name.
 * @param {?Object} deprecation The deprecation being filtered, if any.
 * @return {Object} Settings, with the attribute added where it belongs.
 */
function addAttribute( settings, name, deprecation ) {
	if ( ! ALT_KEY[ name ] ) {
		return settings;
	}
	if ( ! deprecation && ! settings.attributes?.isDecorative ) {
		withOurControl.add( name );
	}
	return {
		...settings,
		attributes: {
			isDecorative: IS_DECORATIVE,
			...settings.attributes,
		},
	};
}

addFilter( 'blocks.registerBlockType', 'awt/decorative-image', addAttribute );

const withDecorativeControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { name, attributes, setAttributes, isSelected } = props;
		const altKey = withOurControl.has( name ) && ALT_KEY[ name ];
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
		__( 'Alt text decision tree', 'awt-blocks' ),
	'Leave empty if decorative.': () =>
		__( 'Leave it empty and tick “Mark as decorative”.', 'awt-blocks' ),
};

addFilter(
	'i18n.gettext_default',
	'awt/decorative-image',
	( translation, text ) =>
		REWRITTEN[ text ] ? REWRITTEN[ text ]() : translation
);
