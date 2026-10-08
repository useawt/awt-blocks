/**
 * The text and background colors a block is really shown with, in every
 * color theme a visitor can see it in.
 *
 * A palette color follows the Carbon theme it sits in (awt-workspace #24): the
 * same "Text secondary" is #525252 on a light page and #c6c6c6 on a dark one.
 * The editor's contrast preview and the linter used to judge every palette
 * color at its light value, against a white page, so on a site that shows dark
 * mode they could pass text that fails and fail text that passes. They now ask
 * this module instead.
 *
 * Which themes a block is seen in:
 *
 * - inside an AWT Section with its own theme (`themeScope`), that theme only;
 * - otherwise every scheme the site shows visitors, light and dark when the
 *   page follows the visitor, one when the site pins it (`schemes.visitor`,
 *   from the theme).
 *
 * Colors per theme come from `scopeColors`, read from the editor canvas
 * itself (`scope-colors.js`): what each palette color and Carbon token
 * resolves to inside `.cds--white` … `.cds--g100`, after the site's Custom
 * CSS and any brand colors. Without it (another theme, or the canvas not
 * ready yet) a block is judged once, at the palette's own values, as before.
 *
 * Pure functions, no `@wordpress/*` imports, so the linter's unit tests can
 * drive them with plain block fixtures.
 */

const DARK_SCOPES = [ 'g90', 'g100' ];

/**
 * Whether a Carbon theme scope is a dark one.
 *
 * @param {string|null} scope 'white', 'g10', 'g90' or 'g100'.
 */
export function isDarkScope( scope ) {
	return DARK_SCOPES.includes( scope );
}

/*
 * Containers that paint nothing behind their content, so text inside them
 * sits on whatever is behind the container. Anything else (a Tile, a Modal,
 * a template part such as the header or footer, a Cover with its image) has a
 * surface this module does not model, and a block inside one is only judged
 * against a background set on the way to it.
 */
const OPAQUE_CORE = [ 'core/template-part', 'core/cover' ];
const SEE_THROUGH_AWT = [
	'awt/section',
	'awt/hero',
	'awt/feature-grid',
	'awt/inline-set',
	'awt/accordion',
	'awt/accordion-item',
	'awt/faq-item',
	'awt/content-switcher',
	'awt/content-switcher-panel',
	'awt/list',
	'awt/list-item',
	'awt/form',
	'awt/radio-button-group',
];

function seeThrough( name ) {
	if ( ! name ) {
		return false;
	}
	if ( name.indexOf( 'core/' ) === 0 ) {
		return ! OPAQUE_CORE.includes( name );
	}
	return SEE_THROUGH_AWT.includes( name );
}

function attrs( b ) {
	return ( b && b.attributes ) || {};
}

function isLiteral( value ) {
	return /^#|^rgba?\(/i.test( String( value ) );
}

function slugOf( value ) {
	const v = String( value );
	if ( v.indexOf( 'var:preset|color|' ) === 0 ) {
		return v.slice( 'var:preset|color|'.length );
	}
	return v;
}

/**
 * The theme an AWT Section pins, or null when it follows the page.
 *
 * "light" and "dark" mean the site's own pair (its style variation), which
 * the theme reports as `schemes.light` / `schemes.dark`.
 *
 * @param {Object} b       Block.
 * @param {Object} schemes `{ light, dark, visitor }`, or undefined.
 */
export function sectionScope( b, schemes ) {
	if ( ! b || b.name !== 'awt/section' ) {
		return null;
	}
	const s = attrs( b ).themeScope;
	if ( s === 'g10' || s === 'g100' ) {
		return s;
	}
	if ( s === 'light' ) {
		return ( schemes && schemes.light ) || 'white';
	}
	if ( s === 'dark' ) {
		return ( schemes && schemes.dark ) || 'g100';
	}
	return null;
}

/**
 * A color value as it renders in a theme: a custom color is itself, a
 * palette color takes the value it has there.
 *
 * @param {string}      value A palette slug, `var:preset|color|<slug>`, or a hex/rgb() color.
 * @param {string|null} scope Carbon theme, or null for the palette's own value.
 * @param {Object}      ctx   `{ colors, scopeColors }`.
 */
export function colorIn( value, scope, ctx ) {
	if ( ! value ) {
		return null;
	}
	if ( isLiteral( value ) ) {
		return value;
	}
	const slug = slugOf( value );
	const scoped =
		scope &&
		ctx.scopeColors &&
		ctx.scopeColors.palette &&
		ctx.scopeColors.palette[ scope ];
	if ( scoped && scoped[ slug ] ) {
		return scoped[ slug ];
	}
	return ( ctx.colors && ctx.colors[ slug ] ) || null;
}

/**
 * A Carbon token in a theme. AWT Section paints its background this way.
 *
 * @param {string}      token Token name without `--cds-`.
 * @param {string|null} scope Carbon theme.
 * @param {Object}      ctx   `{ colors, scopeColors }`.
 */
export function tokenIn( token, scope, ctx ) {
	const scoped =
		scope &&
		ctx.scopeColors &&
		ctx.scopeColors.tokens &&
		ctx.scopeColors.tokens[ scope ];
	if ( scoped && scoped[ token ] ) {
		return scoped[ token ];
	}
	return ( ctx.colors && ctx.colors[ token ] ) || null;
}

function ownBgIn( b, scope, ctx ) {
	const a = attrs( b );
	if ( b.name === 'awt/section' ) {
		return a.backgroundColor
			? tokenIn( a.backgroundColor, scope, ctx )
			: null;
	}
	if ( a.backgroundColor ) {
		return colorIn( a.backgroundColor, scope, ctx );
	}
	const style = a.style && a.style.color;
	return style && style.background
		? colorIn( style.background, scope, ctx )
		: null;
}

function ownTextIn( b, scope, ctx ) {
	const a = attrs( b );
	if ( a.textColor ) {
		return colorIn( a.textColor, scope, ctx );
	}
	const style = a.style && a.style.color;
	return style && style.text ? colorIn( style.text, scope, ctx ) : null;
}

/**
 * Whether the block's own text color is set (from the palette or custom).
 *
 * @param {Object} b Block.
 */
export function hasOwnText( b ) {
	const a = attrs( b );
	return !! (
		a.textColor ||
		( a.style && a.style.color && a.style.color.text )
	);
}

/**
 * The colors a block is shown with, once per theme it can be seen in.
 *
 * `bg` is null when the surface behind the block is not known (it sits in a
 * container this module does not model, or there is no theme data and no
 * background was set); `pageBg` is the theme's page background, for a caller
 * that needs a best guess. `text` falls back to inherited text and then to the
 * theme's own text color; `textOwn` says whether the block set its own.
 *
 * @param {Object}   b         Block.
 * @param {Object[]} ancestors Its ancestors, nearest first.
 * @param {Object}   ctx       `{ colors, scopeColors, schemes }`.
 * @return {Array<{scope: (string|null), text: (string|null), bg: (string|null), pageBg: (string|null), textOwn: boolean}>} One entry per theme.
 */
export function surfaces( b, ancestors, ctx ) {
	const chain = [ b, ...( ancestors || [] ) ];
	const schemes = ctx.schemes;
	const themed = !! ctx.scopeColors;

	let fixed = null;
	for ( const n of chain ) {
		fixed = sectionScope( n, schemes );
		if ( fixed ) {
			break;
		}
	}
	let scopes = [ null ];
	if ( fixed ) {
		scopes = [ fixed ];
	} else if (
		themed &&
		schemes &&
		schemes.visitor &&
		schemes.visitor.length
	) {
		scopes = schemes.visitor;
	}

	return scopes.map( ( scope ) => {
		const useScope = themed ? scope : null;

		// Background: the nearest one set, a themed section's own, or the page's.
		let bg = null;
		let open = true;
		for ( const n of chain ) {
			const own = ownBgIn( n, useScope, ctx );
			if ( own ) {
				bg = own;
				break;
			}
			if ( sectionScope( n, schemes ) ) {
				bg = themed ? tokenIn( 'background', useScope, ctx ) : null;
				break;
			}
			if ( n !== b && ! seeThrough( n.name ) ) {
				open = false;
				break;
			}
		}
		if ( ! bg && open && themed && useScope ) {
			bg = tokenIn( 'background', useScope, ctx );
		}

		// Text: the block's own, else inherited up to a themed section, which
		// sets the theme's text color.
		let text = null;
		for ( const n of chain ) {
			text = ownTextIn( n, useScope, ctx );
			if ( text || sectionScope( n, schemes ) ) {
				break;
			}
		}
		if ( ! text && themed && useScope ) {
			text = tokenIn( 'text-primary', useScope, ctx );
		}

		return {
			scope: useScope,
			text,
			bg,
			pageBg:
				themed && useScope
					? tokenIn( 'background', useScope, ctx )
					: null,
			textOwn: hasOwnText( b ),
		};
	} );
}

/**
 * Ancestors of every block in a tree, nearest first, keyed by clientId.
 *
 * @param {Object[]} tree Nested blocks.
 * @param {Object[]} up   Ancestors of `tree` (internal).
 * @param {Object}   map  Accumulator (internal).
 */
export function ancestorsFromTree( tree, up = [], map = {} ) {
	for ( const b of tree || [] ) {
		map[ b.clientId ] = up;
		if ( b.innerBlocks && b.innerBlocks.length ) {
			ancestorsFromTree( b.innerBlocks, [ b, ...up ], map );
		}
	}
	return map;
}

/**
 * How to name a theme in a message, when the block can be seen in more than
 * one: "in dark mode". Empty when there is only one, so the message stays as
 * short as before.
 *
 * @param {string|null} scope Carbon theme.
 * @param {number}      count How many themes the block is judged in.
 */
export function modeSuffix( scope, count ) {
	if ( ! scope || count < 2 ) {
		return '';
	}
	return isDarkScope( scope ) ? ' in dark mode' : ' in light mode';
}
