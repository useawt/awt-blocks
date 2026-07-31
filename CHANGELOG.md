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

- Side nav: a side nav now sits below the header instead of on top of it. Side
  navs used to start at the very top of the screen, hiding the logo and site
  title behind them. The rendered markup gains one class (a deliberate snapshot
  update), and the block's description now describes the narrow-screen
  behavior.

- Side nav: the side nav works on a narrow screen. It used to open as a
  full-height panel over the content with no way to close it. Below 1056px the
  panel now steps aside — there is no room for it — and its links move into the
  header menu, behind the header's menu button, so nothing becomes unreachable.
  On a documentation site those links are the documentation. Opening the header
  menu shows them below the site's main menu items, separated by a rule, and
  they work with the keyboard exactly like the rest of that menu: Tab moves
  through them, Escape closes and returns you to the menu button. Above 1056px
  nothing changes. This needs the header to have a menu (the "Header
  navigation" block); all four header presets include one.

- Side nav: the "Mode" dropdown is now a "Show the side nav" switch, and
  "Default expanded" and "User can toggle" are gone from the block's settings.
  Of the four choices Mode offered, only two ever did anything: "Rail" and
  "Overlay" were never built, and picking either gave you a broken nav — Rail
  cut every link label off at 48px while leaving the links reachable by
  keyboard, and Overlay produced a nav that covered the site title. Both now
  render as the ordinary docked side nav. "Default expanded" had no effect
  either way, and "User can toggle" promised a button that did not exist; the
  narrow-screen behavior above replaces it, and it is always on rather than
  something you have to find and switch on. Side navs already on your site keep
  working and need no changes.

- Side nav link: a link with no icon no longer shows the first letter of its
  label in the icon slot. That letter existed only for "Rail" mode, which has
  been removed, and a single letter was never a usable icon. Links with an icon
  chosen are unchanged. (Deliberate snapshot update.)

- Side nav section: the "Default expanded" toggle is gone. It set a class no
  stylesheet defines — neither Carbon's nor the theme's — so both positions
  rendered the same thing. A section is a static group; there was nothing to
  expand. Sections already on your site keep working. (The rendered markup
  drops that class: deliberate snapshot update.)

- Side nav section: a section heading now names the list of links under it,
  so a screen reader announces "Get started, list" instead of an unnamed list
  of links. The heading was a visual label only — the grouping you can see was
  never passed on to people who cannot (WCAG 1.3.1, Info and Relationships).
  The rendered markup gains an `id` on the heading and an `aria-labelledby` on
  the list pointing at it (a deliberate snapshot update). Sections with no
  heading and the look of the nav are unchanged.

- Notification: the close button now works on the published page. Clicking
  it (or activating it with the keyboard) dismisses the notification — it
  disappears from the page and from the accessibility tree, matching the
  Carbon Design System's behavior. Before, the button rendered but did
  nothing. Notifications with "Hide close button" turned on are unchanged.
  The block's rendered markup gains Interactivity API attributes
  (deliberate snapshot update).

- Hero: the hero image now loads immediately with high priority instead of
  lazy-loading. The hero sits at the top of the page, so lazy-loading held
  back the page's largest paint (the LCP metric) and could hand the
  browser's high-priority hint to an image further down the page. The
  rendered markup changes from `loading="lazy"` to `loading="eager"
  fetchpriority="high"` — pages get faster with no visual change.

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

- Toggletip: the rendered markup now matches Carbon's reference structure
  (the pop-up lives in a popover container next to the trigger, with the
  label outside it). The pop-up gains Carbon's caret arrow and
  high-contrast styling, positions itself with CSS instead of JavaScript,
  and shifts to a placement that fits when the author's choice would push
  it off the screen edge. Content and settings are unchanged — only the
  generated HTML differs, so custom CSS targeting the old structure may
  need updating.

### [A11y]

- Accessibility checker: the heading-order checks (heading-level skips,
  illogical heading order) now see the heading a Statistic block emits
  when it's set to a heading level. Before, those headings were invisible
  to the checker even though they were real headings on the published
  page.

### [Improvement]

- Header brand: a logo you have set now shows without a second setting to
  find. When brand mode is left on the site default, the block shows the
  logo and prefix you have set, and just your site title when you have set
  neither. Its Prefix and Upload logo controls also stay available while
  they are still empty, so you can fill them in — before, they were hidden
  until the brand mode already included a logo, which meant there was no
  way to get there.

- A new build check keeps the block editor and the published page in step. Three
  bugs in one day came from a block putting different CSS classes on its markup
  in the editor than on the page, and each one only showed up in the editor —
  the published page was right every time, so nothing caught them. The check
  compares the two for every class the theme's stylesheet styles, and fails the
  build when they disagree. It found two more cases, in the Content switcher and
  Tabs blocks, which it reports every run until they are fixed.

- Side nav: opening a template in the Site Editor no longer draws the side nav
  over the page content. It now sits at the left with the content and footer
  starting to its right, the way the published page renders. Editing the header
  on its own was already correct; this was templates only.

- Side nav section: the editor now shows each section's links. In the Site
  Editor every section appeared as a title with nothing under it, whichever
  section it was — the links were there, drawn at no height. The section
  heading also now looks the same in the editor as on the published page.

- Footer section: the heading now looks the same in the Site Editor as in
  the published footer. The editor preview used its own smaller, tighter
  heading style instead of the theme's real footer heading style.

- Toggletip: a label with more than one word now stays on one line next to
  the info button instead of wrapping into a narrow column.

- The icon gallery now shows previews on every installed copy of the
  plugin. The picker's search grid loaded its preview images from a folder
  that only exists in development installs, so on a normal install every
  tile came up blank (the icons themselves still worked on the published
  page). Previews now come from the icon set bundled with the plugin. The
  nine size-independent icons (`caution`, `circle-fill`, and friends) also
  preview correctly for the first time, and plugin builds now produce the
  same icon set on every operating system.

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
