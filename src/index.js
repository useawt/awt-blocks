/**
 * AWT Blocks — top-level editor bundle.
 *
 * Plugin-wide editor entry (distinct from the per-block bundles). Hosts the §4
 * accessibility linter: a runner computes findings from the block tree and
 * writes them to the awt/linter store; the sidebar, pre-publish panel, and
 * per-block toolbar indicator all read from that store.
 */

import './editor.scss';
import './linter/toolbar';
import './linter/canvas-marker';
import './accessibility-panel';
import './contrast-preview';
import './page-language';

import { __, _n, sprintf } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import {
	PluginSidebar,
	PluginSidebarMoreMenuItem,
	PluginPrePublishPanel,
} from '@wordpress/editor';
import { Fragment, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useFindings } from './linter/use-findings';
import { LinterList } from './linter/Panel';
import { LINTER_STORE } from './linter/store';

const SIDEBAR_NAME = 'awt-accessibility';

// Icon with a severity-colored count badge. Used as the sidebar icon, so the
// badge also rides the pinned top-bar button — that's the "top-bar badge."
function LinterIcon() {
	const { count, sev } = useSelect( ( select ) => {
		const c = select( LINTER_STORE ).getSeverityCounts();
		const total = ( c.error || 0 ) + ( c.warning || 0 ) + ( c.info || 0 );
		let topSeverity = 'info';
		if ( c.error ) {
			topSeverity = 'error';
		} else if ( c.warning ) {
			topSeverity = 'warning';
		}
		return {
			count: total,
			sev: topSeverity,
		};
	}, [] );
	return (
		<span className="awt-linter-icon">
			<span className="dashicons dashicons-universal-access-alt" />
			{ count > 0 && (
				<span
					className={ `awt-linter-icon__badge awt-linter-icon__badge--${ sev }` }
				>
					{ count }
				</span>
			) }
		</span>
	);
}
const ICON = <LinterIcon />;
const ICON_PLAIN = 'universal-access-alt';

// Computes findings reactively and publishes them to the store. Rendered once.
function LinterRunner() {
	const findings = useFindings();
	const { setFindings } = useDispatch( LINTER_STORE );
	useEffect( () => {
		setFindings( findings );
	}, [ findings, setFindings ] );
	return null;
}

function Summary() {
	const counts = useSelect(
		( select ) => select( LINTER_STORE ).getSeverityCounts(),
		[]
	);
	const errors = counts.error || 0;
	const warnings = counts.warning || 0;
	const total = errors + warnings + ( counts.info || 0 );

	if ( ! total ) {
		return null;
	}
	const sev = errors ? 'error' : 'warning';
	const parts = [];
	if ( errors ) {
		parts.push(
			sprintf(
				// translators: %d — number of accessibility errors found.
				_n( '%d error', '%d errors', errors, 'awt-blocks' ),
				errors
			)
		);
	}
	if ( warnings ) {
		parts.push(
			sprintf(
				// translators: %d — number of accessibility warnings found.
				_n( '%d warning', '%d warnings', warnings, 'awt-blocks' ),
				warnings
			)
		);
	}
	return (
		<p className={ `awt-linter__summary awt-linter__summary--${ sev }` }>
			{ parts.join( ' · ' ) }
		</p>
	);
}

function SidebarBody() {
	const findings = useSelect(
		( select ) => select( LINTER_STORE ).getFindings(),
		[]
	);
	return (
		<div className="awt-linter">
			<Summary />
			<LinterList findings={ findings } />
		</div>
	);
}

function PrePublishBody() {
	const findings = useSelect(
		( select ) => select( LINTER_STORE ).getFindings(),
		[]
	);
	return (
		<Fragment>
			<Summary />
			<LinterList findings={ findings } />
		</Fragment>
	);
}

function AccessibilityPlugin() {
	return (
		<Fragment>
			<LinterRunner />

			<PluginSidebarMoreMenuItem target={ SIDEBAR_NAME } icon={ ICON }>
				{ __( 'Accessibility checks', 'awt-blocks' ) }
			</PluginSidebarMoreMenuItem>

			<PluginSidebar
				name={ SIDEBAR_NAME }
				title={ __( 'Accessibility', 'awt-blocks' ) }
				icon={ ICON }
			>
				<SidebarBody />
			</PluginSidebar>

			<PluginPrePublishPanel
				title={ __( 'Accessibility checks', 'awt-blocks' ) }
				icon={ ICON_PLAIN }
				initialOpen={ true }
			>
				<PrePublishBody />
			</PluginPrePublishPanel>
		</Fragment>
	);
}

registerPlugin( 'awt-accessibility', {
	render: AccessibilityPlugin,
	icon: ICON_PLAIN,
} );
