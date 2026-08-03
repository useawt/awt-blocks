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
 */

import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

export default function CarbonDefaultToggle( { value, onChange } ) {
	return (
		<ToggleControl
			label={ __( 'Carbon default', 'awt' ) }
			help={ __(
				'AWT draws a border on all four sides of a field, so its shape is easy to see. Turn this on to use Carbon’s own look instead: a shaded fill with one line under the text.',
				'awt'
			) }
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
