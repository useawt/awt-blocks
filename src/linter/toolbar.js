/**
 * Per-block toolbar indicator. A small accessibility button appears in a
 * block's toolbar when that block has linter findings; its color reflects the
 * highest severity, and clicking it opens the Accessibility sidebar. Reads the
 * awt/linter store (populated by the runner in index.js).
 */

import { _n, sprintf } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { store as editPostStore } from '@wordpress/edit-post';
import { LINTER_STORE } from './store';

const SIDEBAR = 'awt-accessibility/awt-accessibility';

function highestSeverity( findings ) {
	if ( findings.some( ( f ) => f.severity === 'error' ) ) {
		return 'error';
	}
	if ( findings.some( ( f ) => f.severity === 'warning' ) ) {
		return 'warning';
	}
	return 'info';
}

const withBlockIndicator = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const findings = useSelect(
			( select ) =>
				select( LINTER_STORE ).getFindingsForBlock( props.clientId ),
			[ props.clientId ]
		);
		const { openGeneralSidebar } = useDispatch( editPostStore );

		if ( ! findings || ! findings.length ) {
			return <BlockEdit { ...props } />;
		}

		const sev = highestSeverity( findings );
		const label = sprintf(
			// translators: %d is the number of accessibility issues on this block.
			_n(
				'%d accessibility issue — open checks',
				'%d accessibility issues — open checks',
				findings.length,
				'awt-blocks'
			),
			findings.length
		);

		return (
			<Fragment>
				<BlockEdit { ...props } />
				<BlockControls group="other">
					<ToolbarGroup>
						<ToolbarButton
							icon="universal-access-alt"
							label={ label }
							text={ String( findings.length ) }
							className={ `awt-a11y-toolbar awt-a11y-toolbar--${ sev }` }
							onClick={ () => openGeneralSidebar( SIDEBAR ) }
						/>
					</ToolbarGroup>
				</BlockControls>
			</Fragment>
		);
	};
}, 'withAwtBlockIndicator' );

addFilter(
	'editor.BlockEdit',
	'awt/linter-block-indicator',
	withBlockIndicator
);
