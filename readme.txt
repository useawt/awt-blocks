=== AWT Blocks ===
Contributors: getawt
Tags: accessibility, blocks, carbon-design-system, block-editor
Requires at least: 6.6
Tested up to: 6.8
Requires PHP: 8.1
Stable tag: 2026.01.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Accessible blocks built on the Carbon Design System, with an accessibility checker inside the editor. Made to pair with the AWT theme.

== Description ==

AWT Blocks gives the block editor a full set of accessible components, built on [IBM's open-source Carbon Design System](https://carbondesignsystem.com/) and reviewed against WCAG 2.2 AA. It's one half of AWT (Accessible WordPress Theme) — install it together with the [AWT theme](https://wordpress.org/themes/awt/), which provides the design foundation, color themes, and 42 ready-made patterns these blocks are designed for.

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

= I added code in AWT Settings → Custom code and it doesn't run. Why? =

If your site sends a Content Security Policy (CSP) — a security header that controls which scripts may run — it can block injected code. The Custom code field warns about this. After adding custom code, always verify on the live site that it actually executes; if it doesn't, your CSP (set by a security plugin, your host, or a CDN) is the first thing to check.

= Is there a paid version? =

AWT Premium adds advanced capabilities on top of the free plugin and theme. Everything in the free version is complete and stays free — Premium features are marked in the editor where they apply, and nothing you build breaks without Premium.

== Screenshots ==

1. AWT blocks in the editor — a page assembled from hero, feature grid, and stats blocks.
2. The accessibility checker's sidebar panel, with findings and "Show block" shortcuts.
3. Accessibility checks in the pre-publish panel — issues surface before you publish.
4. The Accessibility panel in a block's settings — accessible name, `aria-label`, role, and language, on every AWT block.
5. A published page in light mode, built entirely from AWT blocks and patterns.
6. The same page in dark mode — the visitor color scheme toggle switches instantly.

== Accessibility statement ==

<!-- ACCESSIBILITY_START -->
(Injected from awt-theme/ACCESSIBILITY.md by `npm run release:prepare`.)
<!-- ACCESSIBILITY_END -->

== Compatibility notes ==

AWT aims to coexist cleanly with the plugins most sites run. "Coexist" means: no crashes, your site's pages keep rendering, and the editor keeps working. Plugin-specific screens (for example a shop checkout) keep that plugin's own styling.

Verified continuously in our test suite:

* WooCommerce — product, cart, and guest checkout flows complete; the block editor and accessibility checker work with WooCommerce active.
* Polylang — multiple languages render correctly; AWT is fully translation-ready (text domain `awt`).
* WP Super Cache — cached pages render correctly, and each visitor's light/dark choice still applies on cached pages.

Checked before every release: Yoast SEO / Rank Math / All in One SEO, Gravity Forms / WPForms / Contact Form 7, MemberPress / LearnDash / LifterLMS, Elementor / Beaver Builder, WPML, WP Rocket.

Known limitations: page builders (Elementor, Beaver Builder) work alongside AWT, but pages built with them use the builder's styling, not AWT's design system.

== Changelog ==

<!-- CHANGELOG_START -->
(Injected from CHANGELOG.md by `npm run release:prepare`.)
<!-- CHANGELOG_END -->
