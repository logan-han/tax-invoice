import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { html2canvasMock, jsPDFCtor, jsPDFInstances, nextImgProps } = vi.hoisted(() => {
  const instances: Array<{
    getImageProperties: ReturnType<typeof vi.fn>;
    internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
    addImage: ReturnType<typeof vi.fn>;
    addPage: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  }> = [];
  const nextImgProps: { value: { width: number; height: number } } = {
    value: { width: 1000, height: 1414 },
  };
  const ctor = vi.fn(function () {
    const inst = {
      getImageProperties: vi.fn(() => nextImgProps.value),
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      addImage: vi.fn(),
      addPage: vi.fn(),
      save: vi.fn(),
    };
    instances.push(inst);
    return inst;
  });
  return {
    html2canvasMock: vi.fn(),
    jsPDFCtor: ctor,
    jsPDFInstances: instances,
    nextImgProps,
  };
});

vi.mock('jspdf', () => ({
  default: jsPDFCtor,
}));

vi.mock('html2canvas', () => ({
  default: html2canvasMock,
}));

import { generateInvoicePdf } from '../generatePdf';

const buildCanvas = (height = 1414) => ({
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,fake'),
  width: 1000,
  height,
});

describe('generateInvoicePdf', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="invoice"></div>';
    html2canvasMock.mockReset();
    jsPDFCtor.mockClear();
    jsPDFInstances.length = 0;
    nextImgProps.value = { width: 1000, height: 1414 };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete (document as unknown as { fonts?: unknown }).fonts;
  });

  it('returns early when no invoice element exists', async () => {
    document.body.innerHTML = '';
    await generateInvoicePdf('001');
    expect(html2canvasMock).not.toHaveBeenCalled();
    expect(jsPDFCtor).not.toHaveBeenCalled();
  });

  it('renders a single-page invoice when capture height is within A4 tolerance', async () => {
    html2canvasMock.mockResolvedValue(buildCanvas());

    await generateInvoicePdf('20250115-0001');

    expect(html2canvasMock).toHaveBeenCalledTimes(1);
    const [target, opts] = html2canvasMock.mock.calls[0];
    expect(target).toBe(document.getElementById('invoice'));
    expect(opts.scale).toBe(2.5);
    expect(opts.useCORS).toBe(true);
    expect(opts.backgroundColor).toBe('#fefdf9');

    const pdf = jsPDFInstances[0];
    expect(pdf.addImage).toHaveBeenCalledTimes(1);
    expect(pdf.addPage).not.toHaveBeenCalled();
    expect(pdf.save).toHaveBeenCalledWith('invoice-20250115-0001.pdf');
  });

  it('paginates when capture height substantially exceeds A4', async () => {
    nextImgProps.value = { width: 1000, height: 4000 };
    html2canvasMock.mockResolvedValue(buildCanvas(4000));

    await generateInvoicePdf('long');

    const pdf = jsPDFInstances[0];
    expect(pdf.addImage.mock.calls.length).toBeGreaterThan(1);
    expect(pdf.addPage).toHaveBeenCalled();
    expect(pdf.save).toHaveBeenCalledWith('invoice-long.pdf');
  });

  it('preloads required web fonts before rasterising', async () => {
    const fontLoad = vi.fn(() => Promise.resolve());
    const fontsReady = Promise.resolve();
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: fontLoad, ready: fontsReady },
    });
    html2canvasMock.mockResolvedValue(buildCanvas());

    await generateInvoicePdf('fonts');

    expect(fontLoad).toHaveBeenCalled();
    const requested = fontLoad.mock.calls.map((c) => c[0]);
    expect(requested).toContain('400 13px "Inter"');
    expect(requested).toContain('400 28px "Instrument Serif"');
    expect(requested).toContain('400 10px "JetBrains Mono"');
  });

  it('ignores failures from individual font loads', async () => {
    const fontLoad = vi.fn(() => Promise.reject(new Error('missing')));
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: fontLoad, ready: Promise.resolve() },
    });
    html2canvasMock.mockResolvedValue(buildCanvas());

    await expect(generateInvoicePdf('safe')).resolves.toBeUndefined();
    const pdf = jsPDFInstances[0];
    expect(pdf.save).toHaveBeenCalled();
  });

  it('strips oklch backgrounds via the onclone callback', async () => {
    html2canvasMock.mockResolvedValue(buildCanvas());
    await generateInvoicePdf('strip');

    const opts = html2canvasMock.mock.calls[0][1];
    const cloneDoc = document.implementation.createHTMLDocument('test');
    cloneDoc.body.innerHTML =
      '<div class="app"><div class="editor"></div><div class="preview-pane"></div><div class="paper-wrap"></div></div>';
    opts.onclone(cloneDoc);

    const editor = cloneDoc.querySelector('.editor') as HTMLElement;
    expect(editor.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(editor.style.backgroundImage).toBe('none');
    expect(editor.style.color).toBe('rgb(43, 46, 56)');
  });
});
