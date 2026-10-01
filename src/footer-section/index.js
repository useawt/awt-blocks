import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/open-panel--filled--bottom/32';
import { blockIcon } from '../shared/block-icon';
import Edit from './edit';

// Parent block with inner blocks. save() must emit <InnerBlocks.Content /> so
// WordPress preserves child block markup between the parent's comments on
// serialization; otherwise saving through the editor drops the children even
// though they're still visible during authoring. The actual front-end render
// still runs via render.php — save() just controls what lands in post_content.
registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
	deprecated: [],
} );
