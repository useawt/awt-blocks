/**
 * Checkbox — apply the partially-checked (indeterminate) state.
 *
 * A checkbox can be in three states, and the third one cannot be written in
 * HTML: `indeterminate` is a JavaScript property with no matching attribute, so
 * server-rendered markup has no way to express it. Until this file existed the
 * block wrote `data-indeterminate="true"` and nothing anywhere read it, which
 * meant the "Indeterminate" switch in the editor produced a checkbox that drew
 * as unchecked and told assistive technology `checked: false`. Setting the real
 * property fixes both at once: Carbon's `:indeterminate` CSS draws the dash, and
 * the browser reports `checked: mixed` on its own with no ARIA involved.
 *
 * Found by the accessibility-tree gate, which is the only gate that could see
 * it — the state exists in neither the markup nor the pixels the other gates
 * measure.
 *
 * Clearing it on the first change is part of the fix, not a detail: HTML keeps
 * `indeterminate` set after a click, so a "select all" checkbox would go on
 * showing a dash after the visitor had explicitly ticked it.
 */

const apply = () => {
	const inputs = document.querySelectorAll(
		'input[type="checkbox"][data-indeterminate="true"]'
	);
	inputs.forEach( ( input ) => {
		input.indeterminate = true;
		input.addEventListener(
			'change',
			() => {
				input.indeterminate = false;
			},
			{ once: true }
		);
	} );
};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', apply );
} else {
	apply();
}
