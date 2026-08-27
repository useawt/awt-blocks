# Changelog

<!-- Authoring format (parsed by scripts/release.js at release time — see the
     Stage 1 spec, "Changelog communication"):

     ## <version> — <YYYY-MM-DD>
     ### [Severity]        one of: [Security] [A11y] [Breaking] [New] [Improvement]
     - One entry per bullet.

     markdownlint enforces the structure in CI. Newest release first.
     The Unreleased section accumulates entries between releases. -->

## Unreleased

## 2026.08.0 — 2026-08-25

The first public release of AWT Blocks.

### [New]

- **First release.** The Carbon Design System as WordPress blocks — 58 of them,
  from buttons and form fields to tabs, accordions, data tables, notifications
  and modals.
- An accessibility checker in the editor that flags WCAG 2.2 AA problems while
  you write, plus an Accessibility panel on every block.
- Each block loads only its own CSS, so a page carries the styles it uses and
  nothing more.
- Carbon's spacing scale on core WordPress blocks, so ordinary paragraphs and
  headings line up with everything else.
- A per-page language setting, for a page written in a different language from
  the rest of the site.
- Forms that submit: put a Button inside a Form block and turn on **Submit the
  form**.
- **Tile group**, a new block that turns selectable tiles into one real choice
  with a heading saying what is being chosen.
- Licensed GPLv3 or later. That matters only if you redistribute the plugin or
  build on its code — using it on your site is unaffected.

### [A11y]

- Dropdown works from the keyboard the way a dropdown should: arrow keys move
  the highlight, Home and End jump to the ends, Enter picks, Escape closes. Type
  a letter to jump to a choice.
- Selectable tiles sharing a group name are one real radio group. One press of
  Tab reaches the whole group, the arrow keys move between tiles, and the choice
  submits with the form.
- Text and Password fields show their error message under the field. It used to
  be written into the page for screen readers but never displayed, so anyone
  filling the form in by eye saw a red outline and no explanation.
- Select shows an error icon as well as the red outline, and screen readers now
  count its options correctly.
- Wide data tables and code snippets can be scrolled with the keyboard, and say
  which one you have entered.
- A checkbox set to **Indeterminate** really is partially checked — it shows the
  dash, and screen readers say so.
- The light/dark toggle names the mode it switches to, says whether that mode is
  on, announces the change, and keeps several toggles on one page in step.
- Modal: leaving the second button's label empty removes the button instead of
  drawing an empty one.
- A Statistic's label is plain text rather than a heading, so statistics stop
  creating heading-level skips.
- A Notification's close button works on the published page.
- Breadcrumbs, a lone FAQ question, and side navigation sections all announce
  correctly to screen readers.
