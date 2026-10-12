import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { TextareaControl } from '@wordpress/components';

/**
 * Lines of `value|label` to options. A line with no `|` uses its text for
 * both. Spaces around each part and empty lines are dropped.
 *
 * @param {string} raw The text box's contents.
 * @return {Array<{value: string, label: string}>} The options.
 */
export function parseOptions( raw ) {
	return raw
		.split( '\n' )
		.map( ( line ) => {
			const [ value, ...rest ] = line.split( '|' );
			const label =
				rest.length > 0 ? rest.join( '|' ).trim() : value.trim();
			return value.trim() ? { value: value.trim(), label } : null;
		} )
		.filter( Boolean );
}

/**
 * Options to lines of `value|label`.
 *
 * @param {Array<{value: string, label: string}>} opts The options.
 * @return {string} The text box's contents.
 */
export function stringifyOptions( opts ) {
	return ( opts || [] )
		.map( ( o ) => `${ o.value }|${ o.label }` )
		.join( '\n' );
}

/**
 * The text box where a Select or Dropdown's options are typed.
 *
 * It keeps exactly what the author typed. It used to show the options
 * rebuilt from the saved ones on every keystroke, and saving drops spaces
 * and empty lines, so the box never matched what was typed and the browser
 * put the cursor at the end: a character typed in the middle of "Option 1"
 * landed after it, and a new line could not be started (found 2026-10-12).
 *
 * The options are still saved on every keystroke. The box follows the saved
 * options only when they change from outside it, such as an undo.
 *
 * @param {Object}   props          Component props.
 * @param {Array}    props.options  The saved options.
 * @param {Function} props.onChange Called with the parsed options.
 * @return {Element} The text box.
 */
export default function OptionsField( { options, onChange } ) {
	const [ draft, setDraft ] = useState( () => stringifyOptions( options ) );

	useEffect( () => {
		setDraft( ( current ) =>
			stringifyOptions( parseOptions( current ) ) ===
			stringifyOptions( options )
				? current
				: stringifyOptions( options )
		);
	}, [ options ] );

	return (
		<TextareaControl
			label={ __( 'Options (one per line: value|label)', 'awt-blocks' ) }
			value={ draft }
			onChange={ ( v ) => {
				setDraft( v );
				onChange( parseOptions( v ) );
			} }
			rows={ 6 }
		/>
	);
}
