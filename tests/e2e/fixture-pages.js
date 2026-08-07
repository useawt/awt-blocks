/**
 * Shared fixture pages for the browser gates.
 *
 * Three hand-curated pages — interactive widgets, forms, and content blocks —
 * created through the REST API at test time, so no seeded content is needed.
 * They are curated rather than a dump of every block: each block here carries
 * a real accessibility surface (a name, a role, a state, a contrast pair), so
 * a failure points at block code rather than at whatever a seeded page
 * happened to contain.
 *
 * Both `axe.spec.js` and `computed-styles.spec.js` render these, deliberately:
 * the two gates are complements over the SAME corpus — axe finds broken rules,
 * the snapshots find values that changed. Keeping one copy means a block added
 * here is covered by both, and neither can silently fall behind the other.
 */

const WIDGETS = `
<!-- wp:awt/section {"ariaLabel":"Interactive widgets"} -->
<!-- wp:awt/accordion -->
<!-- wp:awt/accordion-item {"title":"What is AWT?"} -->
<!-- wp:paragraph --><p>An accessibility-first block theme.</p><!-- /wp:paragraph -->
<!-- /wp:awt/accordion-item -->
<!-- wp:awt/accordion-item {"title":"Which components ship?"} -->
<!-- wp:paragraph --><p>Carbon Design System components.</p><!-- /wp:paragraph -->
<!-- /wp:awt/accordion-item -->
<!-- /wp:awt/accordion -->

<!-- wp:awt/faq-item {"question":"Does it work without JavaScript?"} -->
<!-- wp:paragraph --><p>The content is server-rendered and readable either way.</p><!-- /wp:paragraph -->
<!-- /wp:awt/faq-item -->

<!-- wp:awt/tabs {"ariaLabel":"Product details"} -->
<!-- wp:awt/tab {"label":"Overview"} /-->
<!-- wp:awt/tab {"label":"Specifications"} /-->
<!-- wp:awt/tab-panel -->
<!-- wp:paragraph --><p>Overview panel.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tab-panel -->
<!-- wp:awt/tab-panel -->
<!-- wp:paragraph --><p>Specifications panel.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tab-panel -->
<!-- /wp:awt/tabs -->

<!-- wp:awt/content-switcher {"ariaLabel":"View mode"} -->
<!-- wp:awt/content-switcher-item {"label":"List","value":"list"} /-->
<!-- wp:awt/content-switcher-item {"label":"Grid","value":"grid"} /-->
<!-- wp:awt/content-switcher-panel -->
<!-- wp:paragraph --><p>List view.</p><!-- /wp:paragraph -->
<!-- /wp:awt/content-switcher-panel -->
<!-- wp:awt/content-switcher-panel -->
<!-- wp:paragraph --><p>Grid view.</p><!-- /wp:paragraph -->
<!-- /wp:awt/content-switcher-panel -->
<!-- /wp:awt/content-switcher -->

<!-- wp:awt/modal-opener {"text":"Open the dialog","modalId":"axe-modal"} /-->
<!-- wp:awt/modal {"id":"axe-modal","heading":"Confirm deletion","label":"Account settings","primaryAction":"Delete","danger":true} -->
<!-- wp:paragraph --><p>This cannot be undone.</p><!-- /wp:paragraph -->
<!-- /wp:awt/modal -->

<!-- wp:awt/dropdown {"label":"Region"} /-->
<!-- wp:awt/menu-button {"label":"Actions"} /-->
<!-- wp:awt/toggletip {"label":"Storage limits"} /-->
<!-- wp:awt/tooltip {"triggerText":"Retention","description":"Backups are kept for 30 days."} /-->
<!-- wp:awt/tile {"variant":"expandable","summary":"Deployment details"} -->
<!-- wp:paragraph --><p>Region, instance size, and rollout window.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->

<!-- Selectable tiles. A selectable tile is a checkbox or a radio drawn as a
     box, so its whole meaning lives in the accessibility tree - role, checked
     state, and (for a group) which of how many. Nothing about that is visible
     to a gate that reads markup or colour, which is why it is here. Two in a
     group and one standalone, because the group and the lone tile take
     different roles. -->
<!-- Grouped tiles live inside a Tile group, which is what makes them one
     choice: the fieldset and its legend are the only reason a screen reader can
     say WHAT is being chosen before listing the options. Kept as a group of two
     plus a lone tile below, because the two take different roles - the grouped
     ones are native radios, the lone one is role="checkbox". -->
<!-- wp:awt/tile-group {"label":"Instance size"} -->
<!-- wp:awt/tile {"variant":"selectable","groupName":"instance-size","value":"standard"} -->
<!-- wp:paragraph --><p>Standard instance</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->
<!-- wp:awt/tile {"variant":"selectable","groupName":"instance-size","value":"large"} -->
<!-- wp:paragraph --><p>Large instance</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->
<!-- /wp:awt/tile-group -->
<!-- wp:awt/tile {"variant":"selectable"} -->
<!-- wp:paragraph --><p>Enable nightly backups</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->

<!-- The colour-scheme toggle's other two kinds. The icon-only kind is in the
     header on every page already; these two are not anywhere, and the whole
     reason this gate exists is that this control's accessible name and pressed
     state were wrong for weeks while every gate passed. Each kind names and
     announces itself differently, so one kind covered is not three. -->
<!-- wp:awt/color-scheme-toggle {"kind":"with-label"} /-->
<!-- wp:awt/color-scheme-toggle {"kind":"segmented"} /-->
<!-- /wp:awt/section -->
`;

const FORMS = `
<!-- wp:awt/section {"ariaLabel":"Forms"} -->
<!-- wp:awt/form {"legend":"Create an account","description":"All fields are required."} -->
<!-- wp:awt/text-input {"label":"Full name","name":"name","required":true,"helperText":"As it appears on your ID."} /-->
<!-- wp:awt/text-input {"label":"Email","name":"email","type":"email","required":true,"invalid":true,"invalidText":"Enter a valid email address."} /-->
<!-- wp:awt/text-input {"label":"Company","name":"company","warn":true,"warnText":"We could not verify this company."} /-->
<!-- wp:awt/password-input {"label":"Password","name":"password","helperText":"At least 12 characters."} /-->
<!-- wp:awt/text-area {"label":"Why are you signing up?","name":"reason"} /-->
<!-- wp:awt/select {"label":"Plan","name":"plan"} /-->
<!-- wp:awt/select {"label":"Region","name":"region","invalid":true,"invalidText":"Choose a region."} /-->
<!-- wp:awt/text-input {"label":"Account id","name":"account","value":"AC-4471","readonly":true} /-->
<!-- wp:awt/text-area {"label":"Terms you accepted","name":"terms","value":"Recorded at sign-up.","readonly":true} /-->
<!-- wp:awt/text-input {"label":"Legacy plan","name":"legacy","disabled":true} /-->
<!-- wp:awt/text-input {"label":"Carbon-styled field","name":"carbonlook","carbonDefault":true} /-->
<!-- wp:awt/text-input {"label":"Fluid field","name":"fluid","fluid":true} /-->
<!-- wp:awt/checkbox {"label":"Email me product updates","name":"updates"} /-->
<!-- wp:awt/checkbox {"label":"Select all regions","name":"regions","indeterminate":true} /-->
<!-- wp:awt/radio-button-group {"legend":"Billing period","name":"billing"} -->
<!-- wp:awt/radio-button {"label":"Monthly","value":"monthly","checked":true} /-->
<!-- wp:awt/radio-button {"label":"Yearly","value":"yearly"} /-->
<!-- /wp:awt/radio-button-group -->
<!-- wp:awt/toggle {"label":"Two-factor authentication","name":"twofa","toggled":true} /-->
<!-- wp:awt/button {"text":"Create account","type":"submit","size":"md"} /-->
<!-- wp:awt/button {"text":"Cancel","kind":"secondary","size":"md"} /-->
<!-- wp:awt/button {"text":"Delete","kind":"danger","size":"md"} /-->
<!-- wp:awt/button {"text":"Learn more","kind":"ghost","size":"md"} /-->
<!-- /wp:awt/form -->
<!-- /wp:awt/section -->
`;

const CONTENT = `
<!-- wp:awt/hero {"heading":"Accessible by default","description":"Carbon components, paired light and dark."} /-->
<!-- wp:awt/section {"ariaLabel":"Content blocks"} -->
<!-- wp:awt/breadcrumb -->
<!-- wp:awt/breadcrumb-item {"text":"Home","href":"/"} /-->
<!-- wp:awt/breadcrumb-item {"text":"Docs","href":"/docs"} /-->
<!-- wp:awt/breadcrumb-item {"text":"Blocks","isCurrentPage":true} /-->
<!-- /wp:awt/breadcrumb -->

<!-- wp:awt/notification {"kind":"info","title":"Scheduled maintenance","subtitle":"Sunday 02:00 to 04:00 UTC."} /-->
<!-- wp:awt/notification {"kind":"success","title":"Saved","subtitle":"Your changes are live.","lowContrast":true} /-->
<!-- wp:awt/notification {"kind":"warning","title":"Storage almost full","subtitle":"92 percent used.","lowContrast":true} /-->
<!-- wp:awt/notification {"kind":"error","title":"Upload failed","subtitle":"The file is larger than 10 MB.","lowContrast":true} /-->
<!-- wp:awt/notification {"kind":"error","title":"Connection lost","subtitle":"Retrying.","variant":"toast"} /-->

<!-- wp:awt/tag {"text":"Stable","type":"green"} /-->
<!-- wp:awt/tag {"text":"Beta","type":"purple"} /-->
<!-- wp:awt/tag {"text":"Filterable","type":"blue","filter":true} /-->
<!-- wp:awt/tag {"text":"Outlined","type":"outline","filter":true} /-->
<!-- wp:awt/tag {"text":"High contrast","type":"high-contrast","filter":true} /-->

<!-- wp:awt/data-table {"caption":"Services and owners","sortable":true,"zebra":true} /-->

<!-- wp:awt/list -->
<!-- wp:awt/list-item {"content":"Keyboard reachable"} /-->
<!-- wp:awt/list-item {"content":"Screen-reader labelled"} /-->
<!-- /wp:awt/list -->

<!-- wp:awt/code-snippet {"code":"wp plugin activate awt-blocks","variant":"single"} /-->
<!-- wp:awt/link {"text":"Read the documentation","href":"/docs"} /-->
<!-- wp:paragraph --><p>A plain link typed into a paragraph, such as <a href="/docs">this one</a>, carries no design-system class — so it is the only way to cover difference D4.</p><!-- /wp:paragraph -->
<!-- wp:awt/stat {"value":"98%","heading":"Automated checks passed","level":"3"} /-->
<!-- wp:awt/testimonial {"quote":"It stopped being an afterthought.","authorName":"Maria S.","authorRole":"Design lead"} /-->

<!-- wp:awt/feature-grid -->
<!-- wp:awt/tile -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Paired themes</h3><!-- /wp:heading -->
<!-- wp:paragraph --><p>Light and dark are designed together.</p><!-- /wp:paragraph -->
<!-- /wp:awt/tile -->
<!-- wp:awt/tile -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Keyboard first</h3><!-- /wp:heading -->
<!-- wp:paragraph --><p>Every control is reachable without a mouse.</p><!-- /wp:paragraph -->
<!-- A Link block INSIDE a tile. A tile is a box that holds content, so a link
     in one is ordinary text-flow content and must look like a link. This is
     here because the first version of D6 reset the underline on the tile class
     rather than on the anchor form of it, which stripped the underline from
     every link inside every tile - invisible to the gate, because no fixture
     tile held a link. (No backticks in this comment: the fixture is a JS
     template literal, so one would end the string.) -->
<!-- wp:awt/link {"text":"Read the keyboard guide","href":"/docs"} /-->
<!-- /wp:awt/tile -->
<!-- /wp:awt/feature-grid -->

<!-- wp:awt/pricing-tile {"tierName":"Essentials","price":"0","pricePeriod":"forever","description":"The full component set.","ctaText":"Get started"} /-->
<!-- wp:awt/pagination {"totalPages":5,"currentPage":2,"baseUrl":"/docs"} /-->
<!-- /wp:awt/section -->
`;

const PAGES = [
	{ key: 'widgets', title: 'gate — interactive widgets', content: WIDGETS },
	{ key: 'forms', title: 'gate — forms', content: FORMS },
	{ key: 'content', title: 'gate — content blocks', content: CONTENT },
];

module.exports = { PAGES, WIDGETS, FORMS, CONTENT };
