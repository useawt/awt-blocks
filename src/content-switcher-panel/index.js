import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/bottom-panel--open/32';
import { blockIcon } from '../shared/block-icon';
import Edit from './edit';

registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
	deprecated: [],
} );
