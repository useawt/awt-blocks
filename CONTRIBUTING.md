# Contributing to AWT Blocks

Thank you for helping. AWT Blocks is the block plugin for the accessibility-first AWT
theme, so every change has to keep the blocks at least as accessible as they
were before.

## Report a problem

- **Something broken:** open a
  [bug report](https://github.com/useawt/awt-blocks/issues/new?template=bug.yml).
- **Something hard or impossible to use** with a keyboard, screen reader,
  zoom or other assistive technology: open an
  [accessibility problem](https://github.com/useawt/awt-blocks/issues/new?template=accessibility.yml).
- **A security problem:** do not open an issue. Email
  [hello@useawt.com](mailto:hello@useawt.com) instead.
- **A problem with templates, styles or AWT Settings:** report it in
  [AWT Theme](https://github.com/useawt/awt-theme/issues). Those live there.

## Before you change code

For anything bigger than a small fix, open an issue first and describe what
you want to change. That saves you work on something we would not merge.

The plugin and [AWT Theme](https://github.com/useawt/awt-theme) are released
together under the same version number. If your change needs both, open a pull
request in each and link them to each other.

## Set up

Follow the [development setup](README.md#development-setup) in the README. It
starts a WordPress site with both the theme and this plugin. Also run
`composer install` for the PHP checks.

## Build before you test

Block code in `src/` is built into `build/`, with the comments removed. So:

- Edit files in `src/` and write your explanations there, as long as they need
  to be.
- Run `npm run build` (or `npm start` to rebuild as you edit) before you look
  at a change. Without it you are testing the old code.
- Never edit `build/` by hand. The next build overwrites it.

## Adding or changing a block

- Match the [Carbon Design System](https://carbondesignsystem.com/) component:
  the same HTML structure in `render.php` and `edit.js`, checked in the
  default, hover, focus and active states.
- A block's Carbon styles come from its own `style.scss`, which uses only the
  Carbon partials the block needs, listed in `carbonStyles` in `block.json`.
  `npm run check:carbon-styles` checks that the two match.
- A new block, variant or style needs an example in
  `tests/e2e/fixture-pages.js` in the same pull request. The browser tests
  only cover what the examples contain.

## What every change must keep

- **Accessibility.** Every control has an accessible name, works with the
  keyboard, and shows a visible focus indicator. Colour is never the only way
  something is shown. Text meets WCAG AA contrast (4.5:1, or 3:1 for large
  text) and controls meet 3:1. Targets are at least 24 by 24 CSS pixels.
  Motion respects `prefers-reduced-motion`.
- **Light and dark mode.** Use the existing colour tokens instead of fixed
  colour values, and check your change in both modes.
- **Plain language.** Anything a site owner or visitor reads is short and
  clear, with no unexplained jargon. Keep real terms such as `aria-label` or
  alt text, and explain them briefly if needed.
- **Nothing from AWT Premium.** Code for the paid add-on does not belong here.
  A check runs on every commit and in CI.

## Run the checks

```bash
npm run lint:js
npm run lint:php
npm run lint:md
npm run test:unit
npm run check:carbon-styles
npm run check:class-parity
npm run check:assets
npm run test:php     # PHP tests and render snapshots
npm run test:e2e     # browser tests: axe, styles, focus, accessibility tree
```

`test:php` and `test:e2e` need the development site running. Run `test:e2e`
after `test:php`, not before: the PHP tests reset the test site.

If you changed a block's output on purpose, update the snapshots with
`npm run test:php:update` (and `UPDATE_SNAPSHOTS=1` for the browser tests).
Read the diff before you commit it: a snapshot only proves the output did not
change, not that it is right.

A pull request can only be merged when CI passes.

## Changelog

If a site owner would notice your change, add one line to `CHANGELOG.md` under
`## Unreleased` at the top (add that heading if it is not there). Put it under
one of these tags:

| Tag | Use it for |
| --- | --- |
| `[Security]` | A security fix |
| `[A11y]` | A change to what people using assistive technology get, including changes only screen readers notice |
| `[Breaking]` | The site renders differently than before, or a block or block feature is discontinued or deprecated |
| `[New]` | A new block, feature or setting |
| `[Improvement]` | Any other fix or improvement a site owner would notice |

Say what changed in one or two plain sentences. The maintainer checks every
entry and tag before a release.

## Commit messages

One short line that says what changed, for example `Fix focus ring on
accordion headers`. No reasons, no plans, no build steps. The history is public.

## Licence

AWT Blocks is licensed under GPL-3.0-or-later. By contributing, you agree that
your contribution is licensed the same way.
