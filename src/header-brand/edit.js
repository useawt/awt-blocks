import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	Button,
} from '@wordpress/components';

// Empty-string value is the "inherit from AWT Settings → Identity" choice —
// render.php's precedence chain is: per-block kind → theme default brandMode →
// 'auto'. An explicit kind pins THIS instance; leaving it empty lets the
// site-wide default flow through.
const KIND_OPTIONS = [
	{ value: '', label: __( 'Use site default (from AWT Settings)', 'awt' ) },
	{ value: 'text-only', label: __( 'Text only', 'awt' ) },
	{ value: 'text-with-prefix', label: __( 'Text with prefix', 'awt' ) },
	{ value: 'logo-only', label: __( 'Logo only', 'awt' ) },
	{ value: 'logo-with-text', label: __( 'Logo with text', 'awt' ) },
	{
		value: 'logo-with-text-and-prefix',
		label: __( 'Logo with text and prefix', 'awt' ),
	},
];

const ALT_HINT = [
	__( 'Writing good alt text for a header logo:', 'awt' ),
	__( "• Include the brand name (it's what visitors expect to hear)", 'awt' ),
	__(
		'• Mention that clicking navigates home when relevant (e.g., "Acme logo; back to home")',
		'awt'
	),
	__(
		'• Don\'t include the word "image" or "logo" alone — screen readers already announce that',
		'awt'
	),
	__( '• Keep it concise — under ~100 characters', 'awt' ),
].join( '\n' );

export default function Edit( { attributes, setAttributes } ) {
	const { kind, prefix, siteTitle, logoUrl, logoUrlDark, logoAlt, href } =
		attributes;

	// Resolve against AWT Settings (mirrors render.php) so the editor preview
	// reflects the configured brand mode / logo / prefix / title when this
	// instance leaves them blank ("use site default").
	const awt = ( typeof window !== 'undefined' && window.awtSettings ) || {};
	const rawKind = kind || awt.brandMode || 'auto';
	const effPrefix = prefix || awt.prefix || '';
	const effTitle = siteTitle || awt.siteTitle || '';
	const effAlt = logoAlt || awt.logoAlt || '';
	const effLogoLight = logoUrl || awt.logoUrl || '';
	const effLogoDark = logoUrlDark || awt.logoUrlDark || '';

	// Mirror render.php's 'auto' resolution: the default brand mode shows
	// whatever has been set — the logo once there is one, the prefix once there
	// is one. Resolved from the effective values so a logo set on this block
	// alone still shows.
	const isAuto = rawKind === 'auto';
	let effKind = rawKind;
	if ( isAuto ) {
		if ( effLogoLight ) {
			effKind = effPrefix
				? 'logo-with-text-and-prefix'
				: 'logo-with-text';
		} else {
			effKind = effPrefix ? 'text-with-prefix' : 'text-only';
		}
	}
	// Mirror render.php: when a distinct dark logo is configured, emit BOTH
	// imgs with the --light / --dark classes and let theme.css swap them based
	// on the header's scope (cds--g90/g100) or the page color scheme — exactly
	// as the front end does. That's why a dark header shows the dark logo
	// without the editor having to guess the scheme.
	const hasDualLogos =
		effLogoLight && effLogoDark && effLogoDark !== effLogoLight;

	const showLogo = [
		'logo-only',
		'logo-with-text',
		'logo-with-text-and-prefix',
	].includes( effKind );
	const showText = effKind !== 'logo-only';
	const showPrefix = [
		'text-with-prefix',
		'logo-with-text-and-prefix',
	].includes( effKind );

	// In automatic mode the logo + prefix fields are what *decide* whether those
	// parts render, so their controls have to stay reachable while still empty —
	// otherwise there is no way to fill them in. The preview keeps using
	// showLogo / showPrefix, which describe what actually renders.
	const offerLogoFields = showLogo || isAuto;
	const offerPrefixField = showPrefix || isAuto;

	// Mirror render.php: tag the brand when it actually renders a logo image, so
	// theme.css hides the title/prefix on mobile only for logo brands (text-only
	// brands keep their title on mobile).
	const hasLogo = showLogo && !! effLogoLight;
	const blockProps = useBlockProps( {
		className:
			'cds--header__name awt-header-brand-preview' +
			( hasLogo ? ' awt-brand--has-logo' : '' ),
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Header brand', 'awt' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Brand mode', 'awt' ) }
						help={
							isAuto
								? __(
										'Your site default is automatic: it shows the logo and prefix you have set, and just the site title when you have set neither.',
										'awt'
								  )
								: undefined
						}
						value={ kind }
						options={ KIND_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { kind: value } )
						}
					/>
					{ showText && (
						<TextControl
							label={ __( 'Site title override', 'awt' ) }
							help={ __(
								'Leave blank to use the WordPress site title.',
								'awt'
							) }
							value={ siteTitle }
							onChange={ ( value ) =>
								setAttributes( { siteTitle: value } )
							}
						/>
					) }
					{ offerPrefixField && (
						<TextControl
							label={ __( 'Prefix (e.g., "IBM")', 'awt' ) }
							value={ prefix }
							onChange={ ( value ) =>
								setAttributes( { prefix: value } )
							}
						/>
					) }
					{ offerLogoFields && (
						<>
							<MediaUploadCheck>
								<MediaUpload
									onSelect={ ( media ) =>
										setAttributes( {
											logoUrl: media.url,
											logoAlt: logoAlt || media.alt || '',
										} )
									}
									allowedTypes={ [ 'image' ] }
									render={ ( { open } ) => (
										<Button
											variant="secondary"
											onClick={ open }
										>
											{ logoUrl
												? __( 'Replace logo', 'awt' )
												: __( 'Upload logo', 'awt' ) }
										</Button>
									) }
								/>
							</MediaUploadCheck>
							{ logoUrl && (
								<>
									<TextControl
										label={ __( 'Logo alt text', 'awt' ) }
										help={ ALT_HINT }
										value={ logoAlt }
										onChange={ ( value ) =>
											setAttributes( { logoAlt: value } )
										}
									/>
									<Button
										variant="tertiary"
										onClick={ () =>
											setAttributes( {
												logoUrl: '',
												logoAlt: '',
											} )
										}
									>
										{ __( 'Remove logo', 'awt' ) }
									</Button>
								</>
							) }
						</>
					) }
					<TextControl
						label={ __( 'Link target', 'awt' ) }
						value={ href }
						onChange={ ( value ) =>
							setAttributes( { href: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<a
				{ ...blockProps }
				href={ href || '/' }
				onClick={ ( e ) => e.preventDefault() }
			>
				{ /* No inline sizing — the rule moved to theme.css `.cds--header__logo`
				     so editor and published get the same constraint via CSS. */ }
				{ showLogo &&
					effLogoLight &&
					( hasDualLogos ? (
						<>
							<img
								className="cds--header__logo cds--header__logo--light"
								src={ effLogoLight }
								alt={ effAlt }
							/>
							<img
								className="cds--header__logo cds--header__logo--dark"
								src={ effLogoDark }
								alt={ effAlt }
							/>
						</>
					) : (
						<img
							className="cds--header__logo"
							src={ effLogoLight }
							alt={ effAlt }
						/>
					) ) }
				{ showPrefix && effPrefix && (
					<span className="cds--header__name--prefix">
						{ effPrefix }&nbsp;
					</span>
				) }
				{ showText && (
					<span className="cds--header__name--text">
						{ effTitle || __( '(Site title)', 'awt' ) }
					</span>
				) }
			</a>
		</>
	);
}
