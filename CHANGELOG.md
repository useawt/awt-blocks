# Changelog

<!-- Authoring format (parsed by scripts/release.js at release time — see the
     Stage 1 spec, "Changelog communication"):

     ## <version> — <YYYY-MM-DD>
     ### [Severity]        one of: [Security] [A11y] [Breaking] [New] [Improvement]
     - One entry per bullet.

     markdownlint enforces the structure in CI. Newest release first.
     The Unreleased section accumulates entries between releases. -->

## Unreleased

### [Improvement]

- You can now put a Modal opener inside an Inline set, so a row of calls to
  action can mix buttons that open a dialog with buttons that follow a link.

## 2026.09.4 — 2026-09-09

### [Breaking]

- The size you pick for a Modal opener or a Menu button now changes the
  button, in the editor and on the page. Both stayed at the largest size
  whatever you chose. Each button carries one more class to do it, so custom
  CSS written against the old markup is worth checking.

## 2026.09.3 — 2026-09-08

### [Improvement]

- The header collapses to the menu button when the menu outgrows a header that
  is contained to the content width, not only when it outgrows the screen.
- A modal opens in the colours of the page, not of the section it was added
  to. One added inside a dark section opened dark on a light site.
- Every icon now previews in the editor. Some icons drew a blank space there
  while the published page showed them correctly.
- The editor shows the same external-link icon on a Footer link that the page
  does, instead of a typed arrow.

## 2026.09.2 — 2026-09-08

### [Improvement]

- A Section set wider than the content width now gets that width, on the page
  and in the editor. Picking "Wide" on a section in a page's content changed
  nothing, because the page layout was holding it to the content width.

- A Section's Content and Wide widths now follow the site's own layout
  settings instead of fixed sizes, so a section lines up with the page title
  and the breadcrumb above it. Narrow and Reading are unchanged — those are
  measures for text, not the page's layout.

- The Testimonial block's Attribution style now takes effect in the editor. The
  page laid the name and role out as chosen; the editor always showed them
  stacked.

### [A11y]

- The header now collapses to the menu button when the navigation does not
  fit, instead of at a fixed screen width. A long menu used to overflow — items
  wrapping and the last button cut off by the edge of the screen — while a short
  one was hidden behind the menu button with room to spare.
- Text typed into a URL field no longer becomes a broken link. On the Link,
  Button and Tile blocks, "Read more" in the URL field was turned into a link
  to a web address of that name; now nothing links to it, and the editor says
  the field does not hold an address.
- A clickable Tile that has a link inside it now renders as a plain tile, with
  that link still working. A link cannot contain another link, and browsers
  broke the tile apart when it did — the tile split in two with an empty box
  between and the link loose underneath. The editor now says so while you are
  building it.

## 2026.09.1 — 2026-09-08

### [A11y]

- Tabs now show the first tab's panel before any script runs, so the content is
  readable without JavaScript. Each tab is also linked to its panel in the
  markup rather than only after the page loads.
- A modal with no primary action label no longer renders an empty button. Leave
  the label blank when the modal holds a form with its own submit button.
- Keyboard focus now stays inside an open modal. A control the modal held but
  Tab could not reach — a hidden field taken out of the tab order — used to let
  focus walk out into the page behind it.
- A modal's dark overlay now covers the whole screen. It could sit slightly
  down the page, or be cropped to the content width when the modal was placed
  directly on a page.

### [Improvement]

- A style change now reaches people who have visited the site before. Block
  stylesheets were served under a web address that never changed, so a browser
  or host that had cached one kept serving the old file.

### [Breaking]

- The Tabs block's markup changed: the first usable tab renders selected and its
  panel renders visible.

## 2026.09.0 — 2026-09-03

### [A11y]

- Selectable and clickable tiles now have a visible border, so you can see the
  shape of the control before you choose it. Plain content tiles are unchanged.
  A "Carbon default" switch on the tile turns the border off.
- The fluid text field now previews in the editor the way it publishes.

### [New]

- WordPress now tells you when a new version of AWT Blocks is out, on
  Dashboard, Updates. You still install it yourself.

### [Improvement]

- Block descriptions, settings labels and help text across the editor are now
  written in plain language. The block spacing control is now "Space below",
  and lists its sizes in pixels first.

### [Breaking]

- Lists and preformatted blocks now get the same 24px gap below them as
  paragraphs. Before, they sat flush against the next block.

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
