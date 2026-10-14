<?php
/**
 * AWT global block controls — server side.
 *
 * Cross-cutting "Spacing" feature for every TOP-LEVEL AWT block (no `parent`):
 *
 *   1. Registers an `awtSpacing` attribute (default '05') on those blocks via
 *      register_block_type_args, so the attribute exists for both the PHP
 *      render and the editor regardless of script load order.
 *   2. On render_block, injects an `awt-spacing-NN` class onto the block's
 *      outer element. theme.css turns that class into a bottom margin using
 *      the matching Carbon spacing token (`--cds-spacing-NN`). Default 05.
 *   3. Enqueues assets/global-block-controls.js, which adds the editor
 *      Spacing panel + the Carbon component documentation links.
 *
 * @package AWT\Blocks
 */

declare( strict_types = 1 );

namespace AWT\Blocks\GlobalControls;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const PREFIX          = 'awt/';
const SPACING_DEFAULT = '05';

/**
 * Add the `awtSpacing` attribute to top-level AWT blocks at registration.
 */
add_filter(
	'register_block_type_args',
	static function ( array $args, string $name ): array {
		if ( strpos( $name, PREFIX ) !== 0 ) {
			return $args;
		}
		// Child/inline blocks (those declaring a parent) are spaced by their
		// container — they don't get the control or the default.
		if ( ! empty( $args['parent'] ) ) {
			return $args;
		}
		// UI-shell blocks (header / nav / footer) live in horizontal
		// template-part layouts; a bottom margin would break them. They keep
		// their Carbon doc link (editor) but opt out of spacing.
		if ( isset( $args['category'] ) && $args['category'] === 'awt-ui-shell' ) {
			return $args;
		}
		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = array();
		}
		if ( ! isset( $args['attributes']['awtSpacing'] ) ) {
			$args['attributes']['awtSpacing'] = array(
				'type'    => 'string',
				'default' => SPACING_DEFAULT,
			);
		}
		return $args;
	},
	10,
	2
);

/**
 * Spacing control on CORE blocks (opt-in).
 *
 * The same Carbon-token bottom-margin control AWT blocks get is also offered on
 * top-level core blocks — but OPT-IN: the `awtSpacing` attribute defaults to ''
 * (no class emitted, block keeps its theme/blockGap spacing) and a class is only
 * added once the author picks a token. AWT blocks keep their forced default of
 * '05'; core blocks must not be force-margined site-wide. Child blocks (declared
 * parent/ancestor) and a denylist of structural/invisible blocks are excluded.
 */
const CORE_SPACING_DENY = array(
	'core/spacer',
	'core/nextpage',
	'core/more',
	'core/freeform',
	'core/html',
	'core/shortcode',
	'core/missing',
	'core/block',
	'core/template-part',
	'core/post-content',
	'core/query',
	'core/legacy-widget',
	'core/widget-group',
	'core/navigation',
	'core/list-item',
	'core/page-list-item',
);

/**
 * Whether a core block is in scope for the opt-in Spacing control.
 *
 * @param string $name Block name (e.g. 'core/paragraph').
 * @param array  $args Block registration args.
 */
function is_core_spacing_block( string $name, array $args ): bool {
	if ( strpos( $name, 'core/' ) !== 0 ) {
		return false;
	}
	if ( in_array( $name, CORE_SPACING_DENY, true ) ) {
		return false;
	}
	// Child/inner-only blocks are spaced by their container.
	return empty( $args['parent'] ) && empty( $args['ancestor'] );
}

/**
 * Per-block default Spacing token for core blocks. Most core blocks are opt-in
 * (default '' = no AWT spacing), but the blocks that carry body copy take a
 * default so the page has one editorial rhythm, mirroring Carbon's long-form
 * pages: core/paragraph, core/list and core/preformatted '06' (24px) and
 * core/heading '05' (16px below a heading — the same gap the theme blockGap
 * already produced, now carried by the heading itself so the select reads
 * honestly and the gap no longer depends on the following block's top
 * margin).
 *
 * Lists and preformatted blocks were added in 2026.09.0. Without a default
 * they computed to 0, so a list or a preformatted block sat flush against
 * whatever followed it while every paragraph around it kept its 24px.
 *
 * core/quote is deliberately absent: it carries its own margin and is not
 * flush, so giving it a token is a design change rather than a fix.
 *
 * Mirror in global-block-controls.js.
 */
const CORE_SPACING_DEFAULTS = array(
	'core/paragraph'    => '06',
	'core/list'         => '06',
	'core/preformatted' => '06',
	'core/heading'      => '05',
);

/**
 * The default spacing token for a core block ('' = none).
 *
 * @param string $name Block name.
 */
function core_spacing_default( string $name ): string {
	return CORE_SPACING_DEFAULTS[ $name ] ?? '';
}

/**
 * Add the `awtSpacing` attribute to in-scope core blocks (per-block default).
 */
add_filter(
	'register_block_type_args',
	static function ( array $args, string $name ): array {
		if ( ! is_core_spacing_block( $name, $args ) ) {
			return $args;
		}
		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = array();
		}
		if ( ! isset( $args['attributes']['awtSpacing'] ) ) {
			$args['attributes']['awtSpacing'] = array(
				'type'    => 'string',
				'default' => core_spacing_default( $name ),
			);
		}
		return $args;
	},
	10,
	2
);

/**
 * Add a class to the first opening tag of a block's rendered HTML.
 *
 * @param string $content    Rendered block HTML.
 * @param string $class_name Class to add.
 */
function add_class_to_first_tag( string $content, string $class_name ): string {
	if ( ! preg_match( '/<[a-zA-Z][^>]*>/', $content, $m, PREG_OFFSET_CAPTURE ) ) {
		return $content;
	}
	$tag    = $m[0][0];
	$offset = (int) $m[0][1];
	if ( preg_match( '/\sclass="([^"]*)"/', $tag, $cm ) ) {
		$new_tag = str_replace( $cm[0], ' class="' . $cm[1] . ' ' . $class_name . '"', $tag );
	} else {
		$new_tag = preg_replace( '/(\s*\/?>)$/', ' class="' . $class_name . '"$1', $tag, 1 );
	}
	return substr_replace( $content, $new_tag, $offset, strlen( $tag ) );
}

/**
 * Emit `awt-spacing-NN` on a core block ONLY when the author picked a token.
 */
add_filter(
	'render_block',
	static function ( string $content, array $block ): string {
		$name = $block['blockName'] ?? '';
		if ( strpos( $name, 'core/' ) !== 0 || trim( $content ) === '' ) {
			return $content;
		}
		// The render_block filter gets RAW parsed attrs (registered defaults are NOT merged.
			// here), so fall back to the per-block default — that's how core/paragraph's
			// '05' reaches the front end when unchanged. Explicit '' (author chose
			// "None") is preserved as '' and emits nothing.
			$token = isset( $block['attrs']['awtSpacing'] ) ? (string) $block['attrs']['awtSpacing'] : core_spacing_default( $name );
		if ( $token === '' || ! preg_match( '/^(0[1-9]|1[0-3])$/', $token ) ) {
			return $content; // Opt-in: nothing chosen → leave the block untouched.
		}
		if ( in_array( $name, CORE_SPACING_DENY, true ) ) {
			return $content;
		}
		$type = \WP_Block_Type_Registry::get_instance()->get_registered( $name );
		if ( $type && ( ! empty( $type->parent ) || ! empty( $type->ancestor ) ) ) {
			return $content;
		}
		return add_class_to_first_tag( $content, 'awt-spacing-' . $token );
	},
	10,
	2
);

/**
 * Accessibility-panel attributes (§4 Part 2). Registered on EVERY AWT block
 * (including child / UI-shell blocks — an accessible name or lang is meaningful
 * everywhere, unlike bottom-margin spacing). The editor panel writes them; the
 * render_block filter below writes them onto the element each one names
 * (NAME_TARGETS).
 */
const A11Y_ATTRS = array( 'ariaLabel', 'ariaDescribedby', 'ariaLabelledby', 'awtRole', 'awtLang' );

/**
 * Blocks that declare `ariaLabel` in their own block.json and put it on the
 * right element themselves: the tablist of a content switcher or tabs, the
 * button of a toggletip, the inner `<nav>` of a side nav, the `<ul>` of a
 * header menu. The emit below must leave these alone, or it writes a second
 * copy onto the outer element. On a wrapper with no role that copy does
 * nothing for a screen reader and axe flags it (`aria-prohibited-attr`); on
 * the side nav it named two landmarks the same. Found 2026-09-27, issue
 * useawt/awt-workspace#13.
 *
 * Recorded at registration, from what the block declared before the filter
 * below adds the attribute to every block. Section is recorded but not
 * skipped (see apply_panel_attributes()).
 *
 * @param string|null $name Block name to record, or null to only read.
 * @return array<string,bool> Names of the blocks that own their aria-label.
 */
function owns_aria_label( ?string $name = null ): array {
	static $owners = array();
	if ( $name !== null ) {
		$owners[ $name ] = true;
	}
	return $owners;
}

add_filter(
	'register_block_type_args',
	static function ( array $args, string $name ): array {
		if ( strpos( $name, PREFIX ) !== 0 ) {
			return $args;
		}
		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = array();
		}
		if ( isset( $args['attributes']['ariaLabel'] ) ) {
			owns_aria_label( $name );
		}
		foreach ( A11Y_ATTRS as $key ) {
			if ( ! isset( $args['attributes'][ $key ] ) ) {
				$args['attributes'][ $key ] = array(
					'type'    => 'string',
					'default' => '',
				);
			}
		}
		return $args;
	},
	10,
	2
);

/**
 * Where each block's Accessibility-panel name goes.
 *
 * The panel promises that its Accessible name "replaces the name above", and
 * the name above is the name of the thing a screen reader user reaches: the
 * field, the switch, the tab, the dialog. Until 2026-10-14 the filter below
 * wrote the panel's attributes onto the block's FIRST tag, which on about
 * half the blocks is a wrapper `<div>` or `<span>`. ARIA prohibits a name on
 * an element with the generic role, so browsers dropped it, and the field
 * inside kept its own name: the author was told the block was labelled and it
 * was not. Found by the external review, on a code snippet whose
 * "Opening hours endpoint example" never reached its focusable `<pre>`.
 *
 * Each entry lists candidates, tried in order; the first that applies wins,
 * and a block with no entry, or with no candidate that applies, is named on
 * its first tag. A candidate:
 *
 * - `first`    conditions on the block's first tag (`tag`, `class`), so one
 *              block can route by variant: an expandable tile names its
 *              `<summary>`, every other tile names itself.
 * - `tag`, `role`, `attr`, `class`: the element to name, the first in
 *              document order that matches all of them (the first tag
 *              included). With none of these keys the first tag is the
 *              target. Inner blocks print after their parent's own
 *              control in every block listed, which is what makes "first
 *              match" safe; the per-block test renders each one with
 *              nested content to hold that.
 * - `add_role` the role to add when the target ends up named but generic
 *              (default `group`). A scrolling code area takes `region`, the
 *              pattern for a focusable scrolling box; the header's global
 *              bar takes `region`, as its own render does for aria-label.
 * - `none`     the block has nothing a name could go on (a decorative
 *              divider, a tag that is only its text), its name comes from
 *              elsewhere by design (a tab panel takes its tab's name, and
 *              the tabs script re-applies that), or it has a name setting of
 *              its own (an icon's, in its Icon settings, which the panel
 *              would otherwise override unseen). aria-label and
 *              aria-labelledby are not written; the editor hides those
 *              fields there and says why.
 *
 * Block keys:
 * - `name`        candidates for aria-label and aria-labelledby.
 * - `describedby` candidates for aria-describedby, when it belongs somewhere
 *                 else (a header submenu names its list, but only the title
 *                 link takes focus, so that is where a description is read).
 *                 Default: the name target, or the first tag when the name
 *                 has none.
 * - `role`, `lang` where the Role and Language settings go, when not the
 *                 first tag: `name` (the name target) or candidates. Only
 *                 for blocks whose first tag is not the block: the header
 *                 navigation prints its menu button first; the side
 *                 navigation's `<nav>` moves into the header on small screens,
 *                 leaving its `<aside>` behind, so its language goes with the
 *                 `<nav>` while a Role stays on the `<aside>`, where it has
 *                 always gone; a tile in a radio group prints its input
 *                 before the `<label>` that is the tile.
 *
 * Mirrored in the editor (accessibility-panel.js, NAME_NONE) for the blocks
 * that hide the fields.
 */
const NAME_TARGETS = array(
	'awt/checkbox'               => array( 'name' => array( array( 'tag' => 'INPUT' ) ) ),
	'awt/radio-button'           => array( 'name' => array( array( 'tag' => 'INPUT' ) ) ),
	'awt/text-input'             => array( 'name' => array( array( 'tag' => 'INPUT' ) ) ),
	'awt/password-input'         => array( 'name' => array( array( 'tag' => 'INPUT' ) ) ),
	'awt/text-area'              => array( 'name' => array( array( 'tag' => 'TEXTAREA' ) ) ),
	'awt/select'                 => array( 'name' => array( array( 'tag' => 'SELECT' ) ) ),
	'awt/dropdown'               => array( 'name' => array( array( 'role' => 'combobox' ) ) ),
	'awt/toggle'                 => array( 'name' => array( array( 'role' => 'switch' ) ) ),
	'awt/menu-button'            => array( 'name' => array( array( 'tag' => 'BUTTON' ) ) ),
	'awt/tooltip'                => array( 'name' => array( array( 'attr' => 'tabindex' ) ) ),
	'awt/toggletip'              => array( 'name' => array( array( 'tag' => 'BUTTON' ) ) ),
	'awt/modal'                  => array( 'name' => array( array( 'role' => 'dialog' ) ) ),
	'awt/code-snippet'           => array(
		'name' => array(
			array(
				'attr'     => 'tabindex',
				'add_role' => 'region',
			),
		),
	),
	'awt/tabs'                   => array( 'name' => array( array( 'role' => 'tablist' ) ) ),
	'awt/tab'                    => array( 'name' => array( array( 'role' => 'tab' ) ) ),
	'awt/tab-panel'              => array( 'name' => array( array( 'none' => true ) ) ),
	'awt/content-switcher'       => array( 'name' => array( array( 'role' => 'tablist' ) ) ),
	'awt/content-switcher-panel' => array( 'name' => array( array( 'none' => true ) ) ),
	'awt/accordion-item'         => array( 'name' => array( array( 'tag' => 'BUTTON' ) ) ),
	'awt/faq-item'               => array( 'name' => array( array( 'tag' => 'BUTTON' ) ) ),
	'awt/header-global'          => array( 'name' => array( array( 'add_role' => 'region' ) ) ),
	'awt/header-nav'             => array(
		'name' => array( array( 'tag' => 'NAV' ) ),
		'role' => 'name',
		'lang' => 'name',
	),
	'awt/header-menu'            => array(
		'name'        => array(
			array(
				'tag'   => 'UL',
				'class' => 'cds--header__menu',
			),
		),
		'describedby' => array( array( 'tag' => 'A' ) ),
	),
	'awt/header-nav-item'        => array( 'name' => array( array( 'tag' => 'A' ) ) ),
	'awt/footer-link'            => array( 'name' => array( array( 'tag' => 'A' ) ) ),
	'awt/side-nav'               => array(
		'name' => array( array( 'tag' => 'NAV' ) ),
		'lang' => 'name',
	),
	'awt/side-nav-section'       => array(
		'name' => array(
			array(
				'tag'   => 'UL',
				'class' => 'cds--side-nav__menu',
			),
		),
	),
	'awt/side-nav-link'          => array( 'name' => array( array( 'tag' => 'A' ) ) ),
	'awt/side-nav-divider'       => array( 'name' => array( array( 'none' => true ) ) ),
	'awt/breadcrumb-item'        => array( 'name' => array( array( 'tag' => 'A' ) ) ),
	'awt/tile'                   => array(
		'name' => array(
			array(
				'first' => array( 'tag' => 'DETAILS' ),
				'tag'   => 'SUMMARY',
			),
		),
		'role' => array(
			array(
				'first' => array( 'tag' => 'INPUT' ),
				'tag'   => 'LABEL',
			),
		),
		'lang' => array(
			array(
				'first' => array( 'tag' => 'INPUT' ),
				'tag'   => 'LABEL',
			),
		),
	),
	'awt/icon'                   => array( 'name' => array( array( 'none' => true ) ) ),
	'awt/tag'                    => array(
		'name' => array(
			array( 'first' => array( 'tag' => 'A' ) ),
			array( 'first' => array( 'class' => 'cds--tag--filter' ) ),
			array( 'none' => true ),
		),
	),
);

/**
 * Where a block's panel attributes go (see NAME_TARGETS).
 *
 * Filterable, so a block registered outside this plugin can say where its own
 * name belongs: `awt_blocks_name_target` receives the entry (or null) and the
 * block name.
 *
 * @param string $name Block name.
 * @return array|null The block's entry, or null to name the first tag.
 */
function name_target( string $name ): ?array {
	$entry = apply_filters( 'awt_blocks_name_target', NAME_TARGETS[ $name ] ?? null, $name );
	return is_array( $entry ) ? $entry : null;
}

/**
 * Whether the tag the processor stands on has the generic role, on which
 * ARIA prohibits a name. `<pre>` is generic too (HTML-AAM), and so is a link
 * with no href; `<section>` is not, since a name makes it a region.
 *
 * @param \WP_HTML_Tag_Processor $p Processor positioned on a tag.
 */
function is_generic( \WP_HTML_Tag_Processor $p ): bool {
	$role = $p->get_attribute( 'role' );
	if ( is_string( $role ) && trim( $role ) !== '' ) {
		return in_array( strtolower( trim( $role ) ), array( 'generic', 'presentation', 'none' ), true );
	}
	$tag = $p->get_tag();
	if ( $tag === 'A' ) {
		return $p->get_attribute( 'href' ) === null;
	}
	return in_array( $tag, array( 'DIV', 'SPAN', 'PRE', 'P', 'CODE', 'B', 'I', 'EM', 'STRONG', 'SMALL' ), true );
}

/**
 * Whether the tag the processor stands on matches a candidate's element keys.
 *
 * @param \WP_HTML_Tag_Processor $p    Processor positioned on a tag.
 * @param array                  $keys `tag`, `role`, `attr` and/or `class`.
 */
function tag_matches( \WP_HTML_Tag_Processor $p, array $keys ): bool {
	if ( isset( $keys['tag'] ) && $p->get_tag() !== $keys['tag'] ) {
		return false;
	}
	if ( isset( $keys['role'] ) && $p->get_attribute( 'role' ) !== $keys['role'] ) {
		return false;
	}
	if ( isset( $keys['attr'] ) && $p->get_attribute( $keys['attr'] ) === null ) {
		return false;
	}
	if ( isset( $keys['class'] ) && ! $p->has_class( $keys['class'] ) ) {
		return false;
	}
	return true;
}

/**
 * Resolve a list of candidates against a block's HTML.
 *
 * @param string $html       Rendered block HTML.
 * @param array  $candidates Candidates from NAME_TARGETS.
 * @return array|null `[ 'index' => nth tag (0 = first), 'add_role' => role ]`,
 *                    or null when the block has nothing to name.
 */
function resolve_target( string $html, array $candidates ): ?array {
	$first = new \WP_HTML_Tag_Processor( $html );
	if ( ! $first->next_tag() ) {
		return null;
	}
	foreach ( $candidates as $c ) {
		if ( isset( $c['first'] ) && ! tag_matches( $first, $c['first'] ) ) {
			continue;
		}
		if ( ! empty( $c['none'] ) ) {
			return null;
		}
		$add_role = $c['add_role'] ?? 'group';
		$keys     = array_intersect_key( $c, array_flip( array( 'tag', 'role', 'attr', 'class' ) ) );
		if ( ! $keys ) {
			return array(
				'index'    => 0,
				'add_role' => $add_role,
			);
		}
		$p = new \WP_HTML_Tag_Processor( $html );
		$i = 0;
		while ( $p->next_tag() ) {
			if ( tag_matches( $p, $keys ) ) {
				return array(
					'index'    => $i,
					'add_role' => $add_role,
				);
			}
			++$i;
		}
	}
	return array(
		'index'    => 0,
		'add_role' => 'group',
	);
}

/**
 * An attribute of the nth tag of some HTML.
 *
 * @param string $html  HTML.
 * @param int    $index Tag index, 0 for the first.
 * @param string $attr  Attribute name.
 * @return string|true|null The value, true for a bare attribute, null if absent.
 */
function attribute_at( string $html, int $index, string $attr ) {
	$p = new \WP_HTML_Tag_Processor( $html );
	$i = 0;
	while ( $p->next_tag() ) {
		if ( $i === $index ) {
			return $p->get_attribute( $attr );
		}
		++$i;
	}
	return null;
}

/**
 * Where the Role or Language setting goes: the first tag, the name target,
 * or the entry's own candidates.
 *
 * @param string     $html        Rendered block HTML.
 * @param mixed      $spec        `name`, candidates, or null.
 * @param array|null $name_target The resolved name target.
 * @return int Tag index.
 */
function setting_index( string $html, $spec, ?array $name_target ): int {
	if ( $spec === 'name' ) {
		return $name_target['index'] ?? 0;
	}
	if ( is_array( $spec ) ) {
		return resolve_target( $html, $spec )['index'] ?? 0;
	}
	return 0;
}

/**
 * Space-separated id list with duplicates removed, order kept.
 *
 * @param string ...$lists Id lists.
 */
function merge_ids( string ...$lists ): string {
	$ids = array();
	foreach ( $lists as $list ) {
		foreach ( preg_split( '/\s+/', trim( $list ) ) as $id ) {
			if ( $id !== '' && ! in_array( $id, $ids, true ) ) {
				$ids[] = $id;
			}
		}
	}
	return implode( ' ', $ids );
}

/**
 * Write the Accessibility-panel attributes onto the right elements of a
 * block's HTML.
 *
 * - aria-label and aria-labelledby go on the block's name target and REPLACE
 *   what is there: they are the author's explicit override. An aria-label
 *   on its own also removes the target's aria-labelledby, which would
 *   otherwise win and keep the old name.
 * - aria-describedby is ADDED to the target's own (a field's helper and error
 *   text, a tooltip's text stay described).
 * - A target that is still generic once named gets a role, so the name is
 *   allowed there. A Role of presentation or none is not written on an
 *   element that has a name, because browsers ignore it there anyway.
 * - Role and Language go on the first tag (or see `role` and `lang`) and
 *   never replace a role or lang the block already set.
 * - A Role and a name set together stay together: the author is naming the
 *   group or region they made, as the panel always did, so the name goes
 *   where the Role goes rather than to the control inside.
 *
 * Blocks that put their own `ariaLabel` in place (owns_aria_label()) keep
 * doing so; only their labelledby and describedby are routed here, to the
 * same element. Section is the exception: its render writes the name only on
 * a `<section>`, so for an `<article>`, `<aside>` or `<div>` this filter
 * writes it.
 *
 * @param string $content Rendered block HTML.
 * @param string $name    Block name.
 * @param array  $attrs   The block's raw attributes.
 * @return string HTML with the attributes in place.
 */
function apply_panel_attributes( string $content, string $name, array $attrs ): string {
	$value       = static function ( string $key ) use ( $attrs ): string {
		return isset( $attrs[ $key ] ) ? trim( (string) $attrs[ $key ] ) : '';
	};
	$label       = ( isset( owns_aria_label()[ $name ] ) && $name !== 'awt/section' ) ? '' : $value( 'ariaLabel' );
	$labelledby  = $value( 'ariaLabelledby' );
	$describedby = $value( 'ariaDescribedby' );
	$role        = $value( 'awtRole' );
	$lang        = $value( 'awtLang' );
	if ( $label === '' && $labelledby === '' && $describedby === '' && $role === '' && $lang === '' ) {
		return $content;
	}

	$entry       = name_target( $name ) ?? array();
	$name_target = resolve_target( $content, $entry['name'] ?? array() );
	$desc_target = isset( $entry['describedby'] ) ? resolve_target( $content, $entry['describedby'] ) : $name_target;
	if ( $desc_target === null ) {
		$desc_target = array(
			'index'    => 0,
			'add_role' => 'group',
		);
	}
	$role_index = setting_index( $content, $entry['role'] ?? null, $name_target );
	$lang_index = setting_index( $content, $entry['lang'] ?? null, $name_target );
	$hiding     = in_array( strtolower( $role ), array( 'presentation', 'none' ), true );
	$naming     = $name_target !== null && ( $label !== '' || $labelledby !== '' );
	if ( $naming && $role !== '' && ! $hiding && $role_index !== $name_target['index']
		&& attribute_at( $content, $role_index, 'role' ) === null ) {
		$name_target = array(
			'index'    => $role_index,
			'add_role' => 'group',
		);
	}

	$p = new \WP_HTML_Tag_Processor( $content );
	$i = 0;
	while ( $p->next_tag() ) {
		if ( $role !== '' && $i === $role_index && $p->get_attribute( 'role' ) === null ) {
			$named = ( $naming && $name_target['index'] === $i )
				|| $p->get_attribute( 'aria-label' ) !== null
				|| $p->get_attribute( 'aria-labelledby' ) !== null;
			if ( ! ( $hiding && $named ) ) {
				$p->set_attribute( 'role', $role );
			}
		}
		if ( $lang !== '' && $i === $lang_index && $p->get_attribute( 'lang' ) === null ) {
			$p->set_attribute( 'lang', $lang );
		}
		if ( $describedby !== '' && $i === $desc_target['index'] ) {
			$own = $p->get_attribute( 'aria-describedby' );
			$p->set_attribute( 'aria-describedby', merge_ids( is_string( $own ) ? $own : '', $describedby ) );
		}
		if ( $naming && $i === $name_target['index'] ) {
			if ( $labelledby !== '' ) {
				$p->set_attribute( 'aria-labelledby', $labelledby );
			} elseif ( $label !== '' ) {
				$p->remove_attribute( 'aria-labelledby' );
			}
			if ( $label !== '' ) {
				$p->set_attribute( 'aria-label', $label );
			}
			if ( is_generic( $p ) ) {
				$p->set_attribute( 'role', $name_target['add_role'] );
			}
		}
		++$i;
	}
	return $p->get_updated_html();
}

add_filter(
	'render_block',
	static function ( string $content, array $block ): string {
		$name = $block['blockName'] ?? '';
		if ( strpos( $name, PREFIX ) !== 0 || trim( $content ) === '' ) {
			return $content;
		}
		return apply_panel_attributes( $content, $name, $block['attrs'] ?? array() );
	},
	11,
	2
);

/**
 * Element-language support for core text blocks. The editor adds an `awtLang`
 * attribute to core/paragraph, core/heading and core/list-item (see
 * accessibility-panel.js); mirror the registration here so the server parses it,
 * and emit it as a `lang` attribute on the block's outer tag.
 */
const LANG_CORE_BLOCKS = array( 'core/paragraph', 'core/heading', 'core/list-item' );

add_filter(
	'register_block_type_args',
	static function ( array $args, string $name ): array {
		if ( ! in_array( $name, LANG_CORE_BLOCKS, true ) ) {
			return $args;
		}
		if ( ! isset( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
			$args['attributes'] = array();
		}
		if ( ! isset( $args['attributes']['awtLang'] ) ) {
			$args['attributes']['awtLang'] = array(
				'type'    => 'string',
				'default' => '',
			);
		}
		return $args;
	},
	10,
	2
);

add_filter(
	'render_block',
	static function ( string $content, array $block ): string {
		$name = $block['blockName'] ?? '';
		if ( ! in_array( $name, LANG_CORE_BLOCKS, true ) || trim( $content ) === '' ) {
			return $content;
		}
		$lang = isset( $block['attrs']['awtLang'] ) ? trim( (string) $block['attrs']['awtLang'] ) : '';
		if ( $lang === '' ) {
			return $content;
		}
		if ( ! preg_match( '/<[a-zA-Z][^>]*>/', $content, $m, PREG_OFFSET_CAPTURE ) ) {
			return $content;
		}
		$tag = $m[0][0];
		if ( preg_match( '/\slang=/i', $tag ) ) {
			return $content; // Don't clobber an existing lang.
		}
		$new_tag = preg_replace( '/(\s*\/?>)$/', ' lang="' . esc_attr( $lang ) . '"$1', $tag, 1 );
		return substr_replace( $content, $new_tag, (int) $m[0][1], strlen( $tag ) );
	},
	11,
	2
);

/**
 * Normalize a spacing token to one of 01–13, falling back to the default.
 *
 * @param mixed $token Raw token value.
 */
function clamp_token( $token ): string {
	$token = (string) $token;
	return preg_match( '/^(0[1-9]|1[0-3])$/', $token ) ? $token : SPACING_DEFAULT;
}

/**
 * Inject the `awt-spacing-NN` class onto the rendered block's outer element.
 */
add_filter(
	'render_block',
	static function ( string $content, array $block, $instance = null ): string {
		$name = $block['blockName'] ?? '';
		if ( strpos( $name, PREFIX ) !== 0 || trim( $content ) === '' ) {
			return $content;
		}
		// Skip child/inline blocks (declared parent) and UI-shell blocks
		// (structural template-part layouts) — same scope as the attribute.
		$type = \WP_Block_Type_Registry::get_instance()->get_registered( $name );
		if ( $type && ( ! empty( $type->parent ) || $type->category === 'awt-ui-shell' ) ) {
			return $content;
		}

		// A FAQ question declares no parent, because it is equally valid on its
		// own — but inside an accordion it is one row of a list, and a row may
		// not carry the standalone gap below it. The gap pushes the next row's
		// divider down and leaves a strip that the hover and focus styles do
		// not reach, so the row stops looking like one thing. The accordion's
		// context is the signal, the same one the block uses to choose <li>.
		if ( $instance instanceof \WP_Block && isset( $instance->context['awt/accordion/size'] ) ) {
			return $content;
		}

		// awt/section's "No gap below" switch wins over the spacing token:
		// the section sits flush against whatever follows it.
		if ( $name === 'awt/section' && ! empty( $block['attrs']['noGapBelow'] ) ) {
			$class = 'awt-spacing-none';
		} else {
			$token = clamp_token( $block['attrs']['awtSpacing'] ?? SPACING_DEFAULT );
			$class = 'awt-spacing-' . $token;
		}

		// Add the class to the FIRST opening tag of the rendered output.
		if ( ! preg_match( '/<[a-zA-Z][^>]*>/', $content, $m, PREG_OFFSET_CAPTURE ) ) {
			return $content;
		}
		$tag    = $m[0][0];
		$offset = (int) $m[0][1];

		if ( preg_match( '/\sclass="([^"]*)"/', $tag, $cm ) ) {
			$new_tag = str_replace( $cm[0], ' class="' . $cm[1] . ' ' . $class . '"', $tag );
		} else {
			// No class attribute on the first tag — add one before the close.
			$new_tag = preg_replace( '/(\s*\/?>)$/', ' class="' . $class . '"$1', $tag, 1 );
		}

		return substr_replace( $content, $new_tag, $offset, strlen( $tag ) );
	},
	10,
	3
);

/**
 * Enqueue the editor UI (Spacing panel + Carbon doc links).
 */
add_action(
	'enqueue_block_editor_assets',
	static function (): void {
		// Always the build/ copy, never the original in assets/: that one
		// carries the comments explaining the panel, and nothing a browser
		// downloads should (scripts/mirror-runtime-into-build.js compiles one
		// into the other, as the last step of npm run build).
		$rel  = 'build/assets/global-block-controls.js';
		$path = \AWT\Blocks\AWT_BLOCKS_DIR . '/' . $rel;
		if ( ! file_exists( $path ) ) {
			return;
		}
		wp_enqueue_script(
			'awt-global-block-controls',
			plugins_url( $rel, \AWT\Blocks\AWT_BLOCKS_FILE ),
			array( 'wp-hooks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-compose', 'wp-i18n', 'wp-blocks' ),
			(string) filemtime( $path ),
			true
		);
		wp_set_script_translations( 'awt-global-block-controls', 'awt-blocks' );
	}
);
