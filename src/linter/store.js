/**
 * awt/linter data store — the single source of truth for current findings,
 * so block-agnostic surfaces (sidebar, pre-publish) and per-block surfaces
 * (the toolbar indicator HOC, which renders in a different React tree) read
 * the same data. One runner component computes findings and writes them here.
 */

import { createReduxStore, register } from '@wordpress/data';

export const LINTER_STORE = 'awt/linter';

// `scopeColors`: what each palette color and token looks like in each Carbon
// theme, read from the canvas (`scope-colors.js`); null until it can be read.
const DEFAULT_STATE = { findings: [], scopeColors: null };

const store = createReduxStore( LINTER_STORE, {
	reducer( state = DEFAULT_STATE, action ) {
		if ( action.type === 'SET_FINDINGS' ) {
			return { ...state, findings: action.findings };
		}
		if ( action.type === 'SET_SCOPE_COLORS' ) {
			return { ...state, scopeColors: action.scopeColors };
		}
		return state;
	},
	actions: {
		setFindings( findings ) {
			return { type: 'SET_FINDINGS', findings };
		},
		setScopeColors( scopeColors ) {
			return { type: 'SET_SCOPE_COLORS', scopeColors };
		},
	},
	selectors: {
		getFindings( state ) {
			return state.findings;
		},
		getScopeColors( state ) {
			return state.scopeColors;
		},
		getFindingsForBlock( state, clientId ) {
			return state.findings.filter( ( f ) => f.clientId === clientId );
		},
		getCount( state ) {
			return state.findings.length;
		},
		getSeverityCounts( state ) {
			return state.findings.reduce( ( acc, f ) => {
				acc[ f.severity ] = ( acc[ f.severity ] || 0 ) + 1;
				return acc;
			}, {} );
		},
	},
} );

register( store );
