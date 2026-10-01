import './style.scss';
/**
 * AWT Button block — editor registration.
 *
 * Block storage is semantic (kind=primary, size=lg). PHP render.php is the
 * single source of truth for output markup; this Edit component renders a
 * Carbon-styled preview using the same class grammar so authors see the
 * final visual in the editor canvas.
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/button--centered/32';
import { blockIcon } from '../shared/block-icon';
import Edit from './edit';

registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	// No save() because this block is server-rendered via render.php.
	save: () => null,
	// Empty for v1. Per Stage 0 policy: never remove an entry once added; bump
	// schema versions and add migrate() entries here when attributes change.
	deprecated: [],
} );
