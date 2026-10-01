import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/caret--down/32';
import { blockIcon } from '../shared/block-icon';
import Edit from './edit';

// Parent block with inner blocks. save() emits <InnerBlocks.Content /> so the
// child nav-item markup is preserved between the parent's comments on
// serialization; the front-end render runs via render.php.
registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
	deprecated: [],
} );
