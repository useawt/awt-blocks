/**
 * CarbonDefaultToggle — the one control that switches a form field back to
 * Carbon's own look (a fill plus a single line under the text) instead of AWT's
 * default, which draws the field's border on all four sides.
 *
 * Every field block shows this identically, so the label and the help text live
 * here rather than being retyped five times. The matching server-side class is
 * `field_frame_class()` in `shared/render-helpers.php`; the borders themselves
 * are in the theme's `theme.css`. See "Differences from Carbon" (D5) in the
 * Stage 1 spec for why AWT's default differs.
 *
 * Props:
 *   - value:    current `carbonDefault` attribute value.
 *   - onChange: receives the new boolean.
 *   - help:     optional help text. Defaults to the field wording below.
 *               awt/tile passes its own, because a tile is not a field and the
 *               default sentence would describe something the author cannot see.
 *               Same control, same label, same place in the inspector.
 */

import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

export default function CarbonDefaultToggle( { value, onChange, help } ) {
	return (
		<ToggleControl
			label={ __( 'Carbon default', 'awt-blocks' ) }
			help={
				help ||
				__(
					'AWT draws a border on all four sides of a field, so its shape is easy to see. Turn this on to use Carbon’s own look instead: a shaded fill with one line under the text.',
					'awt-blocks'
				)
			}
			checked={ !! value }
			onChange={ onChange }
		/>
	);
}

/**
 * The editor-preview class list for a field block's outer wrapper.
 *
 * Mirrors `field_frame_class()` on the server so the canvas shows what the
 * published page will render. Returns null (not '') so it drops out of the
 * `.filter( Boolean )` chains the blocks already use to build class strings.
 *
 * @param {boolean} carbonDefault The block's `carbonDefault` attribute.
 * @return {?string} The frame class, or null when Carbon's own look is wanted.
 */
export function fieldFrameClass( carbonDefault ) {
	return carbonDefault ? null : 'awt-field--framed';
}

/**
 * The editor-preview class for an interactive tile's wrapper.
 *
 * Mirrors `tile_frame_class()` on the server. Returns null (not '') so it drops
 * out of the `.filter( Boolean )` chain the tile already uses.
 *
 * @param {Object}  attributes               Block attributes.
 * @param {boolean} attributes.carbonDefault Opt back into Carbon's own look.
 * @param {string}  variant                  Tile variant.
 * @return {string|null} The class, or null.
 */
export function tileFrameClass( { carbonDefault }, variant ) {
	if ( variant !== 'selectable' && variant !== 'clickable' ) {
		return null;
	}
	return carbonDefault ? null : 'awt-tile--framed';
}
