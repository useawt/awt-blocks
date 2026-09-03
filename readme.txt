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

AWT Blocks gives the block editor a full set of accessible components, built on [IBM's open-source Carbon Design System](https://carbondesignsystem.com/) and reviewed against WCAG 2.2 AA. It's one half of AWT — install it together with the AWT theme, which provides the design foundation, color themes, and 42 ready-made patterns these blocks are designed for. Both are free, and you download them from useawt.com.

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

AWT Blocks is English today. Every string a user reads is prepared for translation, and the plugin ships the template file a translator needs, so a language can be added without touching code. If you would like to translate AWT into yours, get in touch at useawt.com.

== Installation ==

1. Download AWT Blocks and the AWT theme from useawt.com.
2. In Plugins → Add New → Upload Plugin, upload the plugin ZIP and activate it.
3. In Appearance → Themes → Add New → Upload Theme, upload the theme ZIP and activate it. The blocks need it: the theme carries the colors, typography and spacing they are drawn with, so on any other theme they will look wrong.
4. Open any page in the editor. AWT blocks appear in the inserter, and the accessibility checker icon appears in the top bar.

== Frequently Asked Questions ==

= Do I need the AWT theme? =

The blocks run on any theme, but they're designed and tested with the AWT theme, which provides the Carbon Design System foundation (colors, typography, light/dark themes) plus 42 ready-made patterns built from these blocks. Use them together.

= How do I update AWT Blocks? =

WordPress tells you when a new version is out, on Dashboard, Updates. AWT does not install it for you: download the new plugin and theme files and upload them, and keep both on the same version. Your settings, pages and content are kept. The new version check sends nothing about your site: no address, no version, no visitor data. It reads one file to determine the latest version, and you can turn the check off in AWT Settings, Tools.

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
* [New] **First release.** The Carbon Design System as WordPress blocks — 58 of them, from buttons and form fields to tabs, accordions, data tables, notifications and modals.
* [New] An accessibility checker in the editor that flags WCAG 2.2 AA problems while you write, plus an Accessibility panel on every block.
* [New] Each block loads only its own CSS, so a page carries the styles it uses and nothing more.
* [New] Carbon's spacing scale on core WordPress blocks, so ordinary paragraphs and headings line up with everything else.
* [New] A per-page language setting, for a page written in a different language from the rest of the site.
* [New] Forms that submit: put a Button inside a Form block and turn on **Submit the form**.
* [New] **Tile group**, a new block that turns selectable tiles into one real choice with a heading saying what is being chosen.
* [New] Licensed GPLv3 or later. That matters only if you redistribute the plugin or build on its code — using it on your site is unaffected.
* [A11y] Dropdown works from the keyboard the way a dropdown should: arrow keys move the highlight, Home and End jump to the ends, Enter picks, Escape closes. Type a letter to jump to a choice.
* [A11y] Selectable tiles sharing a group name are one real radio group. One press of Tab reaches the whole group, the arrow keys move between tiles, and the choice submits with the form.
* [A11y] Text and Password fields show their error message under the field. It used to be written into the page for screen readers but never displayed, so anyone filling the form in by eye saw a red outline and no explanation.
* [A11y] Select shows an error icon as well as the red outline, and screen readers now count its options correctly.
* [A11y] Wide data tables and code snippets can be scrolled with the keyboard, and say which one you have entered.
* [A11y] A checkbox set to **Indeterminate** really is partially checked — it shows the dash, and screen readers say so.
* [A11y] The light/dark toggle names the mode it switches to, says whether that mode is on, announces the change, and keeps several toggles on one page in step.
* [A11y] Modal: leaving the second button's label empty removes the button instead of drawing an empty one.
* [A11y] A Statistic's label is plain text rather than a heading, so statistics stop creating heading-level skips.
* [A11y] A Notification's close button works on the published page.
* [A11y] Breadcrumbs, a lone FAQ question, and side navigation sections all announce correctly to screen readers.
<!-- CHANGELOG_END -->
