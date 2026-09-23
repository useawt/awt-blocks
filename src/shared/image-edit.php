<?php
/**
 * Cropped images show cropped everywhere.
 *
 * When an image is cropped or rotated in the Media Library, WordPress saves a
 * new full-size file and remakes the image sizes from it — but only the sizes
 * that fit inside the new file. Every larger size keeps pointing at the old,
 * uncropped file. Crop a tall screenshot to 588x400 and "large" (1024px) still
 * serves the original 235x1024, so a featured image block asking for "large"
 * shows the image as if the crop never happened. Choosing "full size only" in
 * the crop screen remakes no sizes at all, so every size is out of date.
 *
 * Sizes made from the new file are named after it (photo-e1790180272730-300x204.jpg).
 * After an edit that replaced the full-size file, any size not named that way
 * came from the old file and is dropped. Asked for a size it no longer has,
 * WordPress falls back to the next one that fits, and in the end to the full
 * cropped file, which is the image the author meant.
 *
 * Nothing is deleted from disk. WordPress has already recorded the sizes it
 * regenerates in its backup list, so "Restore original image" still works.
 * The cost: a size it never backed up (all of them after a "full size only"
 * edit) is no longer listed anywhere, so deleting the image later leaves that
 * old copy in the uploads folder.
 *
 * Not covered: sites that define IMAGE_EDIT_OVERWRITE, where the edited file
 * keeps its old name and old and new sizes can no longer be told apart.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\ImageEdit;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The names of sizes that were not made from the current full-size file.
 *
 * Only meaningful for an edited image, whose file name ends in -e and a
 * timestamp: an unedited upload names its sizes after the original, which may
 * differ from its "-scaled" full-size file, so it would all read as stale.
 *
 * @param array $meta Attachment metadata.
 * @return string[] Size names.
 */
function stale_sizes( array $meta ): array {
	if ( empty( $meta['file'] ) || empty( $meta['sizes'] ) || ! is_array( $meta['sizes'] ) ) {
		return array();
	}

	$stem = pathinfo( (string) $meta['file'], PATHINFO_FILENAME );
	if ( ! preg_match( '/-e\d+$/', $stem ) ) {
		return array();
	}

	$stale = array();
	foreach ( $meta['sizes'] as $name => $size ) {
		if ( empty( $size['file'] ) || ! str_starts_with( (string) $size['file'], $stem . '-' ) ) {
			$stale[] = (string) $name;
		}
	}
	return $stale;
}

/**
 * Drop out-of-date sizes when an edit replaces an image's full-size file.
 *
 * @param mixed $data          Metadata about to be saved.
 * @param int   $attachment_id Attachment ID.
 * @return mixed
 */
function drop_stale_sizes( $data, $attachment_id ) {
	if ( ! is_array( $data ) || empty( $data['file'] ) ) {
		return $data;
	}

	// Still the stored value: WordPress filters before it writes.
	$before = get_post_meta( (int) $attachment_id, '_wp_attachment_metadata', true );
	if ( ! is_array( $before ) || empty( $before['file'] ) || $before['file'] === $data['file'] ) {
		return $data;
	}

	foreach ( stale_sizes( $data ) as $name ) {
		unset( $data['sizes'][ $name ] );
	}
	return $data;
}

add_filter( 'wp_update_attachment_metadata', __NAMESPACE__ . '\\drop_stale_sizes', 10, 2 );
