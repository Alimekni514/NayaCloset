import html2pdf from 'html2pdf.js';
import type { AbmLabelVariant } from '../api/abm-position-detail-api';

// ABM labels typically use 'size: 7in 9.25in' (177.8mm x 234.95mm).
// We set jsPDF dimensions accordingly to prevent right/bottom clipping.
const LABEL_PDF_CONFIG: Record<AbmLabelVariant, { widthMm: number; heightMm: number }> = {
  normal: { widthMm: 177.8, heightMm: 234.95 },
  // Zebra labels might be smaller in reality but typically are rendered properly within the same bounds,
  // or they scale to fit. Using the same safe bounding box based on the CSS size.
  zebra: { widthMm: 177.8, heightMm: 234.95 },
};

/**
 * Parses the backend HTML response safely, removing scripts to prevent execution.
 */
function parseSafeHtml(html: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Strip all scripts for security
  doc.querySelectorAll('script').forEach((node) => node.remove());

  // Recursively remove any inline 'on*' event handlers
  const allElements = doc.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (el) {
      const attributes = Array.from(el.attributes);
      for (const attr of attributes) {
        if (attr.name.toLowerCase().startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      }
    }
  }

  return doc;
}

/**
 * Creates an off-screen container, attaches it to the DOM, and inserts the printable content.
 */
function mountRenderContainer(doc: Document): HTMLElement {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';
  container.style.background = '#fff';

  // Extract the main print container, or fallback to body contents
  const printRoot = doc.querySelector('.printit') || doc.body;

  // We need the CSS from the head to render properly
  const styles = doc.head.querySelectorAll('style, link[rel="stylesheet"]');
  styles.forEach((style) => container.appendChild(style.cloneNode(true)));

  container.appendChild(printRoot.cloneNode(true));
  document.body.appendChild(container);

  return container;
}

/**
 * Waits for all images within the container to finish loading.
 */
async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => reject(new Error(`Failed to load image: ${img.src}`)), { once: true });
      });
    }),
  );
}

/**
 * Waits for document fonts to be ready (if supported).
 */
async function waitForFonts(): Promise<void> {
  if ('fonts' in document) {
    try {
      await (document as any).fonts.ready;
    } catch {
      // Ignore font loading errors
    }
  }
}

/**
 * Client-side PDF generation workflow.
 * Renders the provided HTML safely into a temporary off-screen container,
 * waits for assets, uses html2pdf to download the file, and cleans up.
 */
export async function downloadPositionLabelPdf({
  positionId,
  variant,
  htmlContent,
  filename,
}: {
  positionId: string;
  variant: AbmLabelVariant;
  htmlContent: string;
  filename: string;
}): Promise<void> {
  let container: HTMLElement | null = null;

  try {
    const safeDoc = parseSafeHtml(htmlContent);
    container = mountRenderContainer(safeDoc);

    await Promise.all([waitForImages(container), waitForFonts()]);

    const dimensions = LABEL_PDF_CONFIG[variant];

    const options = {
      margin: 0,
      filename,
      image: { type: 'jpeg' as const, quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
      },
      jsPDF: {
        unit: 'mm',
        format: [dimensions.widthMm, dimensions.heightMm] as [number, number],
        orientation: 'portrait' as const,
        compress: true,
      },
      pagebreak: {
        mode: ['avoid-all'],
      },
    };

    await html2pdf().from(container).set(options).save();
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
