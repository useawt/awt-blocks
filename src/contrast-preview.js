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
 * Effective colors resolve own textColor/backgroundColor (palette slug or
 * custom hex), falling back to the nearest ancestor's background and finally to
 * Carbon's default text/surface (#161616 on #ffffff) — which passes, so the
 * warning only appears once an author-chosen pair actually fails.
 */

import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { ratio } from './linter/wcag';

const DEFAULT_TEXT = '#161616'; // Carbon text-primary
const DEFAULT_BG = '#ffffff'; // Carbon background

function slugFromVar( v ) {
	const m = String( v ).match( /\|([^|]+)$/ );
	return m ? m[ 1 ] : null;
}

function resolveValue( value, colors ) {
	if ( ! value ) {
		return null;
	}
	if ( value[ 0 ] === '#' || /^rgba?\(/i.test( value ) ) {
		return value;
	}
	if ( value.indexOf( 'var:preset|color|' ) === 0 ) {
		const s = slugFromVar( value );
		return s && colors[ s ] ? colors[ s ] : null;
	}
	return colors[ value ] || null;
}

function ownText( attrs, colors ) {
	if ( attrs.textColor && colors[ attrs.textColor ] ) {
		return colors[ attrs.textColor ];
	}
	const s = attrs.style && attrs.style.color;
	return s && s.text ? resolveValue( s.text, colors ) : null;
}

function ownBg( attrs, colors ) {
	if ( attrs.backgroundColor && colors[ attrs.backgroundColor ] ) {
		return colors[ attrs.backgroundColor ];
	}
	const s = attrs.style && attrs.style.color;
	return s && s.background ? resolveValue( s.background, colors ) : null;
}

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

const withContrastPreview = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const type = getBlockType( props.name );
		const supportsColor = !! (
			type &&
			type.supports &&
			type.supports.color
		);

		const { colors, ancestorBg } = useSelect(
			( select ) => {
				const be = select( blockEditorStore );
				const map = {};
				( be.getSettings().colors || [] ).forEach( ( c ) => {
					if ( c && c.slug && c.color ) {
						map[ c.slug ] = c.color;
					}
				} );
				let abg = null;
				const parents = be.getBlockParents( props.clientId, true );
				for ( const pid of parents ) {
					const pb = be.getBlock( pid );
					const b = pb ? ownBg( pb.attributes || {}, map ) : null;
					if ( b ) {
						abg = b;
						break;
					}
				}
				return { colors: map, ancestorBg: abg };
			},
			[ props.clientId ]
		);

		if ( ! supportsColor ) {
			return <BlockEdit { ...props } />;
		}

		const attrs = props.attributes || {};
		const text = ownText( attrs, colors ) || DEFAULT_TEXT;
		const bg = ownBg( attrs, colors ) || ancestorBg || DEFAULT_BG;
		const r = ratio( text, bg );
		const rounded = r ? r.toFixed( 2 ) : '—';
		const passNormal = r !== null && r >= 4.5;
		const passLarge = r !== null && r >= 3.0;

		return (
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorControls group="color">
					<div className="awt-contrast">
						<p className="awt-contrast__ratio">
							{ __( 'Contrast ratio:', 'awt-blocks' ) }{ ' ' }
							<strong>{ `${ rounded }:1` }</strong>
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
				</InspectorControls>
			</Fragment>
		);
	};
}, 'withAwtContrastPreview' );

addFilter( 'editor.BlockEdit', 'awt/contrast-preview', withContrastPreview );
