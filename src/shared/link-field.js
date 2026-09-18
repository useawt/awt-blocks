/**
 * LinkField — one way to choose a link, wherever a block takes one.
 *
 * Every linking block used to ask for an address in a plain text box, so the
 * author had to go and find a page's URL and paste it back. This is the page
 * search WordPress already uses for its own links: type part of a title, pick
 * the page, and the address is filled in. Typing an address, a path, or an
 * anchor like `#faq` still works — the picker offers whatever is typed as its
 * own suggestion.
 *
 * What is saved does not change: the block's existing `href` attribute, an
 * address as before. The picker's own "open in new tab" switch is turned off
 * (`settings={ [] }`) because the blocks already have Target and Link
 * relationship controls, and two answers to one question is worse than one.
 *
 * Props:
 *   - label:       the field's label, in the block's own wording.
 *   - value:       the current address.
 *   - onChange:    called with the new address.
 *   - help:        optional help text under the field.
 *   - placeholder: optional search-box placeholder.
 *   - disabled:    render the address as read-only text. The breadcrumb's
 *                  current page has no link to choose, and a picker that
 *                  looks live but refuses input is worse than no picker.
 */

import { __ } from '@wordpress/i18n';
import { LinkControl } from '@wordpress/block-editor';
import { BaseControl, useBaseControlProps } from '@wordpress/components';

export default function LinkField( {
	label,
	value,
	onChange,
	help,
	placeholder,
	disabled = false,
} ) {
	const { baseControlProps } = useBaseControlProps( { label, help } );

	if ( disabled ) {
		return (
			<BaseControl { ...baseControlProps } __nextHasNoMarginBottom>
				<p style={ { margin: 0, opacity: 0.6 } }>
					{ value || __( 'No link', 'awt-blocks' ) }
				</p>
			</BaseControl>
		);
	}

	return (
		<BaseControl { ...baseControlProps } __nextHasNoMarginBottom>
			<LinkControl
				value={ value ? { url: value } : undefined }
				settings={ [] }
				searchInputPlaceholder={
					placeholder ||
					__( 'Search for a page, or type an address', 'awt-blocks' )
				}
				onChange={ ( next ) => onChange( next?.url ?? '' ) }
				onRemove={ () => onChange( '' ) }
			/>
		</BaseControl>
	);
}
