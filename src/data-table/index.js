import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/data-table/32';
import { blockIcon } from '../shared/block-icon';
import Edit from './edit';
import transforms from './transforms';

registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	save: () => null,
	transforms,
	deprecated: [],
} );
