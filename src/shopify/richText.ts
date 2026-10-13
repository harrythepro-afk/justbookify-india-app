/**
 * A book's description, from Shopify's `descriptionHtml` to blocks of native text (P6-05, D-091).
 * The HTML is untrusted input: it is read by this small tokenizer, never by a web view, and only
 * a safe set of tags keeps a meaning. `p`, `br`, `strong`, `b`, `em`, `i`, `ul`, `ol` and `li`
 * are kept; `div`, `h1` to `h6`, `blockquote`, `tr` and `table` only end a paragraph (headings
 * are bold), so each table row is its own block, and the cells of one row are joined by " · ",
 * empty cells skipped (P6-10, D-112); every other tag is dropped and its text kept, so a link is
 * plain text. Attributes are never read. `script`, `style` and the other elements in
 * `DROPPED_WITH_CONTENT` lose their content too. The tokenizer never throws, never recurses and reads the input once, so broken
 * markup, deep nesting and very long text are safe.
 */

/** A run of text with one style. */
export type RichSpan = { readonly text: string; readonly bold: boolean; readonly italic: boolean };

/**
 * A paragraph, or one line of a list. A list line's marker is "•", or "1.", "2." in a numbered
 * list; it is "" for a further paragraph inside the same list item. `depth` is 0 for a top list.
 */
export type RichTextBlock =
  | { readonly kind: 'paragraph'; readonly spans: readonly RichSpan[] }
  | {
      readonly kind: 'list-item';
      readonly marker: string;
      readonly depth: number;
      readonly spans: readonly RichSpan[];
    };

/** Elements whose content is never shown. */
const DROPPED_WITH_CONTENT = new Set([
  'script',
  'style',
  'template',
  'noscript',
  'iframe',
  'object',
  'svg',
  'head',
  'title',
  'textarea',
]);

/** Elements that end the current paragraph and keep no other meaning (owner, P6-05). */
const PARAGRAPH_BREAKS = new Set(['p', 'div', 'blockquote', 'tr', 'table']);

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/** Table cells: a header cell is read like any other (owner, P6-10). */
const TABLE_CELLS = new Set(['td', 'th']);

/** Between two cells of one table row: a space, a middle dot, a space (owner, P6-10, D-112). */
export const CELL_SEPARATOR = ' · ';

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  hellip: '\u2026',
  mdash: '\u2014',
  ndash: '\u2013',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  bull: '\u2022',
  middot: '\u00b7',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
};

// Numeric references from 0x80 to 0x9F mean Windows-1252 characters, as browsers read them
// (text pasted from a word processor often carries them). Unlisted ones stay as they are.
const WINDOWS_1252: Readonly<Record<number, number>> = {
  0x80: 0x20ac,
  0x82: 0x201a,
  0x83: 0x0192,
  0x84: 0x201e,
  0x85: 0x2026,
  0x86: 0x2020,
  0x87: 0x2021,
  0x88: 0x02c6,
  0x89: 0x2030,
  0x8a: 0x0160,
  0x8b: 0x2039,
  0x8c: 0x0152,
  0x8e: 0x017d,
  0x91: 0x2018,
  0x92: 0x2019,
  0x93: 0x201c,
  0x94: 0x201d,
  0x95: 0x2022,
  0x96: 0x2013,
  0x97: 0x2014,
  0x98: 0x02dc,
  0x99: 0x2122,
  0x9a: 0x0161,
  0x9b: 0x203a,
  0x9c: 0x0153,
  0x9e: 0x017e,
  0x9f: 0x0178,
};

const REPLACEMENT = '\ufffd';
const ENTITY = /&(?:#(\d+);?|#[xX]([0-9a-fA-F]+);?|([a-zA-Z][a-zA-Z0-9]*);)/g;
// HTML's whitespace, and the no-break space, which renders as a space here.
const WHITESPACE = /[ \t\n\r\f\u00a0]+/g;
// Control characters other than whitespace have no place in shown text, including the C1 range
// that a numeric reference outside the Windows-1252 table leaves.
const CONTROL = /[\u0000-\u0008\u000b\u000e-\u001f\u007f-\u009f]/g;

function fromCodePoint(value: number): string {
  if (!Number.isFinite(value) || value === 0 || value > 0x10ffff) return REPLACEMENT;
  if (value >= 0xd800 && value <= 0xdfff) return REPLACEMENT;
  return String.fromCodePoint(WINDOWS_1252[value] ?? value);
}

/** Decodes character references; an unknown named one stays as written. */
export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text;
  return text.replace(
    ENTITY,
    (whole, decimal: string | undefined, hex: string | undefined, name: string | undefined) => {
      if (decimal !== undefined) return fromCodePoint(Number.parseInt(decimal, 10));
      if (hex !== undefined) return fromCodePoint(Number.parseInt(hex, 16));
      return (name !== undefined ? NAMED_ENTITIES[name] : undefined) ?? whole;
    },
  );
}

function isSpace(ch: string | undefined): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
}

function isLetter(ch: string | undefined): boolean {
  return ch !== undefined && ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z'));
}

/**
 * The index of the `>` that ends a tag whose attributes start at `from`, or -1 when the input
 * ends first. A quote opens a value only straight after `=`, so a `>` inside a quoted value
 * does not end the tag.
 */
function tagEnd(html: string, from: number): number {
  let i = from;
  while (i < html.length) {
    const ch = html[i];
    if (ch === '>') return i;
    if (ch === '=') {
      i += 1;
      while (isSpace(html[i])) i += 1;
      const quote = html[i];
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, i + 1);
        if (close === -1) return -1;
        i = close + 1;
      }
      continue;
    }
    i += 1;
  }
  return -1;
}

/** The index after the close tag of a dropped element, or the input's end when there is none. */
function droppedContentEnd(html: string, from: number, name: string): number {
  let at = html.indexOf('</', from);
  while (at !== -1) {
    const after = at + 2 + name.length;
    const next = html[after];
    if (
      html.slice(at + 2, after).toLowerCase() === name &&
      (next === undefined || next === '>' || next === '/' || isSpace(next))
    ) {
      const end = tagEnd(html, after);
      return end === -1 ? html.length : end + 1;
    }
    at = html.indexOf('</', at + 2);
  }
  return html.length;
}

/** The end of a tag name: letters, digits and anything else up to whitespace, `/` or `>`. */
function nameEnd(html: string, from: number): number {
  let i = from;
  while (i < html.length && !isSpace(html[i]) && html[i] !== '/' && html[i] !== '>') i += 1;
  return i;
}

type MutableSpan = { text: string; bold: boolean; italic: boolean };
type OpenBlock = { marker: string | null; depth: number; spans: MutableSpan[] };
type OpenList = { readonly ordered: boolean; count: number; itemOpen: boolean };

/**
 * Collapses the whitespace in a block as HTML shows it: one space between words, none at the
 * block's edges or around a line break. Returns no spans when nothing visible is left.
 */
function finishSpans(raw: readonly MutableSpan[]): RichSpan[] {
  const out: MutableSpan[] = [];
  let pendingSpace: MutableSpan | null = null;
  let pendingBreaks = 0;
  let lineStart = true;

  const emit = (text: string, style: MutableSpan) => {
    const last = out[out.length - 1];
    if (last !== undefined && last.bold === style.bold && last.italic === style.italic) {
      last.text += text;
    } else {
      out.push({ text, bold: style.bold, italic: style.italic });
    }
  };

  for (const span of raw) {
    let runStart = -1;
    const flushRun = (end: number) => {
      if (runStart === -1) return;
      if (pendingBreaks > 0) emit('\n'.repeat(pendingBreaks), span);
      else if (pendingSpace !== null) emit(' ', pendingSpace);
      pendingBreaks = 0;
      pendingSpace = null;
      lineStart = false;
      emit(span.text.slice(runStart, end), span);
      runStart = -1;
    };
    for (let i = 0; i < span.text.length; i += 1) {
      const ch = span.text[i];
      if (ch === ' ') {
        flushRun(i);
        if (!lineStart && pendingSpace === null) pendingSpace = span;
      } else if (ch === '\n') {
        flushRun(i);
        pendingSpace = null;
        if (out.length > 0) pendingBreaks += 1;
        lineStart = true;
      } else if (runStart === -1) {
        runStart = i;
      }
    }
    flushRun(span.text.length);
  }
  return out;
}

/** Shopify's description HTML as blocks of native text. Never throws. */
export function parseDescriptionHtml(html: string): RichTextBlock[] {
  const blocks: RichTextBlock[] = [];
  const lists: OpenList[] = [];
  let orphanItemOpen = false;
  let boldDepth = 0;
  let italicDepth = 0;
  let headingDepth = 0;

  // A new block is a further paragraph of the open list item, if any, or a plain paragraph.
  const freshBlock = (): OpenBlock => {
    const top = lists[lists.length - 1];
    if (top?.itemOpen === true) return { marker: '', depth: lists.length - 1, spans: [] };
    if (orphanItemOpen) return { marker: '', depth: 0, spans: [] };
    return { marker: null, depth: 0, spans: [] };
  };
  let block = freshBlock();

  const endBlock = () => {
    // A list item that has no text yet keeps its marker through a `<p>` inside it.
    if (block.marker !== null && block.marker !== '') {
      const empty = block.spans.every((span) => span.text.trim() === '');
      if (empty) return;
    }
    const spans = finishSpans(block.spans);
    if (spans.length > 0) {
      blocks.push(
        block.marker === null
          ? { kind: 'paragraph', spans }
          : { kind: 'list-item', marker: block.marker, depth: block.depth, spans },
      );
    }
    block = freshBlock();
  };

  // Ends the current block even if it is an empty list item, so its marker is not carried on.
  const closeBlock = () => {
    const spans = finishSpans(block.spans);
    if (spans.length > 0) {
      blocks.push(
        block.marker === null
          ? { kind: 'paragraph', spans }
          : { kind: 'list-item', marker: block.marker, depth: block.depth, spans },
      );
    }
    block = freshBlock();
  };

  // The block whose next visible text starts a new table cell. A row is one block (`tr` ends a
  // paragraph), so a cell after one with text gets the separator before its own text; a cell
  // with no text never adds one (owner, P6-10, D-112). A block replaced since is a new object.
  let cellAwaitingSeparator: OpenBlock | null = null;

  const addText = (raw: string) => {
    const text = decodeEntities(raw).replace(CONTROL, '').replace(WHITESPACE, ' ');
    if (text === '') return;
    if (cellAwaitingSeparator === block && text.trim() !== '') {
      block.spans.push({ text: CELL_SEPARATOR, bold: false, italic: false });
      cellAwaitingSeparator = null;
    }
    block.spans.push({ text, bold: boldDepth > 0 || headingDepth > 0, italic: italicDepth > 0 });
  };

  const startCell = () => {
    if (block.spans.some((span) => span.text.trim() !== '')) cellAwaitingSeparator = block;
  };

  const addLineBreak = () => {
    block.spans.push({ text: '\n', bold: false, italic: false });
  };

  const openTag = (name: string) => {
    if (PARAGRAPH_BREAKS.has(name)) endBlock();
    else if (HEADINGS.has(name)) {
      endBlock();
      headingDepth += 1;
    } else if (name === 'br') addLineBreak();
    else if (TABLE_CELLS.has(name)) startCell();
    else if (name === 'strong' || name === 'b') boldDepth += 1;
    else if (name === 'em' || name === 'i') italicDepth += 1;
    else if (name === 'ul' || name === 'ol') {
      closeBlock();
      lists.push({ ordered: name === 'ol', count: 0, itemOpen: false });
      block = freshBlock();
    } else if (name === 'li') {
      closeBlock();
      const top = lists[lists.length - 1];
      if (top === undefined) {
        orphanItemOpen = true;
        block = { marker: '•', depth: 0, spans: [] };
      } else {
        top.itemOpen = true;
        top.count += 1;
        block = {
          marker: top.ordered ? `${top.count}.` : '•',
          depth: lists.length - 1,
          spans: [],
        };
      }
    }
  };

  const closeTag = (name: string) => {
    if (PARAGRAPH_BREAKS.has(name)) endBlock();
    else if (HEADINGS.has(name)) {
      endBlock();
      headingDepth = Math.max(0, headingDepth - 1);
    } else if (name === 'strong' || name === 'b') boldDepth = Math.max(0, boldDepth - 1);
    else if (name === 'em' || name === 'i') italicDepth = Math.max(0, italicDepth - 1);
    else if (name === 'ul' || name === 'ol') {
      closeBlock();
      lists.pop();
      block = freshBlock();
    } else if (name === 'li') {
      closeBlock();
      const top = lists[lists.length - 1];
      if (top === undefined) orphanItemOpen = false;
      else top.itemOpen = false;
      block = freshBlock();
    }
  };

  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      addText(html.slice(i));
      break;
    }
    if (lt > i) addText(html.slice(i, lt));

    const next = html[lt + 1];
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? html.length : end + 3;
    } else if (next === '!' || next === '?') {
      // A doctype, CDATA section or processing instruction: dropped up to its `>`.
      const close = html.startsWith('<![CDATA[', lt) ? html.indexOf(']]>', lt) : -1;
      const end = close !== -1 ? close + 2 : html.indexOf('>', lt);
      i = end === -1 ? html.length : end + 1;
    } else if (next === '/' && isLetter(html[lt + 2])) {
      const afterName = nameEnd(html, lt + 2);
      const end = tagEnd(html, afterName);
      if (end === -1) break; // An unfinished tag at the end of the input is dropped.
      closeTag(html.slice(lt + 2, afterName).toLowerCase());
      i = end + 1;
    } else if (isLetter(next)) {
      const afterName = nameEnd(html, lt + 1);
      const end = tagEnd(html, afterName);
      if (end === -1) break;
      const name = html.slice(lt + 1, afterName).toLowerCase();
      // A self-closed `<svg/>` or `<script/>` has no content to drop. Text after it is shown as
      // text, never run, so reading it as empty can only show more of the description.
      const dropsContent = DROPPED_WITH_CONTENT.has(name) && html[end - 1] !== '/';
      if (dropsContent) i = droppedContentEnd(html, end + 1, name);
      else {
        openTag(name);
        i = end + 1;
      }
    } else {
      // A `<` that starts no tag is text, as in "3 < 4".
      addText('<');
      i = lt + 1;
    }
  }
  closeBlock();
  return blocks;
}
