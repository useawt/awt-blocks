import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/radio-button/32';
import { blockIcon } from '../shared/block-icon';
import Edit from './edit';

registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	save: () => null,
	deprecated: [],
} );
