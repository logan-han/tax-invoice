import type { jsPDF } from 'jspdf';

/** A word on the invoice, positioned as fractions of the paper's width. */
export interface TextRun {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

// What the built-in PDF fonts can encode (Windows-1252). Other words would copy out as junk.
const ENCODABLE = /^[\x20-\x7e\xa0-\xff€‚„…†‡‰‹›‘’“”•–—™]+$/;

// A text box is about 1.2 times its font size tall.
const BOX_TO_FONT = 1 / 1.2;
const PT_PER_MM = 72 / 25.4;

/** Every visible word inside `root`, skipping editor placeholders. */
export const collectTextRuns = (root: HTMLElement): TextRun[] => {
  const origin = root.getBoundingClientRect();
  if (!origin.width) return [];
  const runs: TextRun[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest('[data-placeholder]')) continue;
    const content = node.textContent ?? '';
    for (const match of content.matchAll(/\S+/g)) {
      if (!ENCODABLE.test(match[0])) continue;
      // Keep a following space so copied text doesn't run words together.
      const end = match.index + match[0].length;
      const spaced = /\s/.test(content.charAt(end));
      range.setStart(node, match.index);
      range.setEnd(node, spaced ? end + 1 : end);
      const box = range.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      runs.push({
        text: spaced ? `${match[0]} ` : match[0],
        left: (box.left - origin.left) / origin.width,
        top: (box.top - origin.top) / origin.width,
        width: box.width / origin.width,
        height: box.height / origin.width,
      });
    }
  }
  return runs;
};

/**
 * Lays the words over the page images as invisible text, the way OCR'd scans do, so the PDF can
 * be searched and its bank details copied. `yScale` is any vertical stretch applied to the image.
 */
export const addTextLayer = (pdf: jsPDF, runs: TextRun[], yScale = 1): void => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pages = pdf.getNumberOfPages();
  pdf.setFont('helvetica', 'normal');

  for (const run of runs) {
    const top = run.top * pageWidth * yScale;
    const page = Math.min(Math.floor(top / pageHeight), pages - 1);
    pdf.setPage(page + 1);
    pdf.setFontSize(run.height * pageWidth * yScale * BOX_TO_FONT * PT_PER_MM);
    const naturalWidth = pdf.getTextWidth(run.text);
    if (!naturalWidth) continue;
    pdf.text(run.text, run.left * pageWidth, top - page * pageHeight, {
      baseline: 'top',
      renderingMode: 'invisible',
      horizontalScale: (run.width * pageWidth) / naturalWidth,
    });
  }
};
