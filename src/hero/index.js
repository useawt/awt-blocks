import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from './block.json';
import carbonIcon from '@carbon/icons/es/bullhorn/32';
import { blockIcon } from '../shared/block-icon';
import Edit from './edit';

// v1 → v2 migration note: the upgrade from attribute-based text fields to a
// real inner-blocks body happens in edit.js when a v1 hero mounts — NOT via a
// block deprecation. A deprecation's migrate() runs during editor boot, before
// the format library registers the Highlight (<mark>) format, and the rich-text
// conversion silently drops inline formats that aren't registered yet (it ate a
// <mark> in real content). By edit-mount time all formats are registered.
registerBlockType( metadata.name, {
	icon: blockIcon( carbonIcon ),
	edit: Edit,
	save: () => <InnerBlocks.Content />,
	deprecated: [],
} );
