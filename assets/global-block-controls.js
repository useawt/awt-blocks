/**
 * AWT global block controls (editor only).
 *
 * Injects two cross-cutting affordances into AWT blocks without editing each
 * block's edit.js:
 *
 *   1. A "Spacing" inspector panel — a Carbon spacing-token select
 *      (spacing-01 … spacing-13, default 05) that sets the block's BOTTOM
 *      margin, with a link to the Carbon spacing docs underneath. Applies to
 *      top-level, non-UI-shell blocks.
 *   2. A link to the matching Carbon component's documentation, rendered
 *      directly under the block-card description (top of the inspector), for
 *      any block that maps to a real Carbon component.
 *
 * The `awtSpacing` ATTRIBUTE is registered server-side (register_block_type_args,
 * see global-controls.php). This file only supplies the editor UI + the canvas
 * spacing class; global-controls.php applies the matching class on the front end.
 *
 * Hand-authored (no JSX / build step) — uses wp.* globals via createElement.
 * @param {Object} wp The global wp object.
 */
( function ( wp ) {
	if ( ! wp || ! wp.hooks || ! wp.element || ! wp.blocks ) {
		return;
	}

	const addFilter = wp.hooks.addFilter;
	const el = wp.element.createElement;
	const Fragment = wp.element.Fragment;
	const InspectorControls = wp.blockEditor.InspectorControls;
	const PanelBody = wp.components.PanelBody;
	const SelectControl = wp.components.SelectControl;
	const ExternalLink = wp.components.ExternalLink;
	const createHOC = wp.compose.createHigherOrderComponent;
	const __ = wp.i18n.__;
	const getBlockType = wp.blocks.getBlockType;

	const PREFIX = 'awt/';
	const SPACING_DEFAULT = '05';
	// Links match the inspector's regular control text size (13px) so they
	// never render larger than the surrounding field text.
	const LINK_STYLE = { fontSize: '0.8125rem' };

	const SPACING_OPTIONS = [
		{ value: '01', label: 'spacing-01 — 2px' },
		{ value: '02', label: 'spacing-02 — 4px' },
		{ value: '03', label: 'spacing-03 — 8px' },
		{ value: '04', label: 'spacing-04 — 12px' },
		{ value: '05', label: 'spacing-05 — 16px (default)' },
		{ value: '06', label: 'spacing-06 — 24px' },
		{ value: '07', label: 'spacing-07 — 32px' },
		{ value: '08', label: 'spacing-08 — 40px' },
		{ value: '09', label: 'spacing-09 — 48px' },
		{ value: '10', label: 'spacing-10 — 64px' },
		{ value: '11', label: 'spacing-11 — 80px' },
		{ value: '12', label: 'spacing-12 — 96px' },
		{ value: '13', label: 'spacing-13 — 160px' },
	];

	// AWT block slug (sans `awt/`) → Carbon component docs. Only blocks that map
	// to a real Carbon component (present in the official component list) appear
	// here; AWT-original blocks have no entry and show no link.
	const DOCS = {
		button: {
			label: 'Carbon Button',
			url: 'https://carbondesignsystem.com/components/button/usage/',
		},
		link: {
			label: 'Carbon Link',
			url: 'https://carbondesignsystem.com/components/link/usage/',
		},
		list: {
			label: 'Carbon List',
			url: 'https://carbondesignsystem.com/components/list/usage/',
		},
		breadcrumb: {
			label: 'Carbon Breadcrumb',
			url: 'https://carbondesignsystem.com/components/breadcrumb/usage/',
		},
		checkbox: {
			label: 'Carbon Checkbox',
			url: 'https://carbondesignsystem.com/components/checkbox/usage/',
		},
		'radio-button-group': {
			label: 'Carbon Radio button',
			url: 'https://carbondesignsystem.com/components/radio-button/usage/',
		},
		'text-input': {
			label: 'Carbon Text input',
			url: 'https://carbondesignsystem.com/components/text-input/usage/',
		},
		'password-input': {
			label: 'Carbon Text input',
			url: 'https://carbondesignsystem.com/components/text-input/usage/',
		},
		'text-area': {
			label: 'Carbon Text input',
			url: 'https://carbondesignsystem.com/components/text-input/usage/',
		},
		toggle: {
			label: 'Carbon Toggle',
			url: 'https://carbondesignsystem.com/components/toggle/usage/',
		},
		form: {
			label: 'Carbon Form',
			url: 'https://carbondesignsystem.com/components/form/usage/',
		},
		'menu-button': {
			label: 'Carbon Menu buttons',
			url: 'https://carbondesignsystem.com/components/menu-buttons/usage/',
		},
		tooltip: {
			label: 'Carbon Tooltip',
			url: 'https://carbondesignsystem.com/components/tooltip/usage/',
		},
		toggletip: {
			label: 'Carbon Toggletip',
			url: 'https://carbondesignsystem.com/components/toggletip/usage/',
		},
		notification: {
			label: 'Carbon Notification',
			url: 'https://carbondesignsystem.com/components/notification/usage/',
		},
		accordion: {
			label: 'Carbon Accordion',
			url: 'https://carbondesignsystem.com/components/accordion/usage/',
		},
		tile: {
			label: 'Carbon Tile',
			url: 'https://carbondesignsystem.com/components/tile/usage/',
		},
		tag: {
			label: 'Carbon Tag',
			url: 'https://carbondesignsystem.com/components/tag/usage/',
		},
		pagination: {
			label: 'Carbon Pagination',
			url: 'https://carbondesignsystem.com/components/pagination/usage/',
		},
		select: {
			label: 'Carbon Select',
			url: 'https://carbondesignsystem.com/components/select/usage/',
		},
		dropdown: {
			label: 'Carbon Dropdown',
			url: 'https://carbondesignsystem.com/components/dropdown/usage/',
		},
		'content-switcher': {
			label: 'Carbon Content switcher',
			url: 'https://carbondesignsystem.com/components/content-switcher/usage/',
		},
		tabs: {
			label: 'Carbon Tabs',
			url: 'https://carbondesignsystem.com/components/tabs/usage/',
		},
		modal: {
			label: 'Carbon Modal',
			url: 'https://carbondesignsystem.com/components/modal/usage/',
		},
		'code-snippet': {
			label: 'Carbon Code snippet',
			url: 'https://carbondesignsystem.com/components/code-snippet/usage/',
		},
		'data-table': {
			label: 'Carbon Data table',
			url: 'https://carbondesignsystem.com/components/data-table/usage/',
		},
		'header-brand': {
			label: 'Carbon UI shell — header',
			url: 'https://carbondesignsystem.com/components/UI-shell-header/usage/',
		},
		'header-nav': {
			label: 'Carbon UI shell — header',
			url: 'https://carbondesignsystem.com/components/UI-shell-header/usage/',
		},
		'header-global': {
			label: 'Carbon UI shell — header',
			url: 'https://carbondesignsystem.com/components/UI-shell-header/usage/',
		},
		'header-action': {
			label: 'Carbon UI shell — header',
			url: 'https://carbondesignsystem.com/components/UI-shell-header/usage/',
		},
		'side-nav': {
			label: 'Carbon UI shell — left panel',
			url: 'https://carbondesignsystem.com/components/UI-shell-left-panel/usage/',
		},
	};

	// Core blocks excluded from the opt-in Spacing control (structural /
	// invisible blocks where a bottom margin is meaningless). Mirrors the PHP
	// CORE_SPACING_DENY in global-controls.php.
	const CORE_SPACING_DENY = {
		'core/spacer': 1,
		'core/nextpage': 1,
		'core/more': 1,
		'core/freeform': 1,
		'core/html': 1,
		'core/shortcode': 1,
		'core/missing': 1,
		'core/block': 1,
		'core/template-part': 1,
		'core/post-content': 1,
		'core/query': 1,
		'core/legacy-widget': 1,
		'core/widget-group': 1,
		'core/navigation': 1,
		'core/list-item': 1,
		'core/page-list-item': 1,
	};

	// Per-block default Spacing token for core blocks. Most core blocks are
	// opt-in (default '' = no AWT spacing), but core/paragraph defaults to '05'
	// (16px) to match AWT blocks' bottom-margin rhythm. Mirror in global-controls.php.
	const CORE_SPACING_DEFAULTS = { 'core/paragraph': '05' };

	function coreSpacingDefault( name ) {
		return CORE_SPACING_DEFAULTS[ name ] || '';
	}

	function inScopeCore( name, t ) {
		if (
			! name ||
			name.indexOf( 'core/' ) !== 0 ||
			CORE_SPACING_DENY[ name ]
		) {
			return false;
		}
		if (
			! t ||
			( t.parent && t.parent.length ) ||
			( t.ancestor && t.ancestor.length )
		) {
			return false;
		}
		return true;
	}

	// Returns the Spacing mode for a block: 'awt' (forced default 05), 'core'
	// (opt-in, default none), or null (no control). Spacing applies to TOP-LEVEL
	// blocks; AWT UI-shell blocks (header / nav / footer) opt out.
	function spacingMode( name ) {
		if ( name && name.indexOf( PREFIX ) === 0 ) {
			const t = getBlockType( name );
			if ( ! t || ( t.parent && t.parent.length ) ) {
				return null;
			}
			return t.category !== 'awt-ui-shell' ? 'awt' : null;
		}
		if ( name && name.indexOf( 'core/' ) === 0 ) {
			return inScopeCore( name, getBlockType( name ) ) ? 'core' : null;
		}
		return null;
	}

	// Register the `awtSpacing` attribute on in-scope core blocks so the editor
	// persists it (default '' = no AWT spacing; the block keeps its theme/blockGap
	// margins until the author picks a token). The server mirrors this in
	// global-controls.php. AWT blocks register the attribute server-side already.
	addFilter(
		'blocks.registerBlockType',
		'awt/core-spacing-attr',
		function ( settings, name ) {
			if (
				! name ||
				name.indexOf( 'core/' ) !== 0 ||
				CORE_SPACING_DENY[ name ]
			) {
				return settings;
			}
			if (
				( settings.parent && settings.parent.length ) ||
				( settings.ancestor && settings.ancestor.length )
			) {
				return settings;
			}
			if ( settings.attributes && settings.attributes.awtSpacing ) {
				return settings;
			}
			return Object.assign( {}, settings, {
				attributes: Object.assign( {}, settings.attributes, {
					awtSpacing: {
						type: 'string',
						default: coreSpacingDefault( name ),
					},
				} ),
			} );
		}
	);

	const withControls = createHOC( function ( BlockEdit ) {
		return function ( props ) {
			const isAwt = props.name && props.name.indexOf( PREFIX ) === 0;
			const mode = spacingMode( props.name ); // 'awt' | 'core' | null
			if ( ! isAwt && mode !== 'core' ) {
				return el( BlockEdit, props );
			}
			const doc = isAwt
				? DOCS[ props.name.slice( PREFIX.length ) ]
				: null;
			// awt/section's "No gap below" switch (its own Layout panel)
			// overrides the token, so the Spacing panel would be a dead
			// control while it's on — hide it instead.
			const noGapBelow =
				props.name === 'awt/section' &&
				props.attributes &&
				!! props.attributes.noGapBelow;
			const showSpacing = mode !== null && ! noGapBelow;
			if ( ! doc && ! showSpacing ) {
				return el( BlockEdit, props );
			}
			// AWT blocks default to 05 (forced); core blocks default to '' (none).
			const rawSpacing = props.attributes && props.attributes.awtSpacing;
			let spacing = rawSpacing;
			if ( rawSpacing === undefined || rawSpacing === null ) {
				spacing = mode === 'awt' ? SPACING_DEFAULT : '';
			}
			// Core blocks get an explicit "None" choice so the author can keep
			// the theme's natural spacing; AWT blocks always carry a token.
			// In core mode the default IS "None", so strip the "(default)" tag
			// from spacing-05 (it's only the default for AWT blocks) to avoid two
			// options both reading as the default.
			const spacingOptions =
				mode === 'core'
					? [
							{
								value: '',
								label: __( 'None (theme default)', 'awt' ),
							},
					  ].concat(
							SPACING_OPTIONS.map( function ( o ) {
								return o.value === '05'
									? {
											value: '05',
											label: 'spacing-05 — 16px',
									  }
									: o;
							} )
					  )
					: SPACING_OPTIONS;

			// The doc link's InspectorControls is rendered BEFORE the block's own
			// controls so its fill mounts first and lands at the very top of the
			// Settings tab — directly under the block-card description, not in a
			// separate panel.
			const docFill = doc
				? el(
						InspectorControls,
						null,
						el(
							'p',
							{
								style: {
									padding: '0 16px',
									margin: '0 0 8px',
									fontSize: '0.8125rem',
								},
							},
							el(
								ExternalLink,
								{ href: doc.url, style: LINK_STYLE },
								doc.label
							)
						)
				  )
				: null;

			const spacingFill = showSpacing
				? el(
						InspectorControls,
						null,
						el(
							PanelBody,
							{
								title: __( 'Spacing', 'awt' ),
								initialOpen: false,
							},
							el( SelectControl, {
								label: __( 'Spacing (bottom margin)', 'awt' ),
								help: __(
									'Carbon spacing token applied as this block’s bottom margin.',
									'awt'
								),
								value: spacing,
								options: spacingOptions,
								onChange( v ) {
									props.setAttributes( { awtSpacing: v } );
								},
							} ),
							el(
								'p',
								{
									style: {
										margin: '4px 0 0',
										fontSize: '0.8125rem',
									},
								},
								el(
									ExternalLink,
									{
										href: 'https://carbondesignsystem.com/elements/spacing/overview/#spacing',
										style: LINK_STYLE,
									},
									__( 'Carbon spacing', 'awt' )
								)
							)
						)
				  )
				: null;

			return el(
				Fragment,
				null,
				docFill,
				el( BlockEdit, props ),
				spacingFill
			);
		};
	}, 'withAwtControls' );
	addFilter( 'editor.BlockEdit', 'awt/global-controls', withControls );

	// Mirror the chosen token onto the editor canvas wrapper so the spacing is
	// visible while authoring (theme.css `.awt-spacing-NN` is loaded in the
	// canvas). The front-end class is added by the render_block filter.
	const withCanvasClass = createHOC( function ( BlockListBlock ) {
		return function ( props ) {
			const mode = spacingMode( props.name );
			if ( mode === null ) {
				return el( BlockListBlock, props );
			}
			// awt/section's "No gap below" switch wins over the token —
			// mirror the front end's awt-spacing-none class.
			if (
				props.name === 'awt/section' &&
				props.attributes &&
				props.attributes.noGapBelow
			) {
				return el(
					BlockListBlock,
					Object.assign( {}, props, {
						className:
							( props.className ? props.className + ' ' : '' ) +
							'awt-spacing-none',
					} )
				);
			}
			const raw = props.attributes && props.attributes.awtSpacing;
			let spacing = raw;
			if ( raw === undefined || raw === null || raw === '' ) {
				spacing = mode === 'awt' ? SPACING_DEFAULT : '';
			}
			if ( ! spacing ) {
				return el( BlockListBlock, props ); // core block with no token chosen
			}
			const cls =
				( props.className ? props.className + ' ' : '' ) +
				'awt-spacing-' +
				spacing;
			return el(
				BlockListBlock,
				Object.assign( {}, props, { className: cls } )
			);
		};
	}, 'withAwtCanvasClass' );
	addFilter(
		'editor.BlockListBlock',
		'awt/global-canvas-class',
		withCanvasClass
	);

	// Header appearance parity: when AWT Settings forces the header to a fixed
	// light/dark scheme, add the matching Carbon scope class to the header
	// group in the editor canvas (the front end does this via a render_block
	// filter keyed on `.cds--header`). Site-wide appearance is handled
	// server-side on the canvas body (theme functions.php).
	const withHeaderScope = createHOC( function ( BlockListBlock ) {
		return function ( props ) {
			const aw =
				( typeof window !== 'undefined' && window.awtSettings ) || {};
			const scheme = aw.headerColorScheme;
			const cn = ( props.attributes && props.attributes.className ) || '';
			if (
				( scheme === 'light' || scheme === 'dark' ) &&
				cn.indexOf( 'cds--header' ) !== -1
			) {
				const scope = scheme === 'dark' ? aw.darkScope : aw.lightScope;
				if (
					scope &&
					( ' ' + ( props.className || '' ) + ' ' ).indexOf(
						' ' + scope + ' '
					) === -1
				) {
					return el(
						BlockListBlock,
						Object.assign( {}, props, {
							className: (
								( props.className || '' ) +
								' ' +
								scope
							).trim(),
						} )
					);
				}
			}
			return el( BlockListBlock, props );
		};
	}, 'withAwtHeaderScope' );
	addFilter(
		'editor.BlockListBlock',
		'awt/header-appearance-scope',
		withHeaderScope
	);
} )( window.wp );
