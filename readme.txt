=== AWT Blocks ===
Contributors: useawt
Tags: accessibility, blocks, carbon-design-system, block-editor
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 8.1
Stable tag: 2026.08.0
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Accessible blocks built on the Carbon Design System, with an accessibility checker inside the editor. Made to pair with the AWT theme.

== Description ==

AWT Blocks gives the block editor a full set of accessible components, built on [IBM's open-source Carbon Design System](https://carbondesignsystem.com/) and reviewed against WCAG 2.2 AA. It's one half of AWT — install it together with the [AWT theme](https://wordpress.org/themes/awt/), which provides the design foundation, color themes, and 42 ready-made patterns these blocks are designed for.

**58 blocks**, including:

* Page structure: hero, section, feature grid, stats, testimonials, pricing tiles, tiles, and a skip link
* Site chrome: header, navigation, side navigation, breadcrumbs, footer sections, and a visitor-facing color scheme toggle
* Interactive components: accordion, tabs, content switcher, modal, notifications, pagination, menu button, toggletip, and tooltip
* Forms: form container, text input, text area, select, dropdown, checkbox, radio buttons, toggle, and password input
* Content: data table, list, code snippet, tag, link, icon, FAQ item

Every block ships with keyboard support, correct roles and ARIA states, visible focus styles, and text that meets WCAG contrast requirements — in both light and dark mode.

= Accessibility checker in the editor =

The plugin adds an accessibility checker that reviews your content while you write. It runs 14 checks, including:

* Missing image alt text, and alt text that's just the file name
* Skipped or out-of-order heading levels
* Links with no text, vague link text ("click here", "read more"), and identical link text pointing to different pages
* Missing page language
* Color contrast below WCAG AA, and colors outside your site's palette
* Tables without header cells, and inline SVG without an accessible name

Findings appear in a sidebar panel, on the affected block, in the top bar, and in the pre-publish check — each with a plain explanation and a "Show block" shortcut that takes you straight to the fix.

= Accessibility panel on every block =

Every AWT block has an Accessibility panel in its settings: see the block's computed accessible name, and set `aria-label`, `aria-describedby`, `aria-labelledby`, a role override, or the element's language when you need to.

= Live contrast preview =

When you pick text or background colors on a block, a Contrast section shows the WCAG contrast ratio in real time, with pass/fail badges for normal and large text.

= Works with your other plugins =

See the Compatibility notes below. WooCommerce, Polylang, and WP Super Cache coexistence is verified automatically on every release; a wider set of popular plugins is checked as part of each release.

= Translations =

Translations for any locale are welcome via WordPress.org's translation platform (GlotPress). AWT doesn't ship translations directly; community contributions become available to all users automatically.

== Installation ==

1. Install and activate the plugin from Plugins → Add New (search for "AWT Blocks"), or upload the ZIP.
2. Install and activate the [AWT theme](https://wordpress.org/themes/awt/) from Appearance → Themes. The blocks are designed for it — on other themes they work, but they won't have the Carbon design foundation.
3. Open any page in the editor. AWT blocks appear in the inserter, and the accessibility checker icon appears in the top bar.

== Frequently Asked Questions ==

= Do I need the AWT theme? =

The blocks run on any theme, but they're designed and tested with the AWT theme, which provides the Carbon Design System foundation (colors, typography, light/dark themes) plus 42 ready-made patterns built from these blocks. Use them together.

= Does the color scheme toggle need a cookie banner? =

No. The visitor's light/dark choice is stored in a cookie that only holds a UI preference the visitor set themselves. Under EU rules (GDPR/ePrivacy) that is a strictly necessary cookie: no consent banner is required, and you don't need to add it to an existing banner.

= Does the light/dark switch work with caching plugins? =

Yes, out of the box. A small script in the page head applies the visitor's choice before the page paints, so one cached copy of a page serves both light and dark visitors correctly. You don't need to configure your caching plugin to vary by cookie — please don't; it would only shrink your cache hit rate.

= Can I add my own code to every page? =

Not with the free theme and plugin. Putting your own markup into the page is a job for a plugin rather than a theme, so it is part of AWT Premium. Custom CSS is different — that is styling, and it is in AWT Settings for everyone.

= Is there a paid version? =

AWT Premium adds advanced capabilities on top of the free plugin and theme. Everything in the free version is complete and stays free — Premium features are marked in the editor where they apply, and nothing you build breaks without Premium.

== Screenshots ==

1. A page built from AWT blocks, open in the editor.
2. The accessibility checker's sidebar panel, with findings and "Show block" shortcuts.
3. Accessibility checks in the pre-publish panel — issues surface before you publish.
4. The Accessibility panel in a block's settings, on every AWT block: the block's computed accessible name, plus fields for `aria-label` and `aria-describedby`.
5. A published page in light mode, built entirely from AWT blocks and patterns.
6. The same page in dark mode — the visitor color scheme toggle switches instantly.

== Copyright ==

AWT Blocks, (C) 2026 AWT.
AWT Blocks is distributed under the terms of the GNU GPL v3 or later.
The full text is in license.txt.

AWT Blocks is GPLv3-or-later rather than GPLv2-or-later because it bundles
Carbon Design System styles and icons, which are Apache-2.0. Apache 2.0 is
compatible with GPLv3 but not with GPLv2.

This plugin bundles the following third-party resources:

Carbon Design System styles, compiled from @carbon/styles
Copyright IBM Corp. 2016, 2026
License: Apache License 2.0, https://www.apache.org/licenses/LICENSE-2.0
Full text: LICENSE-Apache-2.0.txt
Source: https://github.com/carbon-design-system/carbon

Carbon Design System icons, from @carbon/icons
Copyright IBM Corp. 2016, 2026
License: Apache License 2.0, https://www.apache.org/licenses/LICENSE-2.0
Full text: LICENSE-Apache-2.0.txt
Source: https://github.com/carbon-design-system/carbon

== Accessibility statement ==

<!-- ACCESSIBILITY_START -->
# Accessibility statement

## Our commitment

AWT is a WordPress theme and blocks plugin committed to **WCAG 2.2 AA**
conformance for the components, patterns, and templates it ships.
Accessibility is the product's reason to exist, not a feature of it: every
block is built on the Carbon Design System's accessibility groundwork,
reviewed against WCAG 2.2 AA, and shipped with an in-editor accessibility
linter that helps authors keep their own content accessible.

## Scope

This statement covers what AWT ships, at its default state:

- The AWT theme: all bundled page templates, template parts, style
  variations, and block patterns.
- The AWT blocks plugin: every block, in the editor and on the published
  page, and the AWT Settings screens.

It does not cover:

- Content written by site owners and authors (the in-editor accessibility
  linter helps here, but authors stay responsible for their content).
- Third-party plugins installed alongside AWT.
- Custom CSS added through AWT Settings, and any code added by an AWT Premium
  add-on.

## Standard

**WCAG 2.2 Level AA.** The in-editor accessibility linter uses the same
2.2 AA thresholds (for example, contrast checks), so what the editor
enforces and what this statement promises stay aligned.

## Known limitations

We list what we know does not yet meet the standard, honestly:

- **No formal independent audit has been completed yet.** Conformance so far
  rests on the Carbon Design System's accessibility work, our own component
  reviews, automated checks, and an ongoing review by accessibility
  practitioners outside the project. That review is real and it has found real
  bugs, but it is not a published third-party audit. See "Audit status" below.
- Components inherit the current behavior of the Carbon Design System
  (v11). Where Carbon publishes known accessibility issues for a component,
  those apply to the matching AWT block until fixed upstream or worked
  around.

If you find a barrier we have not listed, please tell us — see "Feedback"
below.

## Audit status

**Outside expert review is under way. A formal audit is still to come.**

Since 2026-08-01, accessibility practitioners from outside the project have
been testing AWT with real assistive technology and reporting what they find.
Findings are treated as bugs: fixed, verified, and written up. This is not a
published third-party audit, and it does not replace one. A formal independent
audit is still planned before commercial launch, and its report will appear
here.

**Ten findings received so far. All ten are fixed.** Newest first.

1. **2026-08-07. A select in error was marked by colour alone, and lost even
   that on focus.** Carbon draws an error icon inside a select that has an
   error; ours drew only the red outline. So the field itself said "error" in
   red and nothing else, which colour may not do on its own. Worse, the rule
   Carbon writes for that red outline steps aside for the focus indicator — by
   design, since the two would otherwise occupy the same edge — so tabbing into
   the field removed the last mark of the error at the exact moment you reached
   it. The message under the field was still there and still read out, but the
   field showed nothing. The icon is now drawn, and it stays put whether the
   field is focused or not. The automated checks gained a select in error, three
   style probes and one screen-reader-tree probe: none of the four browser gates
   could see this shape before, because no test page contained one.

2. **2026-08-06. A focused button's outline could not be measured.** Carbon
   marks a focused button by recolouring its border, drawing a ring inside that,
   and then a third ring in the button's own background colour. That is two
   rings of different thickness, assembled from a border and two shadows, with
   no outline anywhere — so there is no single thickness to read. On a primary
   button two of the three layers are the same blue as the button fill, which is
   what made a reading ambiguous: whether the mark cleared the 2-pixel bar
   became something to argue about rather than something to check. A focused
   button now carries one 2-pixel outline just outside its edge, the same mark
   links and form fields already use. In the header bar there is no outside to
   draw in, because a button fills the bar's whole height, so there the same
   outline goes just inside the edge instead, matching the icon buttons beside
   it. (That part was a second pass the same day: the first version drew outside
   everywhere, which in the header spilled onto the page below and left a
   one-pixel gap that read as a border.) **AWT Settings → Carbon → Focus** puts
   Carbon's two-ring look back. Both meet the guideline — this was about which
   one an auditor can measure, not about whether a keyboard user can see it —
   and the automated check now measures both.

3. **2026-08-04. Links were marked out by colour alone.** A link had no
   underline until you pointed at it, so colour was the only thing telling you
   it was a link. Colour may do that job by itself only when the link is clearly
   different from the text around it — three times the contrast or more. Ours
   was not: 3.62 to 1 against body text in light mode, and 2.14 to 1 in dark
   mode. Any link sitting on a dark band inside a light page measured the same
   2.14 to 1, and changing the palette can take the light figure under the line
   too. Links are now underlined. There is a switch for each place a link
   appears (main content, header, side navigation, breadcrumbs, footer) and one
   above them that turns the whole thing off, in **AWT Settings → Carbon →
   Links**; all of them start on. Buttons, pagination numbers, tags, cards and
   the header's icon controls are not underlined, because each is already marked
   out by its own shape. Fixing this also removed a stray underline that had
   been drawn under the header's icon controls.

4. **2026-08-03. Focus rings were too thin, and three of them could not be
   seen at all.** The ring that marks the control you have reached with the Tab
   key was 1 pixel thick, where the guideline asks for 2. Three were worse than
   thin: each was drawn in a colour so close to the surface behind it that there
   was nothing to see. The close button on a notification measured 1.8 to 1, the
   dismiss button on a tag in dark mode 1.2 to 1, and the selected button in a
   Content switcher in dark mode 1.1 to 1. Every focus ring is now at least 2
   pixels thick, with at least 2 of those pixels checked against what sits
   behind them. One of the three faint rings was our own style rule overriding a
   Carbon rule that was already correct. A plain link typed into a paragraph now
   gets the theme's ring instead of the browser's. No setting puts Carbon's
   1-pixel ring back. Buttons later gained a choice, but it is between two marks
   that both clear the bar, not between having one and not — see finding 1.

5. **2026-08-03. Form fields were hard to see as fields.** A field was marked
   out by a shaded fill with a single line under the text, so what showed you
   where the field was, and how big it was, came down to that one line: the fill
   differs from the page by only 1.10 to 1 in light mode and 1.20 to 1 in dark,
   and in high-contrast (forced-colors) mode it is replaced entirely. Text
   input, Text area, Password input, Select and Dropdown now draw a border on all
   four sides, in the same color the line already used, which keeps the 3 to 1
   contrast that user-interface components need in both light and dark. Any
   single field can be put back to the one-line look with its **Carbon default**
   setting.

6. **2026-08-03. The Select block told screen readers it had one more option
   than it really has.** A select offering four choices was announced as
   "3 of 5". Its placeholder sat in the list assistive technology reads while
   being left out of the list drawn on screen, so every count was one too high.
   The placeholder is now an ordinary first option, present in both lists and
   greyed out. It still cannot be chosen. Screen readers that do not announce
   list position, including VoiceOver, were never affected.

7. **2026-08-02. The light and dark mode switch did not say what it had
   done.** The button was named "Light mode / Dark mode", which tells you
   neither what pressing it does nor which mode you are in, and the first press
   announced nothing at all. The button is now named after the mode it turns
   on, reports whether that mode is on, and announces the change. The segmented
   version now also marks which of Light, Auto and Dark is in use, and a
   returning visitor is no longer told the wrong mode while the page loads.

8. **2026-08-02. "Skip to main content" landed before the breadcrumb trail.**
   Automatic breadcrumbs were rendered inside the main region, so anyone who
   used the skip link still had every breadcrumb to move through before
   reaching the page content, which is what the skip link exists to avoid. The
   trail now sits immediately before the main region. Nothing changed visually.

9. **2026-08-01. The "Skip to main content" link was hard to see when
   focused.** An old style rule of ours was overriding part of the Carbon
   styling, so the focused link drew at roughly half its intended height and
   carried two different focus indicators at once. The override is gone. The
   focused link is now a full-height panel with its text at 11:1 contrast.

10. **2026-08-01. Links asked the reader to "see" a thing.** Reported on our own
   website: link text used *see* where an action word says the same thing
   without assuming sight. About 205 links and labels were reworded. This one
   was on our website rather than in the theme or plugin, so it falls outside
   the scope above, but it came from the same review and belongs in the same
   list.

Findings 1 to 8 are fixed in the theme and plugin, and each is described in
plain language in `CHANGELOG.md`.

## Feedback

Found an accessibility problem in AWT? Email
**[hello@useawt.com](mailto:hello@useawt.com)**.
Reports about real barriers are treated as bugs, not feature requests.

## Dates

- Statement prepared: 2026-07-17
- Last reviewed: 2026-08-07
<!-- ACCESSIBILITY_END -->

== Compatibility notes ==

AWT aims to coexist cleanly with the plugins most sites run. "Coexist" means: no crashes, your site's pages keep rendering, and the editor keeps working. Plugin-specific screens (for example a shop checkout) keep that plugin's own styling.

Verified continuously in our test suite:

* WooCommerce — product, cart, and guest checkout flows complete; the block editor and accessibility checker work with WooCommerce active.
* Polylang — multiple languages render correctly; AWT is fully translation-ready (text domain `awt-blocks`).
* WP Super Cache — cached pages render correctly, and each visitor's light/dark choice still applies on cached pages.

Checked before every release: Yoast SEO / Rank Math / All in One SEO, Gravity Forms / WPForms / Contact Form 7, MemberPress / LearnDash / LifterLMS, Elementor / Beaver Builder, WPML, WP Rocket.

Known limitations: page builders (Elementor, Beaver Builder) work alongside AWT, but pages built with them use the builder's styling, not AWT's design system.

== Changelog ==

<!-- CHANGELOG_START -->
= 2026.08.0 — 2026-08-25 =
* [Breaking] Tabs and content switchers no longer show every panel at once while the page loads. WordPress 7.1 changed the way it writes out on/off attributes in block markup, and the mark that hides the inactive panels stopped being written at all: every panel was visible until the page's script ran, and stayed visible for anyone browsing with scripts off. The panels are marked hidden again. (The rendered markup changes, which is a deliberate snapshot update.)
* [Breaking] **AWT Blocks is now GPLv3 or later, instead of GPLv2 or later.** Nothing changes for you as a site owner: you can still use, modify and redistribute it freely, and it runs on WordPress exactly as before. The change matters only if you redistribute the plugin yourself or build on its code, in which case your copy must now follow GPLv3 terms. The reason is that the plugin bundles Carbon Design System styles and icons, which IBM releases under the Apache 2.0 licence. Apache 2.0 can be combined with GPLv3 but not with GPLv2, so the older label was wrong. The full licence text ships in `license.txt`, with the Apache 2.0 text included after it.
* [Breaking] Selectable tiles with a group name render differently. Each one is now a hidden radio button plus the tile as its label, instead of one box carrying the state itself. Existing pages keep working and need no edits, but custom CSS or JavaScript that targeted the tile's own `role` or `aria-checked` should target the radio button instead. Tiles without a group name are unchanged. This is a deliberate snapshot update; the reason it matters is under [A11y].
* [Breaking] Select: a field marked as having an error renders one extra icon, and its inner wrapper gains a `data-invalid` marker. Nothing was renamed, so existing CSS and JavaScript keep working. This is a deliberate snapshot update; the reason it matters for people using the block is under [A11y].
* [Breaking] Dropdown: each choice in the list is now a plain element instead of a button, and carries an id and its value. If you wrote your own CSS or JavaScript targeting the button inside a Dropdown choice, point it at the choice itself. The class names are unchanged, so styling by class still applies. This is a deliberate snapshot update; the reason it matters for people using the block is under [A11y].
* [Breaking] Form fields now draw their border on all four sides. Text input, Text area, Password input, Select and Dropdown used to be marked out by a shaded fill with one line under the text, which left the field's shape resting on that single line: the fill differs from the page by only 1.10 to 1 in light mode and 1.20 to 1 in dark, and in forced-colors mode it is replaced altogether. The border is the same color the line already used, so it clears the 3 to 1 contrast that user-interface components need, in both modes. Each of the five blocks gains a **Carbon default** setting under **Style**: turn it on and that field goes back to the one-line look. Focus and error states are unchanged, and a disabled field still shows no border. Text areas are 1px taller. The rendered markup changes, which is a deliberate snapshot update.
* [Breaking] Read-only Text input and Text area fields now use the same border color as editable ones. A read-only field has no shaded fill, so its border is the only thing showing where the field is, and the paler color it used to have was too faint to see (1.32 to 1 against the page). You can still tell a read-only field at a glance: an editable field is a filled box, a read-only one is an outline, and a disabled one is a fill with no edge. Unaffected by **Carbon default**.
* [Breaking] Color scheme toggle: the toggle now says which mode it turns on and whether that mode is on. It used to be called "Light mode / Dark mode", which told a screen reader user neither. It is now a toggle button named after the mode it turns on, with an on or off state that a screen reader reads on focus and again on every press. The "Icon with label" version shows that same name instead of always showing the light-mode one. If you renamed the labels, your wording is kept. The icon follows the same state, and both icons are now Carbon's own: a sun in light mode and a crescent in dark mode, where it used to be one hand-drawn sun in both. The rendered markup changes, which is a deliberate snapshot update.
* [Breaking] Breadcrumb: screen readers now announce the breadcrumb as "Breadcrumbs" instead of "Breadcrumb". This is the block's default accessible name, so it changes only breadcrumbs that never had a name set by hand; anything you typed into "Accessible name (aria-label)" is untouched. The rendered markup changes, which is a deliberate snapshot update.
* [Breaking] Side nav: a side nav now sits below the header instead of on top of it. Side navs used to start at the very top of the screen, hiding the logo and site title behind them. The rendered markup gains one class (a deliberate snapshot update), and the block's description now describes the narrow-screen behavior.
* [Breaking] Side nav: the side nav works on a narrow screen. It used to open as a full-height panel over the content with no way to close it. Below 1056px the panel now steps aside — there is no room for it — and its links move into the header menu, behind the header's menu button, so nothing becomes unreachable. On a documentation site those links are the documentation. Opening the header menu shows them below the site's main menu items, separated by a rule, and they work with the keyboard exactly like the rest of that menu: Tab moves through them, Escape closes and returns you to the menu button. Above 1056px nothing changes. This needs the header to have a menu (the "Header navigation" block); all four header presets include one.
* [Breaking] Side nav: the "Mode" dropdown is now a "Show the side nav" switch, and "Default expanded" and "User can toggle" are gone from the block's settings. Of the four choices Mode offered, only two ever did anything: "Rail" and "Overlay" were never built, and picking either gave you a broken nav — Rail cut every link label off at 48px while leaving the links reachable by keyboard, and Overlay produced a nav that covered the site title. Both now render as the ordinary docked side nav. "Default expanded" had no effect either way, and "User can toggle" promised a button that did not exist; the narrow-screen behavior above replaces it, and it is always on rather than something you have to find and switch on. Side navs already on your site keep working and need no changes.
* [Breaking] Side nav link: a link with no icon no longer shows the first letter of its label in the icon slot. That letter existed only for "Rail" mode, which has been removed, and a single letter was never a usable icon. Links with an icon chosen are unchanged. (Deliberate snapshot update.)
* [Breaking] Side nav section: the "Default expanded" toggle is gone. It set a class no stylesheet defines — neither Carbon's nor the theme's — so both positions rendered the same thing. A section is a static group; there was nothing to expand. Sections already on your site keep working. (The rendered markup drops that class: deliberate snapshot update.)
* [Breaking] Side nav section: a section heading now names the list of links under it, so a screen reader announces "Get started, list" instead of an unnamed list of links. The heading was a visual label only — the grouping you can see was never passed on to people who cannot (WCAG 1.3.1, Info and Relationships). The rendered markup gains an `id` on the heading and an `aria-labelledby` on the list pointing at it (a deliberate snapshot update). Sections with no heading and the look of the nav are unchanged.
* [Breaking] Notification: the close button now works on the published page. Clicking it (or activating it with the keyboard) dismisses the notification — it disappears from the page and from the accessibility tree, matching the Carbon Design System's behavior. Before, the button rendered but did nothing. Notifications with "Hide close button" turned on are unchanged. The block's rendered markup gains Interactivity API attributes (deliberate snapshot update).
* [Breaking] Hero: the hero image now loads immediately with high priority instead of lazy-loading. The hero sits at the top of the page, so lazy-loading held back the page's largest paint (the LCP metric) and could hand the browser's high-priority hint to an image further down the page. The rendered markup changes from `loading="lazy"` to `loading="eager" fetchpriority="high"` — pages get faster with no visual change.
* [Breaking] Paragraphs and headings now carry Carbon's editorial rhythm by default. The Spacing (bottom margin) default changes from 16px to 24px (spacing-06) for paragraphs, and from "None (theme default)" to 16px (spacing-05) for headings. Paragraph gaps grow by 8px wherever the author never chose a spacing value; heading gaps look the same as before (the theme's block gap already produced 16px), but the value is now explicit in the heading's own Spacing setting. Any spacing an author picked by hand is kept. To restore the old paragraph rhythm on a page, set those paragraphs' Spacing to spacing-05.
* [Breaking] Section: a full-width section now keeps at least the site's global side padding around its content. Before, on screens narrower than the content column, a full-width section's text could sit almost against the screen edge when its horizontal padding was a small spacing step (spacing-01 is 2px). A larger padding choice still wins — only sections whose padding was below the site's global padding change, and only on narrow screens. (Breaking because the rendered padding style changes for full-width sections.)
* [Breaking] Statistic: the label under the number is now plain text (`<p>`) by default instead of an `<h4>`. A stat's label captions the number rather than starting a page section, and the old default created heading-level skips (H2 → H4) on most pages — including the shipped Stats bar pattern. Existing stats that never set a heading level pick up the new default automatically; choose "Heading 2–6" in the block's settings if your statistic really does start a section.
* [Breaking] Toggletip: the rendered markup now matches Carbon's reference structure (the pop-up lives in a popover container next to the trigger, with the label outside it). The pop-up gains Carbon's caret arrow and high-contrast styling, positions itself with CSS instead of JavaScript, and shifts to a placement that fits when the author's choice would push it off the screen edge. Content and settings are unchanged — only the generated HTML differs, so custom CSS targeting the old structure may need updating.
* [A11y] Text input and Password input: an error message now appears under the field. Until now it was written into the page but never shown, so a visitor who filled the field in wrongly saw a red outline and an icon and was never told what the problem was. Screen readers did read the message out, so this affected people reading the screen. Text area and Select were already correct. Warning messages were always shown. The rendered markup changes, which is a deliberate snapshot update, but only for a field that is in error: a valid field renders exactly as before.
* [A11y] Select: a field with an error now shows an error icon inside it. Until now the error was drawn as a red outline and nothing else, so anyone who does not see red had only the message below the field to go on. Worse, the focus indicator takes the place of that outline, so tabbing into the field removed the last mark of the error at the exact moment you were about to use it. The icon is the one Carbon draws on its own selects, and it stays put whether the field is focused or not. The rendered markup changes, which is a deliberate snapshot update.
* [A11y] Selectable tiles that belong together are now one real choice. Tiles sharing a group name were each announced as a radio button that belonged to nothing: a screen reader never said what the choice was about, every tile was its own stop when tabbing, and the arrow keys did nothing. They are now built the way the browser builds a set of radio buttons, so one press of Tab reaches the whole group, the arrow keys move between the tiles, choosing one clears the rest, and the choice can be submitted with a form — which it could not be before, because the tiles carried no value at all. Selected tiles also show the check mark Carbon designed for them, so the state is not carried by colour alone.
* [A11y] New block: **Tile group**. Put selectable tiles inside it and the choice gets a heading that says what is being chosen, which is the part a screen reader announces first. There is a **Value** field on each tile for what it sends when a form is submitted.
* [A11y] Dropdown: you can type to pick a choice. A screen reader tells people this dropdown can be typed into — that comes with the kind of control it is — but typing did nothing, so the instruction was a dead end for exactly the people who were given it. Type a letter and the list opens on the first choice starting with it; keep typing to narrow it down, or press the same letter again to step through the choices that share it. Pause for half a second and the next letter starts a fresh search. A letter that matches nothing leaves your place alone instead of clearing it, and shortcuts like Ctrl+R still reach the browser.
* [A11y] Dropdown: the choices are no longer buttons, and the keyboard works the way a dropdown should. Each choice used to be a button inside the list, which put a control inside a control: a screen reader read every choice twice, once as a choice and again as a button, and pressing Tab walked you into the open list instead of past the field. Now the choices are plain text, focus stays on the field the whole time, and the arrow keys move the highlight — Home and End jump to the first and last choice, Enter picks the highlighted one, and Escape closes the list without changing your answer. Re-opening the list puts the highlight back on what you already chose. Nothing about how it looks changes.
* [A11y] A partially-checked Checkbox now really is partially checked. The block has had an **Indeterminate** setting all along, but nothing acted on it: the checkbox drew as an ordinary empty one, and a screen reader said "not checked". It now shows the dash Carbon designed for that state and announces itself as partially checked, in the editor and on the published page. The state clears the first time someone ticks the box, which is what you want from a "select all" checkbox.
* [A11y] Color scheme toggle: switching between light and dark is announced. There was already a polite announcement, but it was built at the moment it was used, and a screen reader only reads out a region that was already on the page, so the first press was silent. The region is now on the page from the start, empty, and the message is a sentence ("Dark mode on") rather than a bare label.
* [A11y] Color scheme toggle: the "Segmented" version marks which of Light, Auto and Dark is on. It was three plain buttons with nothing saying which one you were using. The one in use is now filled, bold and underlined, and screen readers read it as pressed.
* [A11y] Color scheme toggle: a visitor who has chosen a mode before now gets the right state in the page as it arrives, instead of the toggle briefly claiming the opposite.
* [A11y] Color scheme toggle: when a page has more than one toggle, they all update together instead of disagreeing about the current mode.
* [A11y] FAQ question: a question placed on its own is no longer announced as a broken list. The block always produced a list item, which is right inside an accordion but wrong on its own, where a screen reader meets a list item with no list around it. On its own it is now a plain container, which looks and behaves exactly the same. Inside an accordion nothing changes. (This changes the rendered HTML of existing pages, so the release is marked breaking, but no page looks different.)
* [A11y] Accessibility checker: the heading-order checks (heading-level skips, illogical heading order) now see the heading a Statistic block emits when it's set to a heading level. Before, those headings were invisible to the checker even though they were real headings on the published page.
* [A11y] Code snippet: a multi-line snippet wider than the space it has can now be scrolled with the keyboard. The snippet was already a tab stop, but on the wrong box: the multi-line variant scrolls the code itself, one level below the area that was focusable, so a keyboard user could focus the snippet and still not reach the code past the right edge (WCAG 2.1.1). The tab stop now sits on whatever actually scrolls, which differs between the single-line and multi-line variants, and neither carries a tab stop that does nothing. Arrow keys scroll it, and it draws the theme's usual focus ring. The rendered markup changes, which is a deliberate snapshot update.
* [A11y] Data table: a table too wide for the space it has can now be scrolled with the keyboard. Such a table scrolls sideways, but the scrolling area could not be focused, so anyone without a mouse or a touch screen could not reach the columns past the right edge and simply could not read them (WCAG 2.1.1). The area is now a tab stop, it takes its name from the table's caption so a screen reader says which table you have entered, and the theme draws its usual focus ring around it. Arrow keys scroll it. Tables that fit gain one tab stop and nothing else. The rendered markup changes, which is a deliberate snapshot update.
* [A11y] Select: screen readers now count the options correctly. The placeholder ("Choose…") was put in the list as a hidden option, and a browser leaves a hidden option out of the list you see while still handing it to a screen reader. So a select offering four choices was read out as "3 of 5", and every select was off by one. The placeholder is now an ordinary first option, in the list and greyed out, so the count a screen reader reads matches what is on screen. It still cannot be picked, and a required select still refuses to submit while it is the one selected. Clearing the "Placeholder (first option)" field now leaves the row out altogether instead of adding a blank one. An open dropdown shows one more row than before (the placeholder); the closed control is unchanged. (This changes the rendered HTML of existing pages, so the release is marked breaking.)
* [Improvement] Tested on WordPress 7.0. Everything was checked on it before the version was written down: the blocks on the front end, the editor, the accessibility checker, and every AWT Settings screen.
* [Improvement] Clearer wording on two settings. The link setting on Button, Link, Tag and Modal is now called "Link relationship (rel)" and explains underneath that links opening in a new tab are already handled for you. The Code snippet setting is now just "Language", and says plainly that it labels the snippet for screen readers rather than coloring the code.
* [Improvement] Translations now work. AWT Blocks was labelling its text `awt` while WordPress looks for it under the plugin's own name, `awt-blocks`, so a finished translation would have been ignored and everything shown in English. The theme was also using `awt`, which meant the two products' translations landed in the same place and could overwrite each other. The words on screen are unchanged.
* [Improvement] Every block file that builds a block's output now refuses to run when it is opened directly instead of through WordPress. Nothing changes on your pages — the output is identical, byte for byte — but it is what WordPress.org's own plugin checker asks for, and it closes a way a misconfigured server could have shown a raw file.
* [Improvement] Version numbers now agree with each other. The plugin reported `2026.01.0-stage1` in one place and `2026.01.0` in another, which is the kind of mismatch that can send people the wrong download.
* [Improvement] Header brand: a logo you have set now shows without a second setting to find. When brand mode is left on the site default, the block shows the logo and prefix you have set, and just your site title when you have set neither. Its Prefix and Upload logo controls also stay available while they are still empty, so you can fill them in — before, they were hidden until the brand mode already included a logo, which meant there was no way to get there.
* [Improvement] A new build check keeps the block editor and the published page in step. Three bugs in one day came from a block putting different CSS classes on its markup in the editor than on the page, and each one only showed up in the editor — the published page was right every time, so nothing caught them. The check compares the two for every class the theme's stylesheet styles, and fails the build when they disagree. It found two more cases, in the Content switcher and Tabs blocks; both are settled now — the Content switcher one was real and is fixed, and the Tabs one turned out to be a difference the editor has to keep, so it is written down as expected.
* [Improvement] Content switcher: the block now looks in the editor the way it looks on the published page. The row of buttons was a little taller than the published one at every size, and a lot taller at the small size, where the button labels sat in a 40px row instead of a 32px one. Hovering or pressing a button in the editor also now shades it the same way the published page does.
* [Improvement] Side nav: opening a template in the Site Editor no longer draws the side nav over the page content. It now sits at the left with the content and footer starting to its right, the way the published page renders. Editing the header on its own was already correct; this was templates only.
* [Improvement] Side nav section: the editor now shows each section's links. In the Site Editor every section appeared as a title with nothing under it, whichever section it was — the links were there, drawn at no height. The section heading also now looks the same in the editor as on the published page.
* [Improvement] Footer section: the heading now looks the same in the Site Editor as in the published footer. The editor preview used its own smaller, tighter heading style instead of the theme's real footer heading style.
* [Improvement] Toggletip: a label with more than one word now stays on one line next to the info button instead of wrapping into a narrow column.
* [Improvement] The icon gallery now shows previews on every installed copy of the plugin. The picker's search grid loaded its preview images from a folder that only exists in development installs, so on a normal install every tile came up blank (the icons themselves still worked on the published page). Previews now come from the icon set bundled with the plugin. The nine size-independent icons (`caution`, `circle-fill`, and friends) also preview correctly for the first time, and plugin builds now produce the same icon set on every operating system.
* [Improvement] Icons now render on every installed copy of the plugin. The Icon block (and the icons other blocks draw) read Carbon's SVG files from disk; installed copies were missing all but ten built-in fallbacks, so icons showed as placeholder text like `[image]`. The plugin now bundles the full icon set the picker offers (about 1.2 MB), and nine icons that Carbon publishes without a size variant (`caution`, `circle-fill`, and friends) render correctly for the first time.
* [Improvement] Side nav: the block no longer appears in the inserter while you edit a post or page. It is site chrome — it docks to the left edge of the screen, next to the header — so inside page content it covered the page instead of sitting where you placed it. Add it in the Site Editor (for example the "Side navigation" template part), where it still works as before. Pages that already contain one keep rendering and stay editable.
* [Improvement] Sample content (the dev-environment seed and the render-test fixtures) now carries the theme's revised pattern placeholder copy: plainer language with no "ship" wording or em dashes. No block's own output changes.
* [Improvement] Section: the "Light (active light variant)" and "Dark (active dark variant)" theme-scope choices now work. They resolve to the paired scope of the active style variation (for example White + g90 → dark sections use g90) on the published page and in the editor preview. Previously they emitted a class no stylesheet defined, so the option did nothing.
* [New] Section: new "Reading (48rem)" max width option, between Narrow and Content. It matches the reading measure the theme gives paragraphs, so a whole section — headings, images, everything — can line up with the text column. Good for long-form pages like articles and documentation.
* [New] Section: new "No gap below" switch (Layout panel). Turn it on and the section sits flush against whatever comes next — no bottom margin — so full-width color bands can stack without a seam of page background between them. While it's on, the Spacing setting is hidden (the switch overrides it); turn it off and your chosen spacing comes back.
* [New] Button: new "Submit the form" toggle. Turn it on for the button that sends a form (place the button inside a Form block) and it renders as a real submit button. Before, this setting wasn't registered, so the buttons in the shipped form patterns (Form, Login, Contact form, Newsletter signup) did nothing when clicked — those patterns now submit correctly. Buttons that don't use the toggle render exactly as before.
* [New] Initial Stage 1 release of the AWT blocks plugin: the full Carbon component inventory as WordPress blocks (58 blocks), per-block CSS loading, the in-editor accessibility linter with WCAG 2.2 AA checks, the Accessibility inspector panel, per-page language override, and the Carbon spacing control on core blocks.
<!-- CHANGELOG_END -->
