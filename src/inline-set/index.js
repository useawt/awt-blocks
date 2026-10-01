import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/virtual-column/32';
import { blockIcon } from '../shared/block-icon';
import Edit from './edit';
import './wrap-loose';

// Container block. save() emits <InnerBlocks.Content /> so children persist
// inside the parent's block comments on serialization. Front-end render runs
// via render.php which wraps the children in the awt-inline-set div.
registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
