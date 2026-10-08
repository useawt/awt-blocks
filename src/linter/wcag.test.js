/**
 * Tests for the WCAG contrast math (JS port of awt-theme/inc/contrast.php).
 * Reference ratios cross-checked against the WCAG 2.x formula: black/white
 * is exactly 21:1, identical colors are exactly 1:1.
 */

import {
	hexToRgb,
	rgbStringToRgb,
	relativeLuminance,
	ratio,
	alphaOf,
} from './wcag';

describe( 'hexToRgb', () => {
	test( 'parses 6-digit hex with and without #', () => {
		expect( hexToRgb( '#ff0000' ) ).toEqual( [ 255, 0, 0 ] );
		expect( hexToRgb( '161616' ) ).toEqual( [ 22, 22, 22 ] );
	} );

	test( 'expands 3-digit shorthand', () => {
		expect( hexToRgb( '#fff' ) ).toEqual( [ 255, 255, 255 ] );
		expect( hexToRgb( '#abc' ) ).toEqual( [ 170, 187, 204 ] );
	} );

	test( 'drops the alpha channel of 8-digit hex', () => {
		expect( hexToRgb( '#ff000080' ) ).toEqual( [ 255, 0, 0 ] );
	} );

	test( 'rejects garbage', () => {
		expect( hexToRgb( 'not-a-color' ) ).toBeNull();
		expect( hexToRgb( '#12' ) ).toBeNull();
		expect( hexToRgb( 42 ) ).toBeNull();
		expect( hexToRgb( null ) ).toBeNull();
	} );
} );

describe( 'rgbStringToRgb', () => {
	test( 'parses rgb() and rgba() with comma or space separators', () => {
		expect( rgbStringToRgb( 'rgb(255, 0, 0)' ) ).toEqual( [ 255, 0, 0 ] );
		expect( rgbStringToRgb( 'rgba(22, 22, 22, 0.5)' ) ).toEqual( [
			22, 22, 22,
		] );
		expect( rgbStringToRgb( 'rgb(1 2 3)' ) ).toEqual( [ 1, 2, 3 ] );
	} );

	test( 'rejects non-rgb strings', () => {
		expect( rgbStringToRgb( '#ff0000' ) ).toBeNull();
		expect( rgbStringToRgb( 'hsl(0, 100%, 50%)' ) ).toBeNull();
	} );
} );

describe( 'relativeLuminance', () => {
	test( 'black is 0, white is 1', () => {
		expect( relativeLuminance( [ 0, 0, 0 ] ) ).toBe( 0 );
		expect( relativeLuminance( [ 255, 255, 255 ] ) ).toBeCloseTo( 1, 10 );
	} );
} );

describe( 'ratio', () => {
	test( 'black on white is 21:1 regardless of argument order', () => {
		expect( ratio( '#000000', '#ffffff' ) ).toBeCloseTo( 21, 5 );
		expect( ratio( '#ffffff', '#000000' ) ).toBeCloseTo( 21, 5 );
	} );

	test( 'identical colors are 1:1', () => {
		expect( ratio( '#161616', '#161616' ) ).toBeCloseTo( 1, 10 );
	} );

	test( 'mixed hex and rgb() inputs work', () => {
		expect( ratio( 'rgb(0,0,0)', '#ffffff' ) ).toBeCloseTo( 21, 5 );
	} );

	test( 'Carbon text on white passes AA (sanity anchor for check #12)', () => {
		// --cds-text-primary (#161616) on white: ~17.4:1, comfortably ≥ 4.5.
		expect( ratio( '#161616', '#ffffff' ) ).toBeGreaterThan( 4.5 );
	} );

	test( 'unparseable input returns null, not NaN', () => {
		expect( ratio( 'banana', '#fff' ) ).toBeNull();
		expect( ratio( '#fff', undefined ) ).toBeNull();
	} );
} );

describe( 'see-through colors', () => {
	test( 'alphaOf reads rgba() and 8-digit hex', () => {
		expect( alphaOf( 'rgba(22, 22, 22, 0.4)' ) ).toBeCloseTo( 0.4 );
		expect( alphaOf( '#16161640' ) ).toBeCloseTo( 0.251, 2 );
		expect( alphaOf( '#161616' ) ).toBe( 1 );
		expect( alphaOf( 'rgb(22, 22, 22)' ) ).toBe( 1 );
	} );

	test( 'a see-through text color is mixed with the background first', () => {
		// Carbon White's placeholder text paints as about #a2a2a2 on white.
		const r = ratio( 'rgba(22, 22, 22, 0.4)', '#ffffff' );
		expect( r ).toBeGreaterThan( 2.5 );
		expect( r ).toBeLessThan( 2.65 );
		// Judged as solid it would have been 18.1:1.
		expect( ratio( '#16161640', '#ffffff' ) ).toBeLessThan( 2 );
	} );
} );
