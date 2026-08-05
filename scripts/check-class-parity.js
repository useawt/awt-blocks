#!/usr/bin/env node
/**
 * Class parity: every Carbon class our own stylesheet depends on must be
 * emittable by BOTH the server render and the editor preview.
 *
 * Why this exists. Three bugs in one block inside one day, all the same shape —
 * `edit.js` and the render path disagreeing about which classes they put on the
 * markup:
 *
 *   1. `--ux` missing from the emitted list  -> side nav drew on top of the header
 *   2. `__submenu` where the render emits `__heading`
 *                                            -> every side-nav section's links
 *                                               collapsed to zero height in the canvas
 *   3. `--persistent` missing                -> side nav drew over the content in
 *                                               template canvases
 *
 * Each failed silently and in ONE DIRECTION ONLY: the published page was correct
 * every time, so no gate that reads the front end could see any of them, and all
 * three shipped through green runs. A human found each one by looking at the Site
 * Editor. This check is the cheap version of that.
 *
 * What it compares, and why it is scoped this way:
 *
 * - **Only classes `awt-theme/assets/css/theme.css` has a selector for.** Those are
 *   the ones OUR css depends on, so a divergence changes rendering. Comparing every
 *   `cds--*` token instead flags ~26 blocks of legitimate difference — the editor
 *   previews a simplified widget and deliberately skips sub-elements and states —
 *   and a check nobody can read is a check nobody runs.
 *
 * - **Render side = `render.php` PLUS the theme's `classes_<component>()` mapper.**
 *   Most blocks call `$ds->classes_for(...)` and keep only a theme-absent fallback
 *   literal, so `render.php` alone under-reports badly: `text-input` looks like it
 *   never emits `cds--text-input-wrapper--inline` when `carbon.php` adds it.
 *
 * - **A class counts as emittable if it is spelled out OR if a prefix fragment
 *   could build it.** Both sides concatenate (`'cds--side-nav--' . $mode`), and
 *   treating a fragment as producing everything under it is what makes bug 3 above
 *   visible: the render side can produce `--persistent` from a fragment, so the
 *   editor has to be able to produce it too.
 *
 * - **Comments are stripped first.** `side-nav-link/render.php` mentions
 *   `.cds--side-nav--persistent` in a docblock, and a docblock is not markup.
 *
 * Intended asymmetries live in ALLOWED below, each with a reason. Adding an entry
 * is a deliberate act; that is the point.
 *
 * Usage: npm run check:class-parity
 * Needs the sibling `../awt-theme` checkout (the same one wp-env mounts).
 */

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const SRC = path.resolve( __dirname, '../src' );
const THEME = path.resolve( __dirname, '../../awt-theme' );
const THEME_CSS = path.join( THEME, 'assets/css/theme.css' );
const CARBON_PHP = path.join( THEME, 'inc/design-system/carbon.php' );

/**
 * Asymmetries that are correct on purpose.
 *
 * Keyed `<block>`: { '<class>': 'why' }. A class listed here is exempt in whichever
 * direction it currently differs.
 */
const ALLOWED = {
	tile: {
		'cds--tile-input':
			'The published page pairs a real <input type="radio"> with the tile as its <label>, so the browser supplies exclusive selection, arrow keys, one tab stop and a submitted value. The editor preview has neither that input nor a group around it: a <label> there would label nothing and a lone role="radio" would announce a radio button belonging to no group — the very defect this markup fixed. The preview is a <div> carrying the same tile classes, so everything theme.css styles is identical; only the invisible input is absent.',
	},
	'side-nav': {
		'cds--side-nav--ux':
			"Carbon's docking class: inset-block-start 3rem plus the narrow-screen collapse. The editor deliberately omits it and positions the preview itself, because the canvas cancels position:fixed and would drop the nav into the header's flex row.",
	},
	'header-brand': {
		'cds--g90':
			'Editor-only: the inspector previews the brand against a dark scope. Nothing on the published page sets a scope from this block.',
	},
	section: {
		'cds--g10':
			'Editor-only scope preview, as above. The render resolves the scope through the theme instead.',
		'cds--g100': 'Editor-only scope preview, as above.',
	},
	'content-switcher': {
		'cds--content-switcher-btn':
			'edit.js READS this class (classList.contains / querySelector) to find the selected button; it never writes it. The render emits it.',
	},
	'text-input': {
		'cds--label--inline':
			'The render adds `--inline` to the label; the editor leaves the label plain. theme.css styles both (`.cds--text-input-wrapper--inline > .cds--label` and `> .cds--label--inline` share one rule), so the inline layout is identical either way.',
	},
	'data-table': {
		'cds--table-sort__icon':
			'Column sorting is not previewed in the editor, so the sort button and its icon exist only in the render.',
	},
	dropdown: {
		'cds--list-box__menu':
			'The open menu is render-only; the editor previews the closed control.',
		'cds--list-box__menu-item':
			'Open-menu internals, render-only as above.',
		'cds--list-box__menu-item__option':
			'Open-menu internals, render-only as above.',
	},
	'header-nav': {
		'cds--header__action':
			'The mobile menu toggle is render-only — the editor previews the desktop nav.',
		'cds--header__menu-toggle__hidden':
			'Mobile toggle state, render-only as above.',
	},
	modal: {
		'cds--modal':
			'The editor previews the dialog inline rather than as an overlay, so the modal shell classes are render-only.',
		'cds--modal--danger': 'Modal shell, render-only as above.',
		'cds--modal-container': 'Modal shell, render-only as above.',
	},
	pagination: {
		'cds--pagination-nav__page--ellipsis':
			'The ellipsis appears only once there are more pages than fit; the editor preview has a fixed short page list.',
	},
	tabs: {
		'cds--tab-list':
			'The overflow-scroll tab list is render-only; the editor previews the tabs as a simple row.',
		'cds--tabs__nav-item--selected':
			'Runtime state: view.js marks the active tab on the published page. The editor previews the tab strip without a selection.',
		'cds--tab--list':
			"Render-only, and unlike most entries here it CANNOT be made otherwise. Every rule keyed on this class — Carbon's `.cds--tabs .cds--tab--list` flex row and `overflow-x`, theme.css's `.cds--tabs--vertical > .cds--tab--list` sidebar grid, its `.awt-tabs__strip > .cds--tab--list` scroll behaviour — needs the tab list to be a SEPARATE element inside `.cds--tabs`. Putting the class on the editor's own wrapper (which is both at once) therefore matches nothing at all, and putting it on a real inner element makes the wrapper's children the tab list, panels included: the horizontal preview lays the panels out beside the tabs in one scrolling row, and the vertical one squeezes every child into the 12rem sidebar column. Measured both, 2026-07-31. The editor previews tabs and panels as flat siblings and places them with `.editor-styles-wrapper .cds--tabs--vertical > .wp-block-awt-tab{-panel}` instead.",
	},
	'code-snippet': {
		'cds--snippet-button--copied':
			'Runtime state: view.js adds it for a moment after the copy button is pressed. There is nothing to copy in the editor.',
	},
};

/**
 * Divergences that look real but are not fixed yet. Reported loudly on every run
 * and NOT fatal, so the check can gate new drift today instead of waiting on an
 * editor preview to be reworked and re-verified.
 *
 * These are NOT in ALLOWED, deliberately: ALLOWED means "meant to differ", and
 * burying a real bug there is how the three side-nav ones survived four green
 * runs. Fix them and delete the entry; do not move it.
 *
 * Currently empty. The two it shipped with, both closed 2026-07-31:
 *
 * - `content-switcher` / `cds--content-switcher` was real and is fixed — the
 *   editor emits the base class now. Its stated symptom was wrong, though: the
 *   canvas was never missing the control's border. theme.css drew it a second
 *   way, per-segment, and the cost of the divergence was subtler — the segment
 *   row ran 2px tall at every size and 8px tall on `sm`, and no hover / active /
 *   focus rule written under `.cds--content-switcher` reached the canvas.
 * - `tabs` / `cds--tab--list` was not real. Emitting it cannot help; see the
 *   ALLOWED entry for what was measured.
 */
const KNOWN_DRIFT = {};

/**
 * Strip comments so a class named in a docblock is not read as markup.
 *
 * @param {string} code Source in PHP or JS.
 * @return {string} The same source with comments blanked out.
 */
function stripComments( code ) {
	return code
		.replace( /\/\*[\s\S]*?\*\//g, ' ' ) // /* … */
		.replace( /(^|[^:'"\w])\/\/[^\n]*/g, '$1 ' ) // // … but not https://
		.replace( /^\s*#(?!\[).*$/gm, ' ' ); // PHP # … (not #[Attribute])
}

const TOKEN = /cds--[A-Za-z0-9_-]*/g;

/**
 * Split a file's Carbon tokens into complete class names and prefix fragments.
 *
 * @param {string} code Source with comments already stripped.
 * @return {{full: Set<string>, frag: Set<string>}} Complete names and concatenation prefixes.
 */
function tokens( code ) {
	const all = code.match( TOKEN ) || [];
	return {
		full: new Set( all.filter( ( t ) => ! t.endsWith( '-' ) ) ),
		frag: new Set(
			all.filter( ( t ) => t.endsWith( '-' ) && t !== 'cds--' )
		),
	};
}

/**
 * Can this side put `cls` on the markup — spelled out, or built from a prefix?
 *
 * @param {string}      cls       Class name to test.
 * @param {Object}      side      One side's tokens, from `tokens()`.
 * @param {Set<string>} side.full Class names spelled out in full.
 * @param {Set<string>} side.frag Concatenation prefixes, e.g. `cds--side-nav--`.
 * @return {boolean} True when this side can put `cls` on the markup.
 */
function canEmit( cls, { full, frag } ) {
	return full.has( cls ) || [ ...frag ].some( ( f ) => cls.startsWith( f ) );
}

function read( file ) {
	return fs.existsSync( file )
		? stripComments( fs.readFileSync( file, 'utf8' ) )
		: '';
}

/**
 * The body of one `classes_<component>()` method in the theme's Carbon mapper.
 * Brace-matched from the signature, so a component's cases don't leak into the next.
 *
 * @param {string} php       carbon.php source.
 * @param {string} component Component slug, e.g. `side-nav`.
 * @return {string} The method body, or '' when the mapper has no method for it.
 */
function mapperBody( php, component ) {
	const method = 'classes_' + component.replace( /-/g, '_' );
	const at = php.indexOf( `function ${ method }(` );
	if ( at === -1 ) {
		return '';
	}
	let i = php.indexOf( '{', at );
	if ( i === -1 ) {
		return '';
	}
	let depth = 0;
	const start = i;
	for ( ; i < php.length; i++ ) {
		if ( php[ i ] === '{' ) {
			depth++;
		} else if ( php[ i ] === '}' && --depth === 0 ) {
			return php.slice( start, i );
		}
	}
	return '';
}

function main() {
	for ( const f of [ THEME_CSS, CARBON_PHP ] ) {
		if ( ! fs.existsSync( f ) ) {
			console.error(
				`✗ Missing ${ path.relative( process.cwd(), f ) }.`
			);
			console.error(
				'  This check reads the sibling awt-theme checkout, the same one'
			);
			console.error(
				'  wp-env mounts. Clone it beside awt-blocks and re-run.'
			);
			process.exit( 2 );
		}
	}

	// Classes our own stylesheet actually selects on — the ones a divergence breaks.
	// Comments stripped first: theme.css explains its own history at length, and a
	// class quoted in a comment ("`.cds--side-nav--expanded { inline-size: 16rem }`
	// is unconditional…") is not a class the stylesheet depends on.
	const themeSelected = new Set(
		[
			...fs
				.readFileSync( THEME_CSS, 'utf8' )
				.replace( /\/\*[\s\S]*?\*\//g, ' ' )
				.matchAll( /\.(cds--[A-Za-z0-9_-]+)/g ),
		].map( ( m ) => m[ 1 ] )
	);
	const carbonPhp = stripComments( fs.readFileSync( CARBON_PHP, 'utf8' ) );

	// Group by `awt_component`, not by block. One Carbon component is usually
	// several blocks — side-nav / side-nav-section / side-nav-link all map to
	// `side-nav` and split its markup between them — and the theme's mapper has a
	// single `classes_side_nav()` covering every element in that family. Comparing
	// a lone block against the whole mapper blames it for classes its siblings
	// emit: it reported 78 differences, nearly all of them a block "missing" a
	// class that belongs to another part of the same widget.
	const families = new Map();
	for ( const block of fs.readdirSync( SRC ).sort() ) {
		const dir = path.join( SRC, block );
		const renderFile = path.join( dir, 'render.php' );
		const editFile = path.join( dir, 'edit.js' );
		const blockJson = path.join( dir, 'block.json' );
		if ( ! fs.existsSync( renderFile ) || ! fs.existsSync( editFile ) ) {
			continue;
		}
		const component = fs.existsSync( blockJson )
			? JSON.parse( fs.readFileSync( blockJson, 'utf8' ) )
					.awt_component || block
			: block;
		if ( ! families.has( component ) ) {
			families.set( component, {
				blocks: [],
				render: '',
				view: '',
				edit: '',
			} );
		}
		const fam = families.get( component );
		fam.blocks.push( block );
		fam.render += ' ' + read( renderFile );
		fam.view += ' ' + read( path.join( dir, 'view.js' ) );
		fam.edit += ' ' + read( editFile );
	}

	const problems = [];
	const known = [];
	let exempted = 0;

	for ( const [ component, fam ] of [ ...families ].sort() ) {
		// Render side is the family's render.php files PLUS the theme mapper they
		// delegate to: most blocks call `$ds->classes_for()` and keep only a
		// theme-absent fallback, so render.php alone badly under-reports.
		const renderSide = tokens(
			fam.render + ' ' + mapperBody( carbonPhp, component )
		);
		const editSide = tokens( fam.edit );

		// `view.js` contributes the runtime state the server never prints — the
		// selectable tile gains `cds--tile--is-selected` on click. But it also READS
		// other components' classes: the side nav's view.js queries
		// `.cds--header__nav` to fold its links into the header menu. Static analysis
		// cannot tell a write from a read, so keep only tokens that EXTEND something
		// this family's own markup already emits. That admits `--is-selected` on a
		// tile and rejects `cds--header` on a side nav.
		const viewSide = tokens( fam.view );
		for ( const t of [ ...viewSide.full, ...viewSide.frag ] ) {
			if (
				[ ...renderSide.full ].some(
					( r ) => t.startsWith( r ) && t !== r
				)
			) {
				( t.endsWith( '-' ) ? renderSide.frag : renderSide.full ).add(
					t
				);
			}
		}
		const allowed = Object.assign(
			{},
			...fam.blocks.map( ( b ) => ALLOWED[ b ] || {} ),
			ALLOWED[ component ] || {}
		);

		// Candidates come from theme.css, not from the sources. Iterating only the
		// classes the sources spell out misses the case that matters most: a class
		// NEITHER side spells out because both build it by concatenation. That is
		// how `--persistent` hid — `'cds--side-nav--' . $mode` in the mapper, so
		// the full name appears nowhere, and the check passed while the editor
		// could not produce it at all.
		//
		// Scoped to this component's class neighbourhood: a theme class counts if
		// some token the family touches is a prefix of it, or it is a prefix of
		// one. That keeps `cds--side-nav--persistent` in scope for the side nav and
		// keeps `cds--btn` out of it.
		const touched = [
			...renderSide.full,
			...renderSide.frag,
			...editSide.full,
			...editSide.frag,
		].filter( ( t ) => t !== 'cds--' );
		const candidates = [ ...themeSelected ].filter( ( c ) =>
			touched.some( ( t ) => c.startsWith( t ) || t.startsWith( c ) )
		);

		for ( const cls of candidates ) {
			const r = canEmit( cls, renderSide );
			const e = canEmit( cls, editSide );
			if ( r === e ) {
				continue;
			}
			if ( allowed[ cls ] ) {
				exempted++;
				continue;
			}
			const drift = Object.assign(
				{},
				...fam.blocks.map( ( b ) => KNOWN_DRIFT[ b ] || {} ),
				KNOWN_DRIFT[ component ] || {}
			);
			if ( drift[ cls ] ) {
				known.push( { where: component, cls, why: drift[ cls ] } );
				continue;
			}
			problems.push( {
				where: `${ component } (${ fam.blocks.join( ', ' ) })`,
				cls,
				side: r ? 'render.php (+ theme mapper)' : 'edit.js',
				missing: r ? 'edit.js' : 'render.php (+ theme mapper)',
			} );
		}
	}
	const checked = families.size;

	if ( known.length ) {
		console.log( '! Known drift, tracked and not yet fixed:\n' );
		for ( const k of known ) {
			console.log( `  ${ k.where }: ${ k.cls }` );
			console.log( `      ${ k.why }\n` );
		}
	}

	if ( problems.length ) {
		console.error(
			'✗ Editor and render disagree on classes theme.css depends on:\n'
		);
		for ( const p of problems ) {
			console.error( `  ${ p.where }: ${ p.cls }` );
			console.error(
				`      emitted by ${ p.side }, missing from ${ p.missing }`
			);
		}
		console.error(
			'\n  theme.css has a selector for each class above, so whichever side'
		);
		console.error(
			'  omits it renders unstyled. Either emit it on both sides, or add it'
		);
		console.error(
			'  to ALLOWED in scripts/check-class-parity.js with the reason it is'
		);
		console.error( '  meant to differ.' );
		process.exit( 1 );
	}

	console.log(
		`✓ Editor and render agree on every theme.css-styled class ` +
			`(${ checked } component families, ${ exempted } documented exceptions).`
	);
}

main();
