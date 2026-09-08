## 2026.09.1 — 2026-09-08

### [A11y]

- Tabs now show the first tab's panel before any script runs, so the content is readable without JavaScript. Each tab is also linked to its panel in the markup rather than only after the page loads.
- A modal with no primary action label no longer renders an empty button. Leave the label blank when the modal holds a form with its own submit button.
- Keyboard focus now stays inside an open modal. A control the modal held but Tab could not reach — a hidden field taken out of the tab order — used to let focus walk out into the page behind it.
- A modal's dark overlay now covers the whole screen. It could sit slightly down the page, or be cropped to the content width when the modal was placed directly on a page.

### [Improvement]

- A style change now reaches people who have visited the site before. Block stylesheets were served under a web address that never changed, so a browser or host that had cached one kept serving the old file.

### [Breaking]

- The Tabs block's markup changed: the first usable tab renders selected and its panel renders visible.
