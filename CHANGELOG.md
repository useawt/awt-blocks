# Changelog

<!-- Authoring format (parsed by scripts/release.js at release time — see the
     Stage 1 spec, "Changelog communication"):

     ## <version> — <YYYY-MM-DD>
     ### [Severity]        one of: [Security] [A11y] [Breaking] [New] [Improvement]
     - One entry per bullet.

     markdownlint enforces the structure in CI. Newest release first.
     The Unreleased section accumulates entries between releases. -->

## Unreleased

### [Breaking]

- Paragraphs and headings now carry Carbon's editorial rhythm by default.
  The Spacing (bottom margin) default changes from 16px to 24px
  (spacing-06) for paragraphs, and from "None (theme default)" to 16px
  (spacing-05) for headings. Paragraph gaps grow by 8px wherever the
  author never chose a spacing value; heading gaps look the same as
  before (the theme's block gap already produced 16px), but the value is
  now explicit in the heading's own Spacing setting. Any spacing an
  author picked by hand is kept. To restore the old paragraph rhythm on
  a page, set those paragraphs' Spacing to spacing-05.

- Section: a full-width section now keeps at least the site's global side
  padding around its content. Before, on screens narrower than the content
  column, a full-width section's text could sit almost against the screen
  edge when its horizontal padding was a small spacing step (spacing-01 is
  2px). A larger padding choice still wins — only sections whose padding
  was below the site's global padding change, and only on narrow screens.
  (Breaking because the rendered padding style changes for full-width
  sections.)

- Statistic: the label under the number is now plain text (`<p>`) by
  default instead of an `<h4>`. A stat's label captions the number rather
  than starting a page section, and the old default created heading-level
  skips (H2 → H4) on most pages — including the shipped Stats bar pattern.
  Existing stats that never set a heading level pick up the new default
  automatically; choose "Heading 2–6" in the block's settings if your
  statistic really does start a section.

### [A11y]

- Accessibility checker: the heading-order checks (heading-level skips,
  illogical heading order) now see the heading a Statistic block emits
  when it's set to a heading level. Before, those headings were invisible
  to the checker even though they were real headings on the published
  page.

### [Improvement]

- Toggletip: a label with more than one word now stays on one line next to
  the info button instead of wrapping into a narrow column.

- Icons now render on every installed copy of the plugin. The Icon block
  (and the icons other blocks draw) read Carbon's SVG files from disk;
  installed copies were missing all but ten built-in fallbacks, so icons
  showed as placeholder text like `[image]`. The plugin now bundles the
  full icon set the picker offers (about 1.2 MB), and nine icons that
  Carbon publishes without a size variant (`caution`, `circle-fill`, and
  friends) render correctly for the first time.
- Side nav: the block no longer appears in the inserter while you edit a
  post or page. It is site chrome — it docks to the left edge of the
  screen, next to the header — so inside page content it covered the page
  instead of sitting where you placed it. Add it in the Site Editor (for
  example the "Side navigation" template part), where it still works as
  before. Pages that already contain one keep rendering and stay
  editable.
- Sample content (the dev-environment seed and the render-test fixtures)
  now carries the theme's revised pattern placeholder copy: plainer
  language with no "ship" wording or em dashes. No block's own output
  changes.
- Section: the "Light (active light variant)" and "Dark (active dark
  variant)" theme-scope choices now work. They resolve to the paired scope
  of the active style variation (for example White + g90 → dark sections
  use g90) on the published page and in the editor preview. Previously
  they emitted a class no stylesheet defined, so the option did nothing.

### [New]

- Section: new "Reading (48rem)" max width option, between Narrow and
  Content. It matches the reading measure the theme gives paragraphs, so a
  whole section — headings, images, everything — can line up with the text
  column. Good for long-form pages like articles and documentation.
- Section: new "No gap below" switch (Layout panel). Turn it on and the
  section sits flush against whatever comes next — no bottom margin — so
  full-width color bands can stack without a seam of page background
  between them. While it's on, the Spacing setting is hidden (the switch
  overrides it); turn it off and your chosen spacing comes back.
- Button: new "Submit the form" toggle. Turn it on for the button that
  sends a form (place the button inside a Form block) and it renders as a
  real submit button. Before, this setting wasn't registered, so the
  buttons in the shipped form patterns (Form, Login, Contact form,
  Newsletter signup) did nothing when clicked — those patterns now submit
  correctly. Buttons that don't use the toggle render exactly as before.

- Initial Stage 1 release of the AWT blocks plugin: the full Carbon
  component inventory as WordPress blocks (58 blocks), per-block CSS
  loading, the in-editor accessibility linter with WCAG 2.2 AA checks, the
  Accessibility inspector panel, per-page language override, and the
  Carbon spacing control on core blocks.
