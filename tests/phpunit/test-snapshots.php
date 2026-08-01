<?php
/**
 * Attribute-evolution snapshot tests (spec: "Attribute-evolution contract").
 *
 * Every fixture in tests/snapshots/fixtures/ (saved block markup captured
 * from the Stage 1 showcase + dogfood pages) is rendered through the current
 * code and compared byte-for-byte against the committed snapshot in
 * tests/snapshots/rendered/. A diff means a code change altered the rendered
 * output of EXISTING saved content — which rule #2 of the contract forbids
 * unless it's deliberate.
 *
 * When a change is intentional, regenerate and commit the snapshots:
 *
 *   npm run test:php:update
 *
 * …and call the release [Breaking] per contract rule #5.
 *
 * Use that script, not `UPDATE_SNAPSHOTS=1 npm run test:php`: the tests run
 * inside the wp-env container, and a variable set on the host side of that
 * command never reaches PHP — the run just repeats the failure it was meant
 * to resolve, which reads as "regenerating didn't work".
 *
 * Generated ids (unique_id() counters) are canonicalized before comparison,
 * so test ordering can't cause false diffs while aria-controls/labelledby
 * pairs still must stay consistent.
 *
 * @package AWT\Blocks
 */

/**
 * Renders every snapshot fixture and diffs against the committed render.
 */
class Test_Snapshots extends WP_UnitTestCase {

	/**
	 * Fixture files, one data-provider row each.
	 *
	 * @return array[] [ fixture-basename => [ basename ] ].
	 */
	public function fixture_files(): array {
		$rows = array();
		foreach ( glob( $this->fixtures_dir() . '/*.html' ) as $path ) {
			$base          = basename( $path, '.html' );
			$rows[ $base ] = array( $base );
		}
		ksort( $rows );
		return $rows;
	}

	/**
	 * Fixtures directory (saved block markup).
	 */
	private function fixtures_dir(): string {
		return dirname( __DIR__ ) . '/snapshots/fixtures';
	}

	/**
	 * Committed-snapshot directory (rendered HTML).
	 */
	private function rendered_dir(): string {
		return dirname( __DIR__ ) . '/snapshots/rendered';
	}

	/**
	 * Canonicalize unavoidable per-process variance so snapshots are stable:
	 * unique_id()/wp_unique_id() counters depend on how many blocks rendered
	 * earlier in the process. Every `awt-…-N` token is renumbered by order of
	 * first appearance, which preserves id/aria-controls pairing.
	 *
	 * @param string $html Rendered HTML.
	 * @return string Canonical form.
	 */
	private function canonicalize( string $html ): string {
		$map = array();
		$out = preg_replace_callback(
			// Generated ids come from unique_id( 'awt-…' ) and never contain
			// a double dash; stable numeric classes (awt-spacing-05,
			// awt-feature-grid--cols-3) must NOT be canonicalized.
			'/\bawt-(?!spacing-)[a-z][a-z-]*-\d+\b/',
			static function ( array $m ) use ( &$map ): string {
				if ( str_contains( $m[0], '--' ) ) {
					return $m[0]; // Modifier class, not a generated id.
				}
				if ( ! isset( $map[ $m[0] ] ) ) {
					$prefix       = preg_replace( '/-\d+$/', '', $m[0] );
					$map[ $m[0] ] = $prefix . '-{' . count( $map ) . '}';
				}
				return $map[ $m[0] ];
			},
			$html
		);
		// Normalize trailing whitespace per line + ensure single trailing newline.
		$out = preg_replace( '/[ \t]+$/m', '', (string) $out );
		return rtrim( (string) $out ) . "\n";
	}

	/**
	 * Render a fixture and compare to (or write) its committed snapshot.
	 *
	 * @dataProvider fixture_files
	 *
	 * @param string $base Fixture basename (no extension).
	 */
	public function test_fixture_render_matches_snapshot( string $base ) {
		$fixture  = $this->fixtures_dir() . '/' . $base . '.html';
		$snapshot = $this->rendered_dir() . '/' . $base . '.snap.html';

		$rendered = $this->canonicalize( do_blocks( file_get_contents( $fixture ) ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local test fixture.

		if ( getenv( 'UPDATE_SNAPSHOTS' ) || ! file_exists( $snapshot ) ) {
			file_put_contents( $snapshot, $rendered ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- test harness writing its own snapshot.
			if ( ! getenv( 'UPDATE_SNAPSHOTS' ) ) {
				$this->fail(
					"Snapshot created for {$base} — review + commit tests/snapshots/rendered/{$base}.snap.html, then re-run."
				);
			}
			$this->assertFileExists( $snapshot );
			return;
		}

		$expected = file_get_contents( $snapshot ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local committed snapshot.
		$this->assertSame(
			$expected,
			$rendered,
			"Rendered output for '{$base}' drifted from the committed snapshot. If this change is DELIBERATE, regenerate with UPDATE_SNAPSHOTS=1, commit the diff, and mark the release [Breaking] (attribute-evolution contract rules #2/#5)."
		);
	}
}
