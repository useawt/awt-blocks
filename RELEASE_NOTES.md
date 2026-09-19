## 2026.09.17 — 2026-09-19

### [A11y]

- Vertical tabs become a row of tabs on a narrow screen. They kept a fixed sidebar at every screen size, so on a phone the panel ran off the side of the screen and the page scrolled sideways.

### [Breaking]

- Vertical tabs wrap their tab list in the same element horizontal tabs use. Custom CSS that targeted the list as a direct child of the block needs updating.
