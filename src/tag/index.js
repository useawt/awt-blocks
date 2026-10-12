import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/tag/32';
import { blockIcon } from '../shared/block-icon';
import { startsEmpty } from '../shared/starts-empty';
import Edit from './edit';

registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	save: () => null,
	deprecated: [],
	variations: startsEmpty( { text: '' } ),
} );
