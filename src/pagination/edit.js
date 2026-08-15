import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, Notice } from '@wordpress/components';

export default function Edit( { attributes, setAttributes } ) {
	const { totalPages, currentPage, baseUrl, ariaLabel } = attributes;
	const blockProps = useBlockProps( {
		className: 'cds--pagination-nav awt-pagination-preview',
	} );

	const previewPages = totalPages > 0 ? totalPages : 5;
	const previewCurrent = currentPage > 0 ? currentPage : 1;

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Pagination', 'awt-blocks' ) }
					initialOpen={ true }
				>
					<Notice status="info" isDismissible={ false }>
						{ __(
							"On archive / blog templates, leave Total pages = 0 and the block auto-detects the main query's page count.",
							'awt-blocks'
						) }
					</Notice>
					<TextControl
						label={ __(
							'Total pages (0 = auto from main query)',
							'awt-blocks'
						) }
						type="number"
						value={ totalPages }
						onChange={ ( v ) =>
							setAttributes( { totalPages: Number( v ) || 0 } )
						}
					/>
					<TextControl
						label={ __( 'Current page (0 = auto)', 'awt-blocks' ) }
						type="number"
						value={ currentPage }
						onChange={ ( v ) =>
							setAttributes( { currentPage: Number( v ) || 1 } )
						}
					/>
					<TextControl
						label={ __(
							'Base URL (leave blank for current archive)',
							'awt-blocks'
						) }
						value={ baseUrl }
						onChange={ ( v ) => setAttributes( { baseUrl: v } ) }
					/>
					<TextControl
						label={ __(
							'Accessible name (aria-label)',
							'awt-blocks'
						) }
						value={ ariaLabel }
						onChange={ ( v ) => setAttributes( { ariaLabel: v } ) }
					/>
				</PanelBody>
			</InspectorControls>
			{ /* Editor renders the same Carbon `cds--pagination-nav` DOM as the
			     front-end render.php so loaded carbon.min.css styles every
			     piece (page cells, current-page background, disabled prev
			     chevron, hover states) identically in both contexts. */ }
			<nav { ...blockProps } aria-label={ ariaLabel }>
				<ul className="cds--pagination-nav__list">
					<li className="cds--pagination-nav__list-item">
						<span
							className="cds--pagination-nav__page cds--pagination-nav__page--disabled"
							aria-disabled="true"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								width="16"
								height="16"
								fill="currentColor"
								aria-hidden="true"
								focusable="false"
							>
								<path d="M5 8l5-5 .7.7L6.4 8l4.3 4.3-.7.7z" />
							</svg>
							<span className="cds--visually-hidden">
								{ __( 'Previous page', 'awt-blocks' ) }
							</span>
						</span>
					</li>
					{ Array.from(
						{ length: Math.min( previewPages, 5 ) },
						( _, i ) => i + 1
					).map( ( p ) => (
						<li
							key={ p }
							className="cds--pagination-nav__list-item"
						>
							{ p === previewCurrent ? (
								<span
									className="cds--pagination-nav__page cds--pagination-nav__page--current"
									aria-current="page"
								>
									{ p }
								</span>
							) : (
								/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- preview mirrors Carbon's pagination-nav reference markup (page links), which render.php ships; the href is inert in the editor */
								<a
									className="cds--pagination-nav__page"
									href="#"
									onClick={ ( e ) => e.preventDefault() }
								>
									{ p }
								</a>
							) }
						</li>
					) ) }
					<li className="cds--pagination-nav__list-item">
						{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid -- preview mirrors Carbon's pagination-nav reference markup, which render.php ships; the href is inert in the editor */ }
						<a
							className="cds--pagination-nav__page"
							href="#"
							onClick={ ( e ) => e.preventDefault() }
							aria-label={ __( 'Next page', 'awt-blocks' ) }
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								width="16"
								height="16"
								fill="currentColor"
								aria-hidden="true"
								focusable="false"
							>
								<path d="M11 8L6 13l-.7-.7L9.6 8 5.3 3.7 6 3z" />
							</svg>
						</a>
					</li>
				</ul>
			</nav>
		</>
	);
}
