/**
 * §4 Part 3 — per-block color contrast preview + warning.
 *
 * For any block that supports the color block-supports UI, this adds a live
 * "Contrast" section INTO the block's Color panel (InspectorControls
 * group="color"), right where the author picks text/background colors. It shows:
 *   - the WCAG contrast ratio of the chosen text/background, updating in real
 *     time as the author adjusts them;
 *   - AA pass/fail badges for normal and large text;
 *   - a warning when the pair fails AA.
 *
 * The colors are the ones the block is really shown with (`linter/surfaces.js`):
 * its own text and background, else what it inherits and the surface behind
 * it, in every color theme a visitor can see it in. A palette color takes its
 * value in that theme (it follows light and dark), so on a site that shows
 * both, the preview gives one result for light mode and one for dark mode.
 * Without the AWT theme's colors it judges the palette's own values against
 * Carbon's default text and surface (#161616 on #ffffff), as it always did.
 */

import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { ratio } from './linter/wcag';
import { surfaces, isDarkScope } from './linter/surfaces';
import { editorSchemes } from './linter/scope-colors';
import { LINTER_STORE } from './linter/store';

const DEFAULT_TEXT = '#161616'; // Carbon text-primary
const DEFAULT_BG = '#ffffff'; // Carbon background

function Badge( { ok, label } ) {
	return (
		<span
			className={ `awt-contrast__badge awt-contrast__badge--${
				ok ? 'pass' : 'fail'
			}` }
		>
			{ label } { ok ? '✓' : '✕' }
		</span>
	);
}

function Result( { text, bg, label } ) {
	const r = ratio( text, bg );
	const ratioText = r
		? `${ r.toFixed( 2 ) }:1`
		: __( 'Unknown', 'awt-blocks' );
	const passNormal = r !== null && r >= 4.5;
	const passLarge = r !== null && r >= 3.0;

	return (
		<div className="awt-contrast__result">
			{ label && <p className="awt-contrast__mode">{ label }</p> }
			<p className="awt-contrast__ratio">
				{ __( 'Contrast ratio:', 'awt-blocks' ) }{ ' ' }
				<strong>{ ratioText }</strong>
			</p>
			<div className="awt-contrast__badges">
				<Badge
					ok={ passNormal }
					label={ __( 'AA normal text', 'awt-blocks' ) }
				/>
				<Badge
					ok={ passLarge }
					label={ __( 'AA large text', 'awt-blocks' ) }
				/>
			</div>
			{ ! passNormal && (
				<p className="awt-contrast__warn">
					{ passLarge
						? __(
								'Passes for large text only (24px and up, or 18.66px and up if bold). Normal-size text needs more contrast to pass WCAG AA.',
								'awt-blocks'
						  )
						: __(
								'Not enough contrast for WCAG AA (needs 4.5:1 for normal text, 3:1 for large text). Choose colors with more contrast.',
								'awt-blocks'
						  ) }
				</p>
			) }
		</div>
	);
}

const withContrastPreview = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const type = getBlockType( props.name );
		const supportsColor = !! (
			type &&
			type.supports &&
			type.supports.color
		);

		const scopeColors = useSelect(
			( select ) => select( LINTER_STORE ).getScopeColors(),
			[]
		);
		// A string, so the component only re-renders when a result changes.
		const viewsKey = useSelect(
			( select ) => {
				if ( ! supportsColor ) {
					return '';
				}
				const be = select( blockEditorStore );
				const colors = {};
				( be.getSettings().colors || [] ).forEach( ( c ) => {
					if ( c && c.slug && c.color ) {
						colors[ c.slug ] = c.color;
					}
				} );
				const block = be.getBlock( props.clientId ) || {
					name: props.name,
					attributes: props.attributes,
				};
				const ancestors = be
					.getBlockParents( props.clientId, true )
					.map( ( id ) => be.getBlock( id ) )
					.filter( Boolean );
				return JSON.stringify(
					surfaces( block, ancestors, {
						colors,
						scopeColors,
						schemes: editorSchemes(),
					} )
				);
			},
			[
				props.clientId,
				props.name,
				props.attributes,
				supportsColor,
				scopeColors,
			]
		);
		const views = useMemo(
			() => ( viewsKey ? JSON.parse( viewsKey ) : [] ),
			[ viewsKey ]
		);

		if ( ! supportsColor ) {
			return <BlockEdit { ...props } />;
		}

		// Name the mode when there is more than one, or when the only one is
		// dark, so the numbers are never read as the light ones.
		const named =
			views.length > 1 || views.some( ( v ) => isDarkScope( v.scope ) );

		return (
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorControls group="color">
					<div className="awt-contrast">
						{ views.map( ( v, i ) => {
							let label = null;
							if ( named && v.scope ) {
								label = isDarkScope( v.scope )
									? __( 'Dark mode', 'awt-blocks' )
									: __( 'Light mode', 'awt-blocks' );
							}
							return (
								<Result
									key={ v.scope || i }
									text={ v.text || DEFAULT_TEXT }
									bg={ v.bg || v.pageBg || DEFAULT_BG }
									label={ label }
								/>
							);
						} ) }
					</div>
				</InspectorControls>
			</Fragment>
		);
	};
}, 'withAwtContrastPreview' );

addFilter( 'editor.BlockEdit', 'awt/contrast-preview', withContrastPreview );
