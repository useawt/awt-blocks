/**
 * Is this a web address, or prose someone typed into a URL field?
 *
 * The same rule as `looks_like_url()` in render-helpers.php, so the editor
 * warns about exactly what the page will refuse to link. A space is the
 * giveaway: no address contains a raw one, and every real shape of address —
 * a scheme, a root-relative path, a fragment, a bare domain — still passes.
 *
 * @param {string} href The field's value.
 * @return {boolean} True when it can be used as a link target.
 */
export default function looksLikeUrl( href ) {
	const value = ( href || '' ).trim();
	if ( ! value || /\s/.test( value ) ) {
		return false;
	}
	if ( /^(https?:|mailto:|tel:|\/|#|\?)/i.test( value ) ) {
		return true;
	}
	return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([:/?#]|$)/i.test( value );
}
