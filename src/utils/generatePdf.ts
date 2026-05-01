import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateInvoicePdf(invoiceNumber: string): Promise<void> {
  const input = document.getElementById('invoice');
  if (!input) return;

  // html2canvas measures glyph advance widths at call time. If the
  // Google-served web fonts (Inter / Instrument Serif / JetBrains Mono)
  // haven't actually painted yet, fallback metrics are used and adjacent
  // characters glue together in the raster. `document.fonts.ready` alone
  // isn't enough — Google Fonts entries only fetch on use, so we force
  // each variant we render with.
  if (document.fonts) {
    const faces = [
      '400 13px "Inter"',
      '500 13px "Inter"',
      '600 13px "Inter"',
      '400 28px "Instrument Serif"',
      'italic 16px "Instrument Serif"',
      '400 10px "JetBrains Mono"',
      '500 10px "JetBrains Mono"',
    ];
    await Promise.all(
      faces.map((f) =>
        document.fonts.load(f).catch(() => {
          /* ignore missing */
        })
      )
    );
    if (typeof document.fonts.ready?.then === 'function') {
      await document.fonts.ready;
    }
  }

  const canvas = await html2canvas(input, {
    scale: 2.5,
    useCORS: true,
    logging: false,
    letterRendering: true,
    allowTaint: true,
    backgroundColor: '#fefdf9',
    // html2canvas 1.4.1 cannot parse oklch(). The app UI uses oklch via
    // CSS variables on :root, body and .preview-pane, so strip those from
    // the cloned document before painting. The #invoice subtree is hex only.
    onclone: (doc) => {
      const strip = (sel: string) => {
        doc.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          el.style.background = '#ffffff';
          el.style.backgroundColor = '#ffffff';
          el.style.backgroundImage = 'none';
          el.style.color = '#2b2e38';
          el.style.borderColor = '#dddde3';
        });
      };
      strip('html, body, .app, .editor, .preview-pane, .paper-wrap');
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
  if (imgHeight <= pdfHeight + nearA4ToleranceMm) {
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

  pdf.save(`invoice-${invoiceNumber}.pdf`);
}
