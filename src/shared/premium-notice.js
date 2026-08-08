/**
 * PremiumNotice — a small in-context upsell shown in the editor where an AWT
 * Premium-only capability would otherwise live. Informational only (no input);
 * the free block keeps the underlying attribute for clean round-trip and the
 * Premium add-on supplies the real control + runtime.
 *
 * Props:
 *   - title:       short bold heading (the capability name).
 *   - description: one-line plain-language explanation.
 */

import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

const PREMIUM_URL = 'https://useawt.com/premium';

export default function PremiumNotice( { title, description } ) {
	return (
		<div
			style={ {
				border: '1px solid var(--wp-admin-theme-color, #3858e9)',
				borderRadius: '2px',
				padding: '12px',
				marginBlockStart: '8px',
			} }
		>
			<div
				style={ {
					display: 'inline-flex',
					alignItems: 'center',
					gap: '4px',
					fontSize: '11px',
					fontWeight: 600,
					textTransform: 'uppercase',
					letterSpacing: '0.04em',
					color: 'var(--wp-admin-theme-color, #3858e9)',
					marginBlockEnd: '8px',
				} }
			>
				<span aria-hidden="true">🔒</span>
				{ __( 'AWT Premium', 'awt' ) }
			</div>
			{ title && (
				<p style={ { fontWeight: 600, margin: '0 0 4px' } }>
					{ title }
				</p>
			) }
			{ description && (
				<p
					style={ {
						fontSize: '0.8125rem',
						color: '#757575',
						margin: '0 0 8px',
					} }
				>
					{ description }
				</p>
			) }
			<ExternalLink
				href={ PREMIUM_URL }
				style={ { fontSize: '0.8125rem' } }
			>
				{ __( 'Learn more about AWT Premium', 'awt' ) }
			</ExternalLink>
		</div>
	);
}
