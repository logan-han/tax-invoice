import { addTextLayer, collectTextRuns } from './pdfTextLayer';

// html2canvas measures glyph advance widths at call time. If the Google-served web fonts
// (Inter / Instrument Serif / JetBrains Mono) haven't actually painted yet, fallback metrics are
// used and adjacent characters glue together in the raster. `document.fonts.ready` alone isn't
// enough — Google Fonts entries only fetch on use, so we force each variant we render with.
const FONT_FACES = [
  '400 13px "Inter"',
  '500 13px "Inter"',
  '600 13px "Inter"',
  '400 28px "Instrument Serif"',
  'italic 16px "Instrument Serif"',
  '400 10px "JetBrains Mono"',
  '500 10px "JetBrains Mono"',
];

const fileNameFor = (invoiceNumber: string): string => {
  const safe = invoiceNumber.replace(/[\\/:*?"<>|\s]+/g, '-');
  return `invoice-${safe || 'draft'}.pdf`;
};

export async function generateInvoicePdf(rawNumber: string, businessName = ''): Promise<void> {
  const invoiceNumber = rawNumber.trim();
  const input = document.getElementById('invoice');
  if (!input) return;

  // Loaded on first use: the two libraries are most of the bundle.
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  if (document.fonts) {
    await Promise.all(
      FONT_FACES.map((f) =>
        document.fonts.load(f).catch(() => {
          /* ignore missing */
        })
      )
    );
    if (typeof document.fonts.ready?.then === 'function') {
      await document.fonts.ready;
    }
  }

  const textRuns = collectTextRuns(input);
  const canvas = await html2canvas(input, {
    scale: 2.5,
    useCORS: true,
    logging: false,
    allowTaint: true,
    backgroundColor: '#fefdf9',
    onclone: (doc) => {
      // html2canvas 1.4.1 cannot parse oklch(). The app UI uses oklch via CSS variables on
      // :root, body and .preview-pane, so strip those from the clone. #invoice is hex only.
      doc
        .querySelectorAll<HTMLElement>('html, body, .app, .editor, .preview-pane, .paper-wrap')
        .forEach((el) => {
          el.style.background = '#ffffff';
          el.style.backgroundColor = '#ffffff';
          el.style.backgroundImage = 'none';
          el.style.color = '#2b2e38';
          el.style.borderColor = '#dddde3';
        });
      // html2canvas misplaces glyphs inside a scale() transform, so letters overlap at any preview
      // zoom other than 100%. Capture the paper unscaled.
      doc.querySelectorAll<HTMLElement>('.paper-scale').forEach((el) => {
        el.style.transform = 'none';
      });
      // Editor hints such as "Add BSB & account" don't belong on the sent invoice. Hidden rather
      // than removed so the layout doesn't shift.
      doc.querySelectorAll<HTMLElement>('#invoice [data-placeholder]').forEach((el) => {
        el.style.visibility = 'hidden';
      });
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const scaleFactor = pdfWidth / imgProps.width;
  const imgWidth = pdfWidth;
  const imgHeight = imgProps.height * scaleFactor;

  let position = 0;

  // The live paper is designed as A4, but raster capture can be a fraction
  // taller than 297mm after pixel rounding. Treat near-A4 captures as one page
  // so jsPDF does not append a blank trailing page.
  const nearA4ToleranceMm = 3;
  const singlePage = imgHeight <= pdfHeight + nearA4ToleranceMm;
  if (singlePage) {
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, pdfHeight);
  } else {
    let currentHeight = 0;
    while (currentHeight < imgHeight) {
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      currentHeight += pdfHeight;
      if (currentHeight < imgHeight) {
        pdf.addPage();
        position = -currentHeight;
      }
    }
  }

  addTextLayer(pdf, textRuns, singlePage ? pdfHeight / imgHeight : 1);
  pdf.setProperties({
    title: invoiceNumber ? `Invoice ${invoiceNumber}` : 'Invoice',
    author: businessName,
    creator: 'Australian Tax Invoice Generator',
  });
  pdf.save(fileNameFor(invoiceNumber));
}
