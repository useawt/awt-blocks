/**
 * A block filled from a data source by other code (AWT Premium's live data,
 * through the `awt.dataSourceNote` filter) shows its content in the canvas as
 * it is, not for typing. These are the pieces such a block uses.
 */

import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * The look of the note above the content: small secondary text in the
 * site's own tokens, so it follows light and dark mode.
 */
export const SOURCE_NOTE_STYLE = {
	margin: '0 0 0.5rem',
	fontSize: '0.875rem',
	lineHeight: 1.4,
	color: 'var(--cds-text-secondary, #525252)',
};

/**
 * A click handler for the content: a link in it would take the editor away
 * from the post, so it says so instead, as core's Latest Posts block does.
 *
 * @return {Function} The handler, for `onClick`.
 */
export function useLinkGuard() {
	const { createWarningNotice } = useDispatch( 'core/notices' );
	return ( event ) => {
		if ( ! event.target.closest?.( 'a' ) ) {
			return;
		}
		event.preventDefault();
		createWarningNotice(
			__( 'Links do not open in the editor.', 'awt-blocks' ),
			{
				id: 'awt-source-link',
				type: 'snackbar',
			}
		);
	};
}
