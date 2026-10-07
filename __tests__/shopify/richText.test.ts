/**
 * The description parser (P6-05, D-091). Shopify's description HTML is untrusted input: these
 * tests feed it the live store's shape, every kept tag, and hostile or broken markup.
 */

import { decodeEntities, parseDescriptionHtml, type RichTextBlock } from '@/shopify/richText';

// Special characters are built from code points, so the source holds no escapes.
const NL = String.fromCharCode(10);
const NBSP = String.fromCharCode(0xa0);
const REPLACEMENT = String.fromCharCode(0xfffd);

/** Each block's text, with list markers in front. */
function lines(html: string): string[] {
  return parseDescriptionHtml(html).map((block) => {
    const text = block.spans.map((span) => span.text).join('');
    return block.kind === 'list-item' ? `${block.marker}|${block.depth}|${text}` : text;
  });
}

function only(blocks: RichTextBlock[]): RichTextBlock {
  expect(blocks).toHaveLength(1);
  const [block] = blocks;
  if (block === undefined) throw new Error('expected a block');
  return block;
}

describe('the live store shape (architect, 8 October 2026)', () => {
  const LIVE_SHAPE =
    '<p><span style="font-weight: 400;">A boy wizard returns for his sixth year.</span></p>' +
    '<p><strong>Perfect for readers, who:</strong><br>• Love magic<br>• Like long series</p>' +
    "<p><strong>Why You'll Love It:</strong><br>✅ Funny and warm<br>❌ Not a short read</p>";

  it('keeps paragraphs, bold headings and line breaks, and drops the span', () => {
    const blocks = parseDescriptionHtml(LIVE_SHAPE);

    expect(blocks).toEqual([
      {
        kind: 'paragraph',
        spans: [{ text: 'A boy wizard returns for his sixth year.', bold: false, italic: false }],
      },
      {
        kind: 'paragraph',
        spans: [
          { text: 'Perfect for readers, who:', bold: true, italic: false },
          { text: `${NL}• Love magic${NL}• Like long series`, bold: false, italic: false },
        ],
      },
      {
        kind: 'paragraph',
        spans: [
          { text: "Why You'll Love It:", bold: true, italic: false },
          { text: `${NL}✅ Funny and warm${NL}❌ Not a short read`, bold: false, italic: false },
        ],
      },
    ]);
  });
});

describe('kept tags', () => {
  it('reads strong and b as bold, em and i as italic, in any case', () => {
    const block = only(
      parseDescriptionHtml('<P>a <STRONG>b</STRONG> <b>c</b> <em>d</em> <I>e</I></P>'),
    );

    expect(block.spans).toEqual([
      { text: 'a ', bold: false, italic: false },
      { text: 'b', bold: true, italic: false },
      { text: ' ', bold: false, italic: false },
      { text: 'c', bold: true, italic: false },
      { text: ' ', bold: false, italic: false },
      { text: 'd', bold: false, italic: true },
      { text: ' ', bold: false, italic: false },
      { text: 'e', bold: false, italic: true },
    ]);
  });

  it('combines bold and italic when nested', () => {
    const block = only(parseDescriptionHtml('<b>bold <i>both</i></b>'));

    expect(block.spans).toEqual([
      { text: 'bold ', bold: true, italic: false },
      { text: 'both', bold: true, italic: true },
    ]);
  });

  it('gives bullets for ul and numbers counted per list for ol', () => {
    expect(
      lines('<ul><li>one</li><li>two</li></ul><ol><li>first</li><li>second</li></ol><p>after</p>'),
    ).toEqual(['•|0|one', '•|0|two', '1.|0|first', '2.|0|second', 'after']);
  });

  it('indents a nested list and counts each list on its own', () => {
    expect(lines('<ol><li>a<ol><li>a1</li><li>a2</li></ol></li><li>b</li></ol>')).toEqual([
      '1.|0|a',
      '1.|1|a1',
      '2.|1|a2',
      '2.|0|b',
    ]);
  });

  it('keeps the marker for a list item that wraps its text in p', () => {
    expect(lines('<ul><li><p>wrapped</p></li><li>plain</li></ul>')).toEqual([
      '•|0|wrapped',
      '•|0|plain',
    ]);
  });

  it('shows a second paragraph inside an item as an unmarked line of the list', () => {
    expect(lines('<ul><li><p>first</p><p>more</p></li></ul>')).toEqual(['•|0|first', '|0|more']);
  });

  it('closes an item that the next li opens without closing it', () => {
    expect(lines('<ul><li>one<li>two</ul>')).toEqual(['•|0|one', '•|0|two']);
  });

  it('gives an li outside any list a bullet', () => {
    expect(lines('<li>loose</li>after')).toEqual(['•|0|loose', 'after']);
  });
});

describe('tags that only end a paragraph (owner, P6-05)', () => {
  it.each(['div', 'blockquote', 'tr', 'table'])('%s ends a paragraph and adds no style', (tag) => {
    const blocks = parseDescriptionHtml(`<${tag}>a</${tag}><${tag}>b</${tag}>`);

    expect(blocks).toEqual([
      { kind: 'paragraph', spans: [{ text: 'a', bold: false, italic: false }] },
      { kind: 'paragraph', spans: [{ text: 'b', bold: false, italic: false }] },
    ]);
  });

  it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])(
    '%s ends a paragraph and shows its text in bold',
    (tag) => {
      const blocks = parseDescriptionHtml(`before<${tag}>Heading <i>here</i></${tag}>after`);

      expect(blocks).toEqual([
        { kind: 'paragraph', spans: [{ text: 'before', bold: false, italic: false }] },
        {
          kind: 'paragraph',
          spans: [
            { text: 'Heading ', bold: true, italic: false },
            { text: 'here', bold: true, italic: true },
          ],
        },
        { kind: 'paragraph', spans: [{ text: 'after', bold: false, italic: false }] },
      ]);
    },
  );

  it('ends the bold of a heading with its close tag', () => {
    const blocks = parseDescriptionHtml('<h2>Title</h2><p>Body</p>');

    expect(blocks.map((block) => block.spans[0]?.bold)).toEqual([true, false]);
  });
});

describe('everything else is reduced to its text', () => {
  it('shows a link as plain text and keeps nothing of its address', () => {
    const blocks = parseDescriptionHtml(
      '<p>Read <a href="javascript:alert(1)" onclick="steal()">the series</a> next.</p>',
    );

    expect(lines('<p>Read <a href="javascript:alert(1)">the series</a> next.</p>')).toEqual([
      'Read the series next.',
    ]);
    expect(JSON.stringify(blocks)).not.toMatch(/javascript|alert|onclick|steal|href/);
  });

  it('drops unknown tags and keeps their text: span, font, img, hr, custom elements', () => {
    expect(
      lines(
        '<p><font color="red">Red</font> <img src="x.png" alt="pic"><hr><my-tag>Own</my-tag></p>',
      ),
    ).toEqual(['Red Own']);
  });

  it('never reads attributes, even a quoted value holding a close bracket', () => {
    expect(lines('<span title="a > b">x</span><span title=\'c > d\'>y</span>')).toEqual(['xy']);
  });

  it('does not treat a quote that follows no equals sign as an attribute value', () => {
    expect(lines('<span "odd>x</span>')).toEqual(['x']);
  });
});

describe('content that is never shown', () => {
  it('drops script and style with their content, in any case and with attributes', () => {
    expect(
      lines(
        '<p>a<script type="text/javascript">alert("x > y")</script>b' +
          '<STYLE>p { color: red }</STYLE >c<script>var s = "</scr" + "ipt>";</script>d</p>',
      ),
    ).toEqual(['abcd']);
  });

  it('drops everything after a script that is never closed', () => {
    expect(lines('<p>visible</p><script>alert(1)<p>hidden</p>')).toEqual(['visible']);
  });

  it.each(['template', 'noscript', 'iframe', 'object', 'svg', 'head', 'title', 'textarea'])(
    'drops %s with its content',
    (tag) => {
      expect(lines(`<p>a<${tag} x="1">hidden</${tag}>b</p>`)).toEqual(['ab']);
    },
  );

  it('reads a self-closed script or svg as empty, so later text still shows', () => {
    expect(lines('<p>a<script src="x.js"/>b<svg/>c</p>')).toEqual(['abc']);
  });

  it('drops comments, a doctype, CDATA and processing instructions', () => {
    expect(
      lines(
        '<!DOCTYPE html><?xml version="1.0"?><p>a<!-- hidden <b>bold</b> -->b<![CDATA[x > y]]>c</p>',
      ),
    ).toEqual(['abc']);
  });

  it('drops everything after a comment that is never closed', () => {
    expect(lines('<p>a<!-- open')).toEqual(['a']);
  });

  it('removes control characters', () => {
    expect(lines(`a${String.fromCharCode(7)}b${String.fromCharCode(0x85)}c`)).toEqual(['abc']);
  });
});

describe('broken markup', () => {
  it('keeps bold to the end when a tag is never closed', () => {
    const block = only(parseDescriptionHtml('<p>plain <b>bold to the end'));

    expect(block.spans).toEqual([
      { text: 'plain ', bold: false, italic: false },
      { text: 'bold to the end', bold: true, italic: false },
    ]);
  });

  it('ignores close tags with nothing open', () => {
    expect(parseDescriptionHtml('</b></i></li></ul></h2></p>text')).toEqual([
      { kind: 'paragraph', spans: [{ text: 'text', bold: false, italic: false }] },
    ]);
  });

  it('ends each style at its own close tag when tags are misnested', () => {
    const block = only(parseDescriptionHtml('<b><i>both</b>italic</i>plain'));

    expect(block.spans).toEqual([
      { text: 'both', bold: true, italic: true },
      { text: 'italic', bold: false, italic: true },
      { text: 'plain', bold: false, italic: false },
    ]);
  });

  it('shows a less-than sign that starts no tag as text', () => {
    expect(lines('3 < 4 and 5 <= 6 and <3 and </ 7')).toEqual(['3 < 4 and 5 <= 6 and <3 and </ 7']);
  });

  it('drops an unfinished tag at the end of the input', () => {
    expect(lines('kept <b class="x')).toEqual(['kept']);
    expect(lines('kept <span')).toEqual(['kept']);
  });

  it('never throws, for any of a set of hostile inputs', () => {
    const inputs = [
      '<',
      '>',
      '<>',
      '</>',
      '<!',
      '<!-',
      '<?',
      '<a',
      '<a href=',
      '<a href="',
      "<a href='",
      '&',
      '&#',
      '&#x',
      '&;',
      '<ul><ol><li>',
      '</ul></ol></li>',
      '<p<p<p>>>',
      '<<<>>>',
      '<script',
      '<script>',
      '</script>',
    ];
    for (const input of inputs) {
      expect(() => parseDescriptionHtml(input)).not.toThrow();
    }
  });
});

describe('character references', () => {
  it('decodes the common named references', () => {
    expect(decodeEntities('&amp; &lt; &gt; &quot; &apos;')).toBe('& < > " \'');
    expect(decodeEntities('&hellip;&mdash;&ndash;&lsquo;&rsquo;&ldquo;&rdquo;&bull;')).toBe(
      '…—–‘’“”•',
    );
    expect(decodeEntities('&middot;&copy;&reg;&trade;')).toBe('·©®™');
  });

  it('shows an encoded tag as text, never as a tag', () => {
    const block = only(parseDescriptionHtml('&lt;b&gt;not bold&lt;/b&gt;'));

    expect(block.spans).toEqual([{ text: '<b>not bold</b>', bold: false, italic: false }]);
  });

  it('decodes decimal and hex references, with or without the semicolon', () => {
    expect(decodeEntities('&#8377;49 &#x20B9;49 &#x20b9 &#65')).toBe('₹49 ₹49 ₹ A');
  });

  it('decodes references to emoji outside the basic plane', () => {
    expect(decodeEntities('&#x2705; &#10060; &#x1F4DA;')).toBe('✅ ❌ 📚');
  });

  it('reads 128 to 159 as Windows-1252, as browsers do', () => {
    expect(decodeEntities('&#150; &#151; &#147;quoted&#148; &#128;')).toBe('– — “quoted” €');
  });

  it('replaces a reference to no character with the replacement character', () => {
    expect(decodeEntities('&#0;|&#xD800;|&#x110000;|&#99999999999999999999;')).toBe(
      [REPLACEMENT, REPLACEMENT, REPLACEMENT, REPLACEMENT].join('|'),
    );
  });

  it('leaves an unknown name, or a name without its semicolon, as written', () => {
    expect(decodeEntities('&unknown; &amp &copy')).toBe('&unknown; &amp &copy');
  });

  it('turns a no-break space into an ordinary space', () => {
    expect(lines(`a&nbsp;&nbsp;b${NBSP}c`)).toEqual(['a b c']);
  });
});

describe('whitespace', () => {
  it('collapses runs of whitespace to one space and trims each block', () => {
    expect(lines(`  <p>  a ${NL}${NL}  b  </p>  ${NL} <p>c</p> `)).toEqual(['a b', 'c']);
  });

  it('removes spaces around a line break', () => {
    expect(lines('<p>a <br> b</p>')).toEqual([`a${NL}b`]);
  });

  it('keeps two line breaks as an empty line', () => {
    expect(lines('<p>a<br><br/>b</p>')).toEqual([`a${NL}${NL}b`]);
  });

  it('drops line breaks at the start and end of a block', () => {
    expect(lines('<p><br>a<br></p>')).toEqual(['a']);
  });

  it('drops empty paragraphs, including ones holding only a no-break space', () => {
    expect(lines('<p></p><p>&nbsp;</p><p> <br> </p><p>a</p><div></div>')).toEqual(['a']);
  });

  it('keeps one space between words split across styles', () => {
    const block = only(parseDescriptionHtml('<b>bold </b> <i> italic</i>'));

    expect(block.spans.map((span) => span.text).join('')).toBe('bold italic');
  });

  it('gives nothing for an empty description, or one with tags only', () => {
    expect(parseDescriptionHtml('')).toEqual([]);
    expect(parseDescriptionHtml('<p><br></p><div> </div><!-- note -->')).toEqual([]);
  });
});

describe('size', () => {
  it('reads a 200 KB description quickly and keeps all of its text', () => {
    const paragraph = '<p><strong>Heading</strong><br>• A line of text about the book.</p>';
    const html = paragraph.repeat(Math.ceil(200_000 / paragraph.length));
    expect(html.length).toBeGreaterThan(200_000);

    const started = Date.now();
    const blocks = parseDescriptionHtml(html);

    expect(Date.now() - started).toBeLessThan(2_000);
    expect(blocks).toHaveLength(Math.ceil(200_000 / paragraph.length));
    expect(
      blocks.every(
        (block) =>
          block.spans.map((span) => span.text).join('') ===
          `Heading${NL}• A line of text about the book.`,
      ),
    ).toBe(true);
  });

  it('reads 10,000 nested tags without running out of stack', () => {
    const depth = 10_000;
    const bold = `${'<b>'.repeat(depth)}deep${'</b>'.repeat(depth)}after`;
    const lists = `${'<ul><li>'.repeat(depth)}deepest${'</li></ul>'.repeat(depth)}after`;

    const started = Date.now();
    const boldBlocks = parseDescriptionHtml(bold);
    const listBlocks = parseDescriptionHtml(lists);

    expect(Date.now() - started).toBeLessThan(2_000);
    expect(only(boldBlocks).spans).toEqual([
      { text: 'deep', bold: true, italic: false },
      { text: 'after', bold: false, italic: false },
    ]);
    expect(listBlocks).toEqual([
      {
        kind: 'list-item',
        marker: '•',
        depth: depth - 1,
        spans: [{ text: 'deepest', bold: false, italic: false }],
      },
      { kind: 'paragraph', spans: [{ text: 'after', bold: false, italic: false }] },
    ]);
  });

  it('reads a long run of less-than signs and unknown entities in one pass', () => {
    const html = '< &x; '.repeat(50_000);

    const started = Date.now();
    const blocks = parseDescriptionHtml(html);

    expect(Date.now() - started).toBeLessThan(2_000);
    expect(only(blocks).spans[0]?.text.length).toBe(html.trim().length);
  });
});
