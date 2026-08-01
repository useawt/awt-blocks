/**
 * Playwright config for AWT blocks e2e tests.
 *
 * Runs against the wp-env TESTS instance (localhost:8889) so the dev site's
 * content is never touched. Start it with `npm run env:start` first.
 */

const { defineConfig, devices } = require( '@playwright/test' );

module.exports = defineConfig( {
	testDir: './tests/e2e',
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [ [ 'github' ], [ 'list' ] ] : 'list',
	timeout: 120_000,
	globalSetup: require.resolve( './tests/e2e/global-setup.js' ),
	use: {
		baseURL: process.env.WP_BASE_URL || 'http://localhost:8889',
		// Deliberately NOT under test-results/: Playwright empties that
		// directory at the start of every run, so a second run starting while
		// one is in flight deleted the first one's login and failed it with
		// "ENOENT: storage-state.json". Keeping the login outside also keeps
		// its session cookie out of the CI failure artifacts.
		storageState: './.auth/storage-state.json',
		trace: 'retain-on-failure',
	},
	projects: [
		{
			name: 'e2e',
			testDir: './tests/e2e',
			use: { ...devices[ 'Desktop Chrome' ] },
		},
		{
			// Plugin-compatibility floor (Floor A) — heavier, own CI job.
			name: 'compatibility',
			testDir: './tests/compatibility',
			use: { ...devices[ 'Desktop Chrome' ] },
		},
	],
} );
