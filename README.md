# AWT Blocks

Accessible Gutenberg blocks built on the [Carbon Design System](https://carbondesignsystem.com/),
for the [AWT theme](https://github.com/useawt/awt-theme).
Part of the AWT project: an accessibility-first WordPress theme + blocks,
free and GPL.

**Status: released.** Download the latest version from
[Releases](https://github.com/useawt/awt-blocks/releases); installed sites are offered
updates in WordPress's own Updates screen. AWT is not distributed through the
WordPress.org directory.

## Development setup

Requirements: Node 20+, Docker (any runtime — Docker Desktop, Colima, OrbStack).

The theme and blocks repos are developed in lockstep and expect to be cloned
side by side:

```bash
git clone https://github.com/useawt/awt-theme.git
git clone https://github.com/useawt/awt-blocks.git
cd awt-blocks
npm install
npm run build
npm run env:start     # WordPress at http://localhost:8888 (admin / password)
npm run env:seed      # import the showcase + demo content (once)
```

The wp-env site mounts this plugin and the sibling `../awt-theme` theme
directly — edits to PHP and theme CSS apply on reload. JS/block changes need
a rebuild:

```bash
npm run build         # or: npm start (watch mode)
```

Other commands: `npm run env:stop`, `npm run env:destroy`,
`npm run lint:js`, `npm run test:unit`, `npm run check:premium`.

## License

GPL-3.0-or-later
