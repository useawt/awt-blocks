/**
 * §4 Language controls — page-level language override.
 *
 * A "Language" panel in the editor's document (Page) settings. Sets the
 * `awt_theme_page_lang` post meta (registered + emitted by awt-theme via the
 * language_attributes filter) so a page written entirely in another language
 * can declare its own `<html lang>`. Empty = inherit the site language.
 */

import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import {
	PluginDocumentSettingPanel,
	store as editorStore,
} from '@wordpress/editor';
import { SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';

const META_KEY = 'awt_theme_page_lang';

// Common BCP-47 tags (English + the broader-European launch locales). Kept in
// sync with accessibility-panel.js's element-lang list.
const LANG_OPTIONS = [
	{ value: '', label: __( 'Site default', 'awt-blocks' ) },
	...[
		'en',
		'en-US',
		'en-GB',
		'de',
		'fr',
		'es',
		'it',
		'pt',
		'nl',
		'sv',
		'nb',
		'da',
		'fi',
		'pl',
		'cs',
		'el',
		'hu',
		'ro',
		'bg',
		'hr',
		'uk',
		'sr',
	].map( ( v ) => ( { value: v, label: v } ) ),
];

function PageLanguagePanel() {
	const postType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);
	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

	if ( ! meta ) {
		return null;
	}
	const value = meta[ META_KEY ] || '';

	return (
		<PluginDocumentSettingPanel
			name="awt-page-language"
			title={ __( 'Language', 'awt-blocks' ) }
		>
			<SelectControl
				label={ __( 'Page language', 'awt-blocks' ) }
				help={ __(
					'Set a different language for this page. Use it when the whole page is in another language. Leave “Site default” to use the site’s language.',
					'awt-blocks'
				) }
				value={ value }
				options={ LANG_OPTIONS }
				onChange={ ( v ) => setMeta( { ...meta, [ META_KEY ]: v } ) }
			/>
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'awt-page-language', { render: PageLanguagePanel } );
