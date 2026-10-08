/**
 * An author can say an empty alt text is deliberate, and be believed.
 *
 * WordPress tells authors to leave alt text empty when an image is
 * decorative. The accessibility check then reported that empty alt as an
 * error and suggested "mark it as decorative" — which core's own checkbox
 * did, and the check ignored, because it was reading an attribute nothing
 * sets. The advice could not be followed (found on a live site, 2026-09-09).
 *
 * The finding is read from the linter store rather than from the sidebar,
 * because the store is what the sidebar, the pre-publish panel and the block
 * toolbar badge all render from — asserting on one panel would leave the
 * other two unproved.
 */

const { test, expect } = require( './fixtures' );

const IMAGE = {
	name: 'core/image',
	attributes: { url: 'https://example.com/decorative.png', alt: '' },
};
const COVER = {
	name: 'core/cover',
	attributes: { url: 'https://example.com/decorative.png', alt: '' },
};

// The check that fires for an image with no alt text.
const ALT_FINDINGS = () =>
	window.wp.data
		.select( 'awt/linter' )
		.getFindings()
		.filter( ( f ) => f.checkId === 1 ).length;

// Inserting a Cover selects the paragraph inside it, so the block under test
// has to be selected by hand. Its own inspector — and the checkbox — only
// render while it is.
const selectOuterBlock = ( page ) =>
	page.evaluate( () => {
		const { select, dispatch } = window.wp.data;
		const [ block ] = select( 'core/block-editor' ).getBlocks();
		dispatch( 'core/block-editor' ).selectBlock( block.clientId );
	} );

test.describe( 'Decorative images', () => {
	for ( const block of [ IMAGE, COVER ] ) {
		test( `marking a ${ block.name } decorative clears the missing-alt error`, async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( block );
			await selectOuterBlock( page );
			await editor.openDocumentSettingsSidebar();

			await expect
				.poll( async () => page.evaluate( ALT_FINDINGS ), {
					message: 'no alt text should be reported',
				} )
				.toBe( 1 );

			await page.getByLabel( 'Mark as decorative' ).click();

			await expect
				.poll( async () => page.evaluate( ALT_FINDINGS ), {
					message: 'saying it is decorative should clear the error',
				} )
				.toBe( 0 );
		} );
	}

	// Before WordPress 7.1 the Image block had no "Mark as decorative" of its
	// own, so AWT gives it one, and an Image marked there is saved without
	// the `role="none"` that 7.1 writes. 7.1 reads that as an older Image
	// block and used to drop the mark on the way, bringing the error back
	// (awt-workspace #25). This markup is what 6.6 to 7.0 save.
	test( 'an Image marked decorative before WordPress 7.1 keeps the mark', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createPost( {
			title: 'Decorative image saved before WordPress 7.1',
			content:
				'<!-- wp:image {"isDecorative":true} -->\n' +
				'<figure class="wp-block-image"><img src="https://example.com/decorative.png" alt=""/></figure>\n' +
				'<!-- /wp:image -->',
		} );
		await admin.visitAdminPage( 'post.php', `post=${ id }&action=edit` );

		await expect
			.poll( () =>
				page.evaluate( () => {
					const [ image ] =
						window.wp?.data
							?.select( 'core/block-editor' )
							.getBlocks() ?? [];
					return (
						image && {
							isValid: image.isValid,
							isDecorative: image.attributes.isDecorative,
						}
					);
				} )
			)
			.toEqual( { isValid: true, isDecorative: true } );

		await expect
			.poll( async () => page.evaluate( ALT_FINDINGS ), {
				message: 'the image is still marked, so nothing to report',
			} )
			.toBe( 0 );

		await selectOuterBlock( page );
		await editor.openDocumentSettingsSidebar();
		await expect( page.getByLabel( 'Mark as decorative' ) ).toBeChecked();
	} );

	test( 'the alt text help names what it links to and what else to do', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( COVER );
		await selectOuterBlock( page );
		await editor.openDocumentSettingsSidebar();

		await expect(
			page.getByRole( 'link', { name: /Alt text decision tree/ } )
		).toBeVisible();

		// The line that used to read only "Leave empty if decorative."
		await expect(
			page.getByText( 'Leave it empty and tick', { exact: false } )
		).toBeVisible();
	} );
} );
