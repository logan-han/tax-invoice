import { describe, it, expect, vi, afterEach } from 'vitest';
import type { jsPDF } from 'jspdf';
import { addTextLayer, collectTextRuns, type TextRun } from '../pdfTextLayer';

// jsdom has no layout: give the paper and every word a box. Each character is 6px wide
// and words sit on 20px rows, one row per text node.
const layOut = (root: HTMLElement) => {
  root.getBoundingClientRect = () => ({ left: 100, top: 50, width: 600, height: 800 }) as DOMRect;
  const nodes: Node[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  // jsdom doesn't implement Range.getBoundingClientRect at all.
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: function (this: Range) {
      const row = nodes.indexOf(this.startContainer);
      const hidden = (this.startContainer.parentElement as HTMLElement).style.display === 'none';
      return {
        left: 100 + this.startOffset * 6,
        top: 50 + row * 20,
        width: hidden ? 0 : (this.endOffset - this.startOffset) * 6,
        height: hidden ? 0 : 12,
      } as DOMRect;
    },
  });
};

afterEach(() => {
  delete (Range.prototype as Partial<Range>).getBoundingClientRect;
  document.body.innerHTML = '';
});

describe('collectTextRuns', () => {
  it('returns each word with its box as fractions of the paper width', () => {
    document.body.innerHTML = '<div id="paper"><p>BSB 063-000</p><p>Total $1,336.50</p></div>';
    const paper = document.getElementById('paper') as HTMLElement;
    layOut(paper);

    // Words keep the space after them, box included, so copied text reads naturally.
    expect(collectTextRuns(paper)).toEqual([
      { text: 'BSB ', left: 0, top: 0, width: 24 / 600, height: 12 / 600 },
      { text: '063-000', left: 24 / 600, top: 0, width: 42 / 600, height: 12 / 600 },
      { text: 'Total ', left: 0, top: 20 / 600, width: 36 / 600, height: 12 / 600 },
      { text: '$1,336.50', left: 36 / 600, top: 20 / 600, width: 54 / 600, height: 12 / 600 },
    ]);
  });

  it('skips placeholders, hidden text and characters the PDF fonts cannot encode', () => {
    document.body.innerHTML =
      '<div id="paper"><p data-placeholder="">Add BSB</p><p style="display:none">Hidden</p>' +
      '<p>Pay ₹500 — €20 now</p></div>';
    const paper = document.getElementById('paper') as HTMLElement;
    layOut(paper);

    expect(collectTextRuns(paper).map((r) => r.text)).toEqual(['Pay ', '— ', '€20 ', 'now']);
  });

  it('returns nothing when the paper has no size', () => {
    document.body.innerHTML = '<div id="paper">Text</div>';
    expect(collectTextRuns(document.getElementById('paper') as HTMLElement)).toEqual([]);
  });
});

describe('addTextLayer', () => {
  const fakePdf = (pages = 1) => {
    let fontSize = 0;
    return {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      getNumberOfPages: vi.fn(() => pages),
      setFont: vi.fn(),
      setPage: vi.fn(),
      setFontSize: vi.fn((size: number) => {
        fontSize = size;
      }),
      // Helvetica-ish: half an em per character, in mm.
      getTextWidth: vi.fn((text: string) => (text.length * fontSize * 0.5) / (72 / 25.4)),
      text: vi.fn(),
    };
  };

  const run = (text: string, top: number): TextRun => ({
    text,
    left: 0.1,
    top,
    width: 0.2,
    height: 12 / 595,
  });

  it('writes invisible text stretched to each word box', () => {
    const pdf = fakePdf();
    addTextLayer(pdf as unknown as jsPDF, [run('Consulting', 0.5)]);

    const [text, x, y, options] = pdf.text.mock.calls[0];
    expect(text).toBe('Consulting');
    expect(x).toBeCloseTo(21);
    expect(y).toBeCloseTo(105);
    expect(options).toMatchObject({ baseline: 'top', renderingMode: 'invisible' });
    // The rendered width matches the word box: 20% of 210mm.
    expect(pdf.getTextWidth.mock.results[0].value * options.horizontalScale).toBeCloseTo(42);
    // 12px of box on a 595px-wide paper is a 10pt font.
    expect(pdf.setFontSize.mock.calls[0][0]).toBeCloseTo(10, 0);
  });

  it('puts words on the page their part of the image landed on', () => {
    const pdf = fakePdf(2);
    addTextLayer(pdf as unknown as jsPDF, [run('first', 0.1), run('second', 1.6)]);

    expect(pdf.setPage.mock.calls).toEqual([[1], [2]]);
    expect(pdf.text.mock.calls[1][2]).toBeCloseTo(1.6 * 210 - 297);
  });

  it('follows a vertically stretched image', () => {
    const pdf = fakePdf();
    addTextLayer(pdf as unknown as jsPDF, [run('word', 1)], 1.01);
    expect(pdf.text.mock.calls[0][2]).toBeCloseTo(212.1);
  });

  it('skips text it cannot measure', () => {
    const pdf = fakePdf();
    pdf.getTextWidth.mockReturnValue(0);
    addTextLayer(pdf as unknown as jsPDF, [run('x', 0)]);
    expect(pdf.text).not.toHaveBeenCalled();
  });
});
