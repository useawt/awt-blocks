<?php
/**
 * Tests for the cropped-image size clean-up in src/shared/image-edit.php.
 *
 * @package AWT\Blocks
 */

use function AWT\Blocks\ImageEdit\stale_sizes;

/**
 * A crop through the Media Library leaves no size pointing at the old file.
 */
class Test_Image_Edit extends WP_UnitTestCase {

	/**
	 * Attachments to remove, with their files, after each test.
	 *
	 * @var int[]
	 */
	private array $attachments = array();

	/**
	 * Delete the uploads and clear the request the crop read.
	 */
	public function tear_down() {
		foreach ( $this->attachments as $id ) {
			// The dropped sizes are no longer listed, so delete by name.
			$stem = preg_replace( '/(-scaled)?(-e\d+)?$/', '', pathinfo( get_attached_file( $id ), PATHINFO_FILENAME ) );
			wp_delete_attachment( $id, true );
			foreach ( (array) glob( wp_upload_dir()['path'] . '/' . $stem . '*' ) as $leftover ) {
				wp_delete_file( $leftover );
			}
		}
		unset( $_REQUEST['history'], $_REQUEST['target'], $_REQUEST['do'] );
		parent::tear_down();
	}

	/**
	 * Upload a tall 600x2800 image, the shape of a full-page screenshot.
	 *
	 * @return int Attachment ID.
	 */
	private function upload_tall_image(): int {
		$file  = wp_tempnam( 'awt-tall' ) . '.png';
		$image = imagecreatetruecolor( 600, 2800 );
		imagefill( $image, 0, 0, imagecolorallocate( $image, 4, 144, 240 ) );
		imagepng( $image, $file );

		$id                  = self::factory()->attachment->create_upload_object( $file );
		$this->attachments[] = $id;
		return $id;
	}

	/**
	 * Crop the image to its top 600x400 the way the Media Library does.
	 *
	 * @param int    $id     Attachment ID.
	 * @param string $target Which sizes the edit applies to: all, full or nothumb.
	 */
	private function crop( int $id, string $target = 'all' ): void {
		require_once ABSPATH . 'wp-admin/includes/image-edit.php';
		$_REQUEST['do']      = 'save';
		$_REQUEST['target']  = $target;
		$_REQUEST['history'] = wp_json_encode(
			array(
				array(
					'c' => array(
						'x' => 0,
						'y' => 0,
						'w' => 600,
						'h' => 400,
						'r' => 1, // Full-size coordinates, not the editor's preview.
					),
				),
			)
		);

		$result = wp_save_image( $id );
		$this->assertTrue( empty( $result->error ), 'The crop itself saved.' );
	}

	/**
	 * The size a featured image block asks for serves the cropped image.
	 */
	public function test_large_serves_the_cropped_image_after_a_crop() {
		$id = $this->upload_tall_image();
		$this->assertArrayHasKey( 'large', wp_get_attachment_metadata( $id )['sizes'], 'Precondition: the tall upload has a large size.' );

		$this->crop( $id );

		$src = wp_get_attachment_image_src( $id, 'large' );
		$this->assertSame( wp_get_attachment_url( $id ), $src[0], 'Large falls back to the cropped full-size file.' );
		$this->assertSame( array( 600, 400 ), array( $src[1], $src[2] ) );
		$this->assertSame( array(), stale_sizes( wp_get_attachment_metadata( $id ) ) );
	}

	/**
	 * Sizes small enough to be remade from the crop are kept.
	 */
	public function test_sizes_remade_from_the_crop_are_kept() {
		$id = $this->upload_tall_image();
		$this->crop( $id );

		$meta = wp_get_attachment_metadata( $id );
		$this->assertArrayHasKey( 'thumbnail', $meta['sizes'] );
		$this->assertArrayHasKey( 'medium', $meta['sizes'] );
		$this->assertStringStartsWith( pathinfo( $meta['file'], PATHINFO_FILENAME ) . '-', $meta['sizes']['medium']['file'] );
	}

	/**
	 * Editing the full size only remakes nothing, so nothing old survives.
	 */
	public function test_full_size_only_edit_leaves_no_old_size() {
		$id = $this->upload_tall_image();
		$this->crop( $id, 'full' );

		$this->assertSame( array(), wp_get_attachment_metadata( $id )['sizes'] );
		$this->assertSame( wp_get_attachment_url( $id ), wp_get_attachment_image_src( $id, 'medium' )[0] );
	}

	/**
	 * Restore original image still brings the original sizes back.
	 */
	public function test_restore_still_brings_back_the_original() {
		$id       = $this->upload_tall_image();
		$original = wp_get_attachment_metadata( $id );
		$this->crop( $id );

		require_once ABSPATH . 'wp-admin/includes/image-edit.php';
		wp_restore_image( $id );

		$meta = wp_get_attachment_metadata( $id );
		$this->assertSame( $original['file'], $meta['file'] );
		$this->assertSame( $original['sizes']['large']['file'], $meta['sizes']['large']['file'] );
	}

	/**
	 * An unedited upload is never touched, even when regenerated.
	 */
	public function test_unedited_image_is_left_alone() {
		$meta = array(
			'file'  => '2026/09/photo-scaled.jpg',
			'sizes' => array( 'large' => array( 'file' => 'photo-1024x683.jpg' ) ),
		);
		$this->assertSame( array(), stale_sizes( $meta ) );
	}
}
