import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/popup/32';
import { blockIcon } from '../shared/block-icon';
import { startsEmpty } from '../shared/starts-empty';
import Edit from './edit';

registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	variations: startsEmpty( { heading: '' } ),
	save: () => <InnerBlocks.Content />,
	deprecated: [],
} );
