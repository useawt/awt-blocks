## 2026.09.2 — 2026-09-08

### [Improvement]

- A Section set wider than the content width now gets that width, on the page and in the editor. Picking "Wide" on a section in a page's content changed nothing, because the page layout was holding it to the content width.
- A Section's Content and Wide widths now follow the site's own layout settings instead of fixed sizes, so a section lines up with the page title and the breadcrumb above it. Narrow and Reading are unchanged — those are measures for text, not the page's layout.
- The Testimonial block's Attribution style now takes effect in the editor. The page laid the name and role out as chosen; the editor always showed them stacked.

### [A11y]

- The header now collapses to the menu button when the navigation does not fit, instead of at a fixed screen width. A long menu used to overflow — items wrapping and the last button cut off by the edge of the screen — while a short one was hidden behind the menu button with room to spare.
- Text typed into a URL field no longer becomes a broken link. On the Link, Button and Tile blocks, "Read more" in the URL field was turned into a link to a web address of that name; now nothing links to it, and the editor says the field does not hold an address.
- A clickable Tile that has a link inside it now renders as a plain tile, with that link still working. A link cannot contain another link, and browsers broke the tile apart when it did — the tile split in two with an empty box between and the link loose underneath. The editor now says so while you are building it.
