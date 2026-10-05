import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	RichText,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import PremiumNotice from '../shared/premium-notice';

export default function Edit( { attributes, setAttributes } ) {
	const { value, heading, description, level, align } = attributes;
	const HeadingTag = level === 'none' ? 'p' : `h${ level }`;

	const blockProps = useBlockProps( {
		className: `awt-stat awt-stat--align-${ align }`,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Statistic', 'awt-blocks' ) }>
					<SelectControl
						label={ __( 'Heading level', 'awt-blocks' ) }
						help={ __(
							'The label under the number is plain text by default. Pick a heading level only when the statistic starts a new section of the page.',
							'awt-blocks'
						) }
						value={ level }
						options={ [
							{
								value: 'none',
								label: __(
									'Not a heading (default)',
									'awt-blocks'
								),
							},
							{
								value: '2',
								label: __( 'Heading 2', 'awt-blocks' ),
							},
							{
								value: '3',
								label: __( 'Heading 3', 'awt-blocks' ),
							},
							{
								value: '4',
								label: __( 'Heading 4', 'awt-blocks' ),
							},
							{
								value: '5',
								label: __( 'Heading 5', 'awt-blocks' ),
							},
							{
								value: '6',
								label: __( 'Heading 6', 'awt-blocks' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { level: v } ) }
					/>
					<SelectControl
						label={ __( 'Alignment', 'awt-blocks' ) }
						value={ align }
						options={ [
							{
								value: 'start',
								label: __( 'Start', 'awt-blocks' ),
							},
							{
								value: 'center',
								label: __( 'Center', 'awt-blocks' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { align: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Trend line', 'awt-blocks' ) }
					initialOpen={ false }
				>
					<PremiumNotice
						feature="sparkline"
						attributes={ attributes }
						setAttributes={ setAttributes }
						title={ __( 'Trend line', 'awt-blocks' ) }
						description={ __(
							'Show a small line of how the number has changed, under it. Available in AWT Premium.',
							'awt-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<RichText
					tagName="span"
					className="awt-stat__value"
					value={ value }
					onChange={ ( v ) => setAttributes( { value: v } ) }
					placeholder={ __( '90%', 'awt-blocks' ) }
					allowedFormats={ [] }
				/>
				{
					// Anything another plugin shows beside the number, such as
					// AWT Premium's trend line; nothing in free AWT.
					applyFilters( 'awt.statAfterValue', null, attributes )
				}
				<RichText
					tagName={ HeadingTag }
					className="awt-stat__heading"
					value={ heading }
					onChange={ ( v ) => setAttributes( { heading: v } ) }
					placeholder={ __(
						'Heading describing the statistic',
						'awt-blocks'
					) }
					allowedFormats={ [ 'core/bold', 'core/italic' ] }
				/>
				<RichText
					tagName="p"
					className="awt-stat__description"
					value={ description }
					onChange={ ( v ) => setAttributes( { description: v } ) }
					placeholder={ __( 'Description (optional)', 'awt-blocks' ) }
					allowedFormats={ [
						'core/bold',
						'core/italic',
						'core/link',
					] }
				/>
			</div>
		</>
	);
}
