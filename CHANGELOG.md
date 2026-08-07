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

- Selectable tiles with a group name render differently. Each one is now a hidden
  radio button plus the tile as its label, instead of one box carrying the state
  itself. Existing pages keep working and need no edits, but custom CSS or
  JavaScript that targeted the tile's own `role` or `aria-checked` should target
  the radio button instead. Tiles without a group name are unchanged. This is a
  deliberate snapshot update; the reason it matters is under [A11y].

- Select: a field marked as having an error renders one extra icon, and its
  inner wrapper gains a `data-invalid` marker. Nothing was renamed, so existing
  CSS and JavaScript keep working. This is a deliberate snapshot update; the
  reason it matters for people using the block is under [A11y].

- Dropdown: each choice in the list is now a plain element instead of a button,
  and carries an id and its value. If you wrote your own CSS or JavaScript
  targeting the button inside a Dropdown choice, point it at the choice itself.
  The class names are unchanged, so styling by class still applies. This is a
  deliberate snapshot update; the reason it matters for people using the block
  is under [A11y].

- Form fields now draw their border on all four sides. Text input, Text area,
  Password input, Select and Dropdown used to be marked out by a shaded fill
  with one line under the text, which left the field's shape resting on that
  single line: the fill differs from the page by only 1.10 to 1 in light mode
  and 1.20 to 1 in dark, and in forced-colors mode it is replaced altogether.
  The border is the same color the line already used, so it clears the 3 to 1
  contrast that user-interface components need, in both modes. Each of the five
  blocks gains a **Carbon default** setting under **Style**: turn it on and that
  field goes back to the one-line look. Focus and error states are unchanged,
  and a disabled field still shows no border. Text areas are 1px taller. The
  rendered markup changes, which is a deliberate snapshot update.

- Read-only Text input and Text area fields now use the same border color as
  editable ones. A read-only field has no shaded fill, so its border is the only
  thing showing where the field is, and the paler color it used to have was too
  faint to see (1.32 to 1 against the page). You can still tell a read-only
  field at a glance: an editable field is a filled box, a read-only one is an
  outline, and a disabled one is a fill with no edge. Unaffected by
  **Carbon default**.

- Color scheme toggle: the toggle now says which mode it turns on and whether
  that mode is on. It used to be called "Light mode / Dark mode", which told a
  screen reader user neither. It is now a toggle button named after the mode it
  turns on, with an on or off state that a screen reader reads on focus and
  again on every press. The "Icon with label" version shows that same name
  instead of always showing the light-mode one. If you renamed the labels, your
  wording is kept. The icon follows the same state, and both icons are now
  Carbon's own: a sun in light mode and a crescent in dark mode, where it used
  to be one hand-drawn sun in both. The rendered markup changes, which is a
  deliberate snapshot update.

- Breadcrumb: screen readers now announce the breadcrumb as "Breadcrumbs"
  instead of "Breadcrumb". This is the block's default accessible name, so it
  changes only breadcrumbs that never had a name set by hand; anything you typed
  into "Accessible name (aria-label)" is untouched. The rendered markup changes,
  which is a deliberate snapshot update.

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

- Text input and Password input: an error message now appears under the field.
  Until now it was written into the page but never shown, so a visitor who
  filled the field in wrongly saw a red outline and an icon and was never told
  what the problem was. Screen readers did read the message out, so this
  affected people reading the screen. Text area and Select were already correct.
  Warning messages were always shown. The rendered markup changes, which is a
  deliberate snapshot update, but only for a field that is in error: a valid
  field renders exactly as before.

- Select: a field with an error now shows an error icon inside it. Until now the
  error was drawn as a red outline and nothing else, so anyone who does not see
  red had only the message below the field to go on. Worse, the focus indicator
  takes the place of that outline, so tabbing into the field removed the last
  mark of the error at the exact moment you were about to use it. The icon is
  the one Carbon draws on its own selects, and it stays put whether the field is
  focused or not. The rendered markup changes, which is a deliberate snapshot
  update.

- Selectable tiles that belong together are now one real choice. Tiles sharing a
  group name were each announced as a radio button that belonged to nothing: a
  screen reader never said what the choice was about, every tile was its own stop
  when tabbing, and the arrow keys did nothing. They are now built the way the
  browser builds a set of radio buttons, so one press of Tab reaches the whole
  group, the arrow keys move between the tiles, choosing one clears the rest, and
  the choice can be submitted with a form — which it could not be before, because
  the tiles carried no value at all. Selected tiles also show the check mark
  Carbon designed for them, so the state is not carried by colour alone.

- New block: **Tile group**. Put selectable tiles inside it and the choice gets a
  heading that says what is being chosen, which is the part a screen reader
  announces first. There is a **Value** field on each tile for what it sends when
  a form is submitted.

- Dropdown: you can type to pick a choice. A screen reader tells people this
  dropdown can be typed into — that comes with the kind of control it is — but
  typing did nothing, so the instruction was a dead end for exactly the people
  who were given it. Type a letter and the list opens on the first choice
  starting with it; keep typing to narrow it down, or press the same letter again
  to step through the choices that share it. Pause for half a second and the next
  letter starts a fresh search. A letter that matches nothing leaves your place
  alone instead of clearing it, and shortcuts like Ctrl+R still reach the browser.

- Dropdown: the choices are no longer buttons, and the keyboard works the way a
  dropdown should. Each choice used to be a button inside the list, which put a
  control inside a control: a screen reader read every choice twice, once as a
  choice and again as a button, and pressing Tab walked you into the open list
  instead of past the field. Now the choices are plain text, focus stays on the
  field the whole time, and the arrow keys move the highlight — Home and End
  jump to the first and last choice, Enter picks the highlighted one, and Escape
  closes the list without changing your answer. Re-opening the list puts the
  highlight back on what you already chose. Nothing about how it looks changes.

- A partially-checked Checkbox now really is partially checked. The block has
  had an **Indeterminate** setting all along, but nothing acted on it: the
  checkbox drew as an ordinary empty one, and a screen reader said "not
  checked". It now shows the dash Carbon designed for that state and announces
  itself as partially checked, in the editor and on the published page. The
  state clears the first time someone ticks the box, which is what you want from
  a "select all" checkbox.

- Color scheme toggle: switching between light and dark is announced. There was
  already a polite announcement, but it was built at the moment it was used,
  and a screen reader only reads out a region that was already on the page, so
  the first press was silent. The region is now on the page from the start,
  empty, and the message is a sentence ("Dark mode on") rather than a bare
  label.

- Color scheme toggle: the "Segmented" version marks which of Light, Auto and
  Dark is on. It was three plain buttons with nothing saying which one you were
  using. The one in use is now filled, bold and underlined, and screen readers
  read it as pressed.

- Color scheme toggle: a visitor who has chosen a mode before now gets the
  right state in the page as it arrives, instead of the toggle briefly claiming
  the opposite.

- Color scheme toggle: when a page has more than one toggle, they all update
  together instead of disagreeing about the current mode.

- FAQ question: a question placed on its own is no longer announced as a
  broken list. The block always produced a list item, which is right inside
  an accordion but wrong on its own, where a screen reader meets a list item
  with no list around it. On its own it is now a plain container, which looks
  and behaves exactly the same. Inside an accordion nothing changes. (This
  changes the rendered HTML of existing pages, so the release is marked
  breaking, but no page looks different.)

- Accessibility checker: the heading-order checks (heading-level skips,
  illogical heading order) now see the heading a Statistic block emits
  when it's set to a heading level. Before, those headings were invisible
  to the checker even though they were real headings on the published
  page.

- Code snippet: a multi-line snippet wider than the space it has can now be
  scrolled with the keyboard. The snippet was already a tab stop, but on the
  wrong box: the multi-line variant scrolls the code itself, one level below the
  area that was focusable, so a keyboard user could focus the snippet and still
  not reach the code past the right edge (WCAG 2.1.1). The tab stop now sits on
  whatever actually scrolls, which differs between the single-line and
  multi-line variants, and neither carries a tab stop that does nothing. Arrow
  keys scroll it, and it draws the theme's usual focus ring. The rendered markup
  changes, which is a deliberate snapshot update.

- Data table: a table too wide for the space it has can now be scrolled with
  the keyboard. Such a table scrolls sideways, but the scrolling area could not
  be focused, so anyone without a mouse or a touch screen could not reach the
  columns past the right edge and simply could not read them (WCAG 2.1.1). The
  area is now a tab stop, it takes its name from the table's caption so a
  screen reader says which table you have entered, and the theme draws its
  usual focus ring around it. Arrow keys scroll it. Tables that fit gain one
  tab stop and nothing else. The rendered markup changes, which is a deliberate
  snapshot update.

- Select: screen readers now count the options correctly. The placeholder
  ("Choose…") was put in the list as a hidden option, and a browser leaves a
  hidden option out of the list you see while still handing it to a screen
  reader. So a select offering four choices was read out as "3 of 5", and every
  select was off by one. The placeholder is now an ordinary first option, in
  the list and greyed out, so the count a screen reader reads matches what is
  on screen. It still cannot be picked, and a required select still refuses to
  submit while it is the one selected. Clearing the "Placeholder (first
  option)" field now leaves the row out altogether instead of adding a blank
  one. An open dropdown shows one more row than before (the placeholder); the
  closed control is unchanged. (This changes the rendered HTML of existing
  pages, so the release is marked breaking.)

### [Improvement]

- Every block file that builds a block's output now refuses to run when it is
  opened directly instead of through WordPress. Nothing changes on your pages —
  the output is identical, byte for byte — but it is what WordPress.org's own
  plugin checker asks for, and it closes a way a misconfigured server could
  have shown a raw file.

- Version numbers now agree with each other. The plugin reported
  `2026.01.0-stage1` in one place and `2026.01.0` in another, which is the kind
  of mismatch that can send people the wrong download.

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
  Tabs blocks; both are settled now — the Content switcher one was real and is
  fixed, and the Tabs one turned out to be a difference the editor has to keep,
  so it is written down as expected.

- Content switcher: the block now looks in the editor the way it looks on the
  published page. The row of buttons was a little taller than the published one
  at every size, and a lot taller at the small size, where the button labels sat
  in a 40px row instead of a 32px one. Hovering or pressing a button in the
  editor also now shades it the same way the published page does.

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
