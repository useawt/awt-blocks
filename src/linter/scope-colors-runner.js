/**
 * Reads the per-theme colors from the canvas and keeps them in the linter
 * store, for the contrast preview and the linter. Rendered once.
 *
 * The canvas loads after the editor and can be replaced (switching to the
 * template, for instance), so this looks for it every two seconds. It reads
 * a canvas a few times after it first appears, in case a stylesheet arrives
 * late, then leaves it alone until a different canvas shows up. The store is
 * only written when the colors change, so nothing re-renders for nothing.
 */

import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { LINTER_STORE } from './store';
import {
	canvasDocument,
	probeScopeColors,
	editorSchemes,
} from './scope-colors';

const EVERY_MS = 2000;
const READS_PER_CANVAS = 3;

export function ScopeColorsRunner() {
	const slugKey = useSelect(
		( select ) =>
			( select( blockEditorStore ).getSettings().colors || [] )
				.map( ( c ) => c && c.slug )
				.filter( Boolean )
				.join( ' ' ),
		[]
	);
	const { setScopeColors } = useDispatch( LINTER_STORE );

	useEffect( () => {
		// Without the AWT theme there are no Carbon themes to read.
		if ( ! editorSchemes() || ! slugKey ) {
			return undefined;
		}
		const slugs = slugKey.split( ' ' );
		let doc = null;
		let reads = 0;
		let last = '';

		const tick = () => {
			const current = canvasDocument();
			if ( ! current ) {
				return;
			}
			if ( current !== doc ) {
				doc = current;
				reads = 0;
			}
			if ( reads >= READS_PER_CANVAS ) {
				return;
			}
			const colors = probeScopeColors( current, slugs );
			if ( ! colors ) {
				return; // Its styles are not in yet; try again next time.
			}
			reads++;
			const key = JSON.stringify( colors );
			if ( key !== last ) {
				last = key;
				setScopeColors( colors );
			}
		};

		tick();
		const id = setInterval( tick, EVERY_MS );
		return () => clearInterval( id );
	}, [ slugKey, setScopeColors ] );

	return null;
}
