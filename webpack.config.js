/**
 * Extend @wordpress/scripts' default config to add ONE extra entry: the
 * plugin-wide editor bundle (src/index.js → build/index.js).
 *
 * wp-scripts discovers a bundle per block.json automatically, but those are the
 * only entries it builds — the default `src/index.js` fallback is dropped once
 * block metadata is found. The §4 accessibility linter (and later the
 * Accessibility panel + palette contrast checking) are editor-wide and have no
 * block.json, so we register the entry here. Everything else (loaders, plugins,
 * dependency extraction, externals) is inherited unchanged.
 *
 * With WP_EXPERIMENTAL_MODULES=true the default export is an ARRAY of two
 * configs: [0] classic scripts, [1] ESM view-modules. The editor bundle is a
 * classic script (uses the wp.* externals), so it joins config [0] only.
 */

const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

/**
 * Strip the last comments webpack would otherwise keep.
 *
 * wp-scripts configures Terser to preserve `translators:` notes, so that a POT
 * built from build/ still carries the context a translator needs. Ours is built
 * from src/ — `i18n:pot` excludes build/ — so in the emitted bundles those
 * notes are read by nobody except whoever opens the file on a live site.
 *
 * Reaching into the plugin's options is the only way to say it, and a
 * wp-scripts upgrade could move them. So this throws when it finds nothing to
 * set rather than returning a config that quietly ships comments again —
 * `check:assets` would catch that too, but a build that stops is a clearer
 * answer than a gate that fails two steps later.
 *
 * @param {Object} config One webpack config from wp-scripts.
 * @return {Object} The same config, with comment preservation off.
 */
function withoutComments( config ) {
	let set = 0;
	for ( const plugin of config.optimization?.minimizer ?? [] ) {
		const terser = plugin.options?.minimizer?.options;
		if ( terser?.output ) {
			terser.output.comments = false;
			set++;
		}
	}
	if ( set === 0 ) {
		throw new Error(
			"awt: wp-scripts' Terser options are not where this config expects " +
				'them, so comment stripping was not applied. Find the new shape ' +
				'in @wordpress/scripts/config/webpack.config and update ' +
				'withoutComments().'
		);
	}
	return config;
}

function withEditorEntry( config ) {
	const blockEntries =
		typeof config.entry === 'function' ? config.entry() : config.entry;
	return {
		...config,
		entry: {
			...blockEntries,
			index: path.resolve( __dirname, 'src', 'index.js' ),
		},
	};
}

module.exports = Array.isArray( defaultConfig )
	? [
			withoutComments( withEditorEntry( defaultConfig[ 0 ] ) ),
			...defaultConfig.slice( 1 ).map( withoutComments ),
	  ]
	: withoutComments( withEditorEntry( defaultConfig ) );
