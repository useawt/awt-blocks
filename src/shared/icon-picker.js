/**
 * Shared IconPicker editor component.
 *
 * Drops into any block inspector that needs a Carbon icon-name attribute.
 * Authors search by name / friendly name / Carbon alias and click an icon to
 * select; the value committed is the canonical lowercase Carbon token (e.g.,
 * `arrow--right`, `user--avatar`, `trash-can`) — the same string the
 * server-side icon() helper in render-helpers.php expects.
 *
 * Manifest is loaded lazily on first picker open (the JSON is ~450 KB raw /
 * ~80 KB gzipped, fine to fetch once per editor session). The URL is exposed
 * via window.awtBlocks.iconManifestUrl by enqueue_block_editor_assets in
 * awt-blocks.php.
 *
 * Icon previews are fetched as <img src=…> from the SVG set the build
 * bundles into build/shared/carbon-icons/ (installed copies of the plugin
 * have no node_modules, so the bundled set is the only one that exists
 * everywhere). Bundle filenames are the lowercase token; size-independent
 * icons (manifest sizes ['glyph']) sit in the bundle root. The browser
 * caches individual files; the visible grid only loads ~30–50 at a time.
 */

import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import {
	BaseControl,
	Button,
	TextControl,
	Spinner,
} from '@wordpress/components';

let manifestPromise = null;

// Derive the plugin base URL EAGERLY at module load. The current-icon thumb
// in the chip needs this URL to render before the picker grid is ever opened
// — previously this was set lazily inside loadManifest(), so an icon saved
// on a block showed no preview thumbnail until the user clicked the picker.
const manifestPluginUrl = ( () => {
	const url =
		( typeof window !== 'undefined' &&
			window.awtBlocks &&
			window.awtBlocks.iconManifestUrl ) ||
		'';
	return url
		? url.replace( /\/build\/shared\/icon-manifest\.json$/, '' )
		: '';
} )();

// token → 'sized' | 'glyph', for every icon in the manifest. Populated when
// the manifest loads. 'glyph' marks size-independent icons whose SVG sits in
// the bundle root (caution, circle-fill, …); a token missing from the map is
// either legacy single-dash AWT content (arrow-right for arrow--right) or a
// lookup before the manifest arrived.
let tokenKind = {};

function loadManifest() {
	if ( manifestPromise ) {
		return manifestPromise;
	}
	const url = window.awtBlocks && window.awtBlocks.iconManifestUrl;
	if ( ! url ) {
		manifestPromise = Promise.resolve( { iconsByName: {} } );
		return manifestPromise;
	}
	manifestPromise = fetch( url )
		.then( ( res ) => ( res.ok ? res.json() : { iconsByName: {} } ) )
		.then( ( manifest ) => {
			const map = {};
			for ( const [ token, meta ] of Object.entries(
				manifest.iconsByName || {}
			) ) {
				map[ token ] =
					meta.sizes && meta.sizes.includes( 'glyph' )
						? 'glyph'
						: 'sized';
			}
			tokenKind = map;
			return manifest;
		} )
		.catch( () => ( { iconsByName: {} } ) );
	return manifestPromise;
}

function iconPreviewUrl( token, sizes ) {
	if ( ! manifestPluginUrl || ! token ) {
		return '';
	}
	const key = String( token ).toLowerCase();
	const base = `${ manifestPluginUrl }/build/shared/carbon-icons`;
	// Tokens the manifest knows are used as-is (bundle filenames are the
	// token). Unknown tokens get the legacy heuristic: older AWT content
	// stored single-dash names (arrow-right) for double-dash icons.
	const file = tokenKind[ key ] ? key : key.replace( /(?<!-)-(?!-)/g, '--' );
	// Size-independent icons sit in the bundle root, with no size directory.
	if (
		tokenKind[ key ] === 'glyph' ||
		( sizes && sizes.includes( 'glyph' ) )
	) {
		return `${ base }/${ file }.svg`;
	}
	const numeric = ( sizes || [] ).filter( ( s ) => typeof s === 'number' );
	const size = numeric.includes( 32 ) ? 32 : numeric[ 0 ] || 32;
	return `${ base }/${ size }/${ file }.svg`;
}

// Re-exported so other blocks (awt/icon, awt/button, awt/header-action, etc.)
// can render the same SVG preview in their edit.js as the chip uses.
export { iconPreviewUrl };

/**
 * @param {Object}   props
 * @param {string}   props.value             Current icon token (e.g., 'search').
 * @param {Function} props.onChange          Called with the chosen token, or '' on clear.
 * @param {string}   [props.label]           Inspector label.
 * @param {string}   [props.help]            Help text shown under the field.
 * @param {boolean}  [props.allowClear=true]
 */
export default function IconPicker( {
	value,
	onChange,
	label,
	help,
	allowClear = true,
} ) {
	const [ entries, setEntries ] = useState( null );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ query, setQuery ] = useState( '' );
	const containerRef = useRef( null );

	useEffect( () => {
		if ( ! isOpen || entries !== null ) {
			return;
		}
		let cancelled = false;
		loadManifest().then( ( manifest ) => {
			if ( cancelled ) {
				return;
			}
			const list = Object.entries( manifest.iconsByName || {} ).map(
				( [ name, meta ] ) => ( {
					name,
					label: meta.label || name,
					aliases: ( meta.aliases || [] ).map( ( a ) =>
						String( a ).toLowerCase()
					),
					category: meta.category || '',
					sizes: meta.sizes || [],
				} )
			);
			list.sort( ( a, b ) => a.name.localeCompare( b.name ) );
			setEntries( list );
		} );
		return () => {
			cancelled = true;
		};
	}, [ isOpen, entries ] );

	const filtered = useMemo( () => {
		if ( ! entries ) {
			return [];
		}
		const q = query.trim().toLowerCase();
		if ( ! q ) {
			return entries.slice( 0, 240 );
		} // cap initial render
		return entries
			.filter(
				( it ) =>
					it.name.includes( q ) ||
					it.label.toLowerCase().includes( q ) ||
					it.aliases.some( ( a ) => a.includes( q ) ) ||
					it.category.toLowerCase().includes( q )
			)
			.slice( 0, 240 );
	}, [ entries, query ] );

	const controlId = useInstanceId( IconPicker, 'awt-icon-picker' );

	return (
		<BaseControl
			__nextHasNoMarginBottom
			id={ controlId }
			label={ label || __( 'Icon', 'awt' ) }
			help={ help }
		>
			<div ref={ containerRef } className="awt-icon-picker__row">
				<button
					id={ controlId }
					type="button"
					onClick={ () => setIsOpen( ( v ) => ! v ) }
					className="awt-icon-picker__current"
					aria-label={
						value
							? __( 'Change icon (current:', 'awt' ) + value + ')'
							: __( 'Choose icon', 'awt' )
					}
				>
					{ value ? (
						<img
							src={ iconPreviewUrl( value, [ 32 ] ) }
							alt=""
							aria-hidden="true"
							className="awt-icon-picker__thumb"
							onError={ ( e ) => {
								e.currentTarget.style.visibility = 'hidden';
							} }
						/>
					) : (
						<span
							className="awt-icon-picker__thumb awt-icon-picker__thumb--empty"
							aria-hidden="true"
						/>
					) }
					<span className="awt-icon-picker__name">
						{ value || __( 'Choose an icon…', 'awt' ) }
					</span>
					<span
						className="awt-icon-picker__chevron"
						aria-hidden="true"
					>
						{ isOpen ? '▴' : '▾' }
					</span>
				</button>
				{ allowClear && value && (
					<Button
						variant="tertiary"
						onClick={ () => onChange( '' ) }
						className="awt-icon-picker__clear"
					>
						{ __( 'Clear', 'awt' ) }
					</Button>
				) }
			</div>
			{ isOpen && (
				<div
					style={ {
						marginTop: '0.5rem',
						border: '1px solid var(--wp-admin-theme-color, #2271b1)',
						borderRadius: 4,
						padding: '0.5rem',
						background: '#fff',
					} }
				>
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Filter icons', 'awt' ) }
						hideLabelFromVision
						placeholder={ __(
							'Search by name, alias, or category…',
							'awt'
						) }
						value={ query }
						onChange={ setQuery }
					/>
					{ entries === null ? (
						<div style={ { padding: '1rem', textAlign: 'center' } }>
							<Spinner /> { __( 'Loading icons…', 'awt' ) }
						</div>
					) : (
						<>
							<div
								style={ {
									display: 'grid',
									gridTemplateColumns:
										'repeat(auto-fill, minmax(40px, 1fr))',
									gap: '0.25rem',
									maxHeight: '20rem',
									overflowY: 'auto',
									marginTop: '0.5rem',
								} }
								role="listbox"
								aria-label={ __( 'Icon results', 'awt' ) }
							>
								{ filtered.map( ( it ) => (
									<button
										key={ it.name }
										type="button"
										title={ `${ it.label }\n${ it.name }${
											it.category
												? `\n${ it.category }`
												: ''
										}` }
										role="option"
										aria-selected={ it.name === value }
										onClick={ () => {
											onChange( it.name );
											setIsOpen( false );
										} }
										style={ {
											background:
												it.name === value
													? 'var(--wp-admin-theme-color, #2271b1)'
													: 'transparent',
											border: '1px solid #ddd',
											borderRadius: 4,
											padding: '0.25rem',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											cursor: 'pointer',
											minHeight: 40,
										} }
									>
										<img
											src={ iconPreviewUrl(
												it.name,
												it.sizes
											) }
											alt=""
											style={ {
												width: 20,
												height: 20,
												filter:
													it.name === value
														? 'invert(1)'
														: 'none',
											} }
											loading="lazy"
											onError={ ( e ) => {
												e.currentTarget.style.visibility =
													'hidden';
											} }
										/>
									</button>
								) ) }
							</div>
							<div
								style={ {
									marginTop: '0.5rem',
									fontSize: '0.75rem',
									color: 'var(--wp-color-foreground-secondary, #757575)',
								} }
							>
								{ entries.length > 0
									? `${
											filtered.length === 240
												? __( 'Showing first', 'awt' ) +
												  ' 240'
												: filtered.length
									  } / ${ entries.length } ${ __(
											'icons',
											'awt'
									  ) }`
									: __(
											'Manifest unavailable. Run `npm run build:icons` and reload.',
											'awt'
									  ) }
							</div>
						</>
					) }
				</div>
			) }
		</BaseControl>
	);
}
