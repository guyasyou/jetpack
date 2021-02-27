/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Button,
	ButtonGroup,
	PanelBody,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const widthUnits = [
	{ value: 'px', label: 'px', default: 150 },
	{ value: '%', label: '%', default: 100 },
	{ value: 'em', label: 'em', default: 10 },
];

const alignedWidthUnits = [
	{ value: 'px', label: 'px', default: 150 },
	{ value: 'em', label: 'em', default: 10 },
];

const predefinedWidths = [ '25%', '50%', '75%', '100%' ];

export default function ButtonWidthPanel( props ) {
	return (
		<PanelBody title={ __( 'Width settings', 'jetpack' ) }>
			<ButtonWidthControl { ...props } />
		</PanelBody>
	);
}

export function ButtonWidthControl( { align, width, onChange } ) {
	const [ unit, setUnit ] = useState( null );

	// Left and right aligned blocks are floated so % widths don't work as expected.
	const isAlignedLeftOrRight = align === 'left' || align === 'right';

	function handleChange( selectedWidth ) {
		// Check if we are toggling the width off.
		const newWidth = width === selectedWidth ? undefined : selectedWidth;

		// Update the units on the unit control.
		setUnit( '%' );
		onChange( newWidth );
	}

	return (
		<BaseControl label={ __( 'Button width', 'jetpack' ) }>
			<div
				className={ classnames( 'jetpack-button__width-settings', {
					'is-aligned': isAlignedLeftOrRight,
				} ) }
			>
				{ ! isAlignedLeftOrRight && (
					<ButtonGroup aria-label={ __( 'Percentage Width', 'jetpack' ) }>
						{ predefinedWidths.map( widthValue => {
							return (
								<Button
									key={ widthValue }
									isSmall
									isPrimary={ widthValue === width }
									onClick={ () => handleChange( widthValue ) }
								>
									{ widthValue }
								</Button>
							);
						} ) }
					</ButtonGroup>
				) }
				<UnitControl
					className="jetpack-button__custom-width"
					isResetValueOnUnitChange
					max={ width?.includes( '%' ) ? 100 : undefined }
					min={ 0 }
					onChange={ selectedWidth => onChange( selectedWidth ) }
					onUnitChange={ selectedUnit => setUnit( selectedUnit ) }
					size={ 'small' }
					units={ isAlignedLeftOrRight ? alignedWidthUnits : widthUnits }
					value={ width }
					unit={ unit }
				/>
			</div>
		</BaseControl>
	);
}
