/**
 * Shared linter UI: the findings list + a severity-count summary. Rendered in
 * both the editor sidebar and the pre-publish checklist.
 */

import { __ } from '@wordpress/i18n';
import { dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { SEVERITY } from './checks';

const SEV_LABEL = {
	[ SEVERITY.ERROR ]: __( 'Error', 'awt-blocks' ),
	[ SEVERITY.WARNING ]: __( 'Warning', 'awt-blocks' ),
	[ SEVERITY.INFO ]: __( 'Info', 'awt-blocks' ),
};

const SEV_ORDER = {
	[ SEVERITY.ERROR ]: 0,
	[ SEVERITY.WARNING ]: 1,
	[ SEVERITY.INFO ]: 2,
};

export function severityCounts( findings ) {
	return findings.reduce( ( acc, f ) => {
		acc[ f.severity ] = ( acc[ f.severity ] || 0 ) + 1;
		return acc;
	}, {} );
}

// Navigate to the offending block: select it AND switch the sidebar from our
// Accessibility panel to the block-settings (Block) inspector so the author can
// fix it immediately.
function goToBlock( clientId ) {
	dispatch( blockEditorStore ).selectBlock( clientId );
	const editor = dispatch( 'core/edit-post' ) || dispatch( 'core/edit-site' );
	if ( editor && editor.openGeneralSidebar ) {
		editor.openGeneralSidebar( 'edit-post/block' );
	}
}

export function LinterList( { findings } ) {
	if ( ! findings.length ) {
		return (
			<p className="awt-linter__empty">
				{ __(
					'No accessibility issues found on this page.',
					'awt-blocks'
				) }
			</p>
		);
	}

	const sorted = [ ...findings ].sort(
		( a, b ) =>
			( SEV_ORDER[ a.severity ] ?? 9 ) - ( SEV_ORDER[ b.severity ] ?? 9 )
	);

	return (
		<ul className="awt-linter__list">
			{ sorted.map( ( f, i ) => (
				<li
					key={ i }
					className={ `awt-linter__item awt-linter__item--${ f.severity }` }
				>
					<span
						className={ `awt-linter__sev awt-linter__sev--${ f.severity }` }
					>
						{ SEV_LABEL[ f.severity ] || f.severity }
					</span>
					<span className="awt-linter__title">{ f.title }</span>
					<span className="awt-linter__desc">{ f.description }</span>
					{ f.clientId && (
						<Button
							variant="link"
							className="awt-linter__goto"
							onClick={ () => goToBlock( f.clientId ) }
						>
							{ __( 'Show block', 'awt-blocks' ) }
						</Button>
					) }
				</li>
			) ) }
		</ul>
	);
}
