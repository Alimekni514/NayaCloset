import html2pdf from 'html2pdf.js';
// ===========================================================================
// MEASURED FROM OFFICIAL ABM PDF (client.abm-delivery.com):
//   MediaBox: [0, 0, 841.92, 594.96] pt
//   Size:     841.92 × 594.96 pt = 297.01 × 209.89 mm  (A4 Landscape)
//   Pages:    1
//   Fonts:    TimesNewRomanPS-BoldMT, TimesNewRomanPSMT, Consolas
// ===========================================================================
/** 1 mm in pixels at 96 dpi */
const MM_TO_PX = 3.7795275591;
const LABEL_PDF_CONFIG = {
    // A4 Landscape – exact dimensions from official ABM reference PDF
    normal: {
        widthMm: 297.01,
        heightMm: 209.89,
        widthPx: Math.round(297.01 * MM_TO_PX), // ≈ 1122 px
        heightPx: Math.round(209.89 * MM_TO_PX), // ≈  793 px
        orientation: 'landscape',
        rootSelector: '#abm-label-root, #printit, .printit, body',
    },
    // Zebra: no official reference PDF available – keep current proportions.
    // TODO: provide an official Zebra reference PDF for pixel-perfect calibration.
    zebra: {
        widthMm: 177.8,
        heightMm: 234.95,
        widthPx: Math.round(177.8 * MM_TO_PX), // ≈  673 px
        heightPx: Math.round(234.95 * MM_TO_PX), // ≈  889 px
        orientation: 'portrait',
        rootSelector: '#abm-label-root, #printit, .printit, body',
    },
};
// ---------------------------------------------------------------------------
// HTML sanitisation – keep styles + JsBarcode scripts, strip dangerous code
// ---------------------------------------------------------------------------
function sanitizeHtmlForRender(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // Remove inline event handlers on every element
    doc.querySelectorAll('*').forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
            if (attr.name.toLowerCase().startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });
    });
    // Sanitise scripts: keep JsBarcode calls, neuter print/navigation
    doc.querySelectorAll('script').forEach((script) => {
        const src = script.getAttribute('src');
        if (src) {
            // Remove any external script src (no network calls)
            script.remove();
            return;
        }
        let code = script.textContent ?? '';
        // Remove window.print() calls
        code = code.replace(/window\s*\.\s*print\s*\(\s*\)/gu, '/* print() removed */');
        // Remove window.open / window.location navigation
        code = code.replace(/window\s*\.\s*(open|location)\b[^;]*/gu, '/* nav removed */');
        script.textContent = code;
    });
    // Remove iframes, forms, embeds, objects inside document
    doc.querySelectorAll('iframe, frame, embed, object, form, base').forEach((el) => el.remove());
    return doc.documentElement.outerHTML;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function waitForIframeLoad(iframe) {
    return new Promise((resolve, reject) => {
        iframe.addEventListener('load', () => resolve(), { once: true });
        iframe.addEventListener('error', () => reject(new Error('iframe failed to load')), { once: true });
    });
}
async function waitForIframeImages(iframeDoc) {
    const imgs = Array.from(iframeDoc.querySelectorAll('img'));
    await Promise.all(imgs.map((img) => img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            // Resolve even on error so a missing image doesn't block the PDF
            img.addEventListener('error', () => resolve(), { once: true });
        })));
}
async function waitForIframeFonts(iframeDoc) {
    try {
        if ('fonts' in iframeDoc) {
            await iframeDoc.fonts.ready;
        }
    }
    catch {
        // Font loading errors are non-fatal
    }
}
/**
 * Wait for the JsBarcode library to finish rendering SVGs.
 * The backend wraps the JsBarcode call in a try/finally that sets
 * `window.__ABM_LABEL_READY = true` when complete.
 */
async function waitForBarcodes(iframeDoc) {
    const win = iframeDoc.defaultView;
    if (!win)
        return;
    if (typeof win.__ABM_LABEL_READY === 'undefined') {
        // No barcode flag present – give the DOM a short settling period
        await new Promise((resolve) => setTimeout(resolve, 250));
        return;
    }
    // Poll until the flag is set (max 5 s)
    const deadline = Date.now() + 5_000;
    while (!win.__ABM_LABEL_READY && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}
/**
 * Return the first matching element using a comma-separated CSS selector list.
 */
function querySelector(doc, selector) {
    for (const sel of selector.split(',')) {
        const el = doc.querySelector(sel.trim());
        if (el)
            return el;
    }
    return null;
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Client-side PDF generation for ABM position labels.
 *
 * Strategy:
 *  1. Load the backend-provided printable HTML inside an off-screen iframe
 *     (using srcdoc so all <head> styles are preserved and scripts execute).
 *  2. Wait for fonts, images, and JsBarcode SVG rendering.
 *  3. Capture the label root element with html2canvas + jsPDF via html2pdf.js.
 *  4. Always remove the iframe in a finally block.
 *
 * Page dimensions for the normal label match the official ABM reference PDF
 * exactly: 297.01 × 209.89 mm (A4 Landscape).
 */
export async function downloadPositionLabelPdf({ positionId: _positionId, variant, htmlContent, filename, }) {
    let iframe = null;
    try {
        const config = LABEL_PDF_CONFIG[variant];
        // ------------------------------------------------------------------
        // 1. Create off-screen iframe
        //    - position: fixed prevents document reflow
        //    - transform: translateX(-200vw) moves it off-screen left while
        //      keeping it in the render tree (avoids browser paint skip)
        //    - sandbox="allow-scripts allow-same-origin" lets JsBarcode run
        //      while blocking navigation and form submissions
        // ------------------------------------------------------------------
        iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        iframe.style.cssText = [
            'position: fixed',
            'left: 0',
            'top: 0',
            `transform: translateX(-200vw)`,
            `width: ${config.widthPx}px`,
            `height: ${config.heightPx}px`,
            'border: none',
            'background: #ffffff',
            'pointer-events: none',
            'z-index: -1',
            'overflow: hidden',
        ].join('; ');
        document.body.appendChild(iframe);
        // srcdoc content inherits the parent document's origin → same-origin
        const loadPromise = waitForIframeLoad(iframe);
        iframe.srcdoc = sanitizeHtmlForRender(htmlContent);
        await loadPromise;
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) {
            throw new Error('ABM_LABEL_IFRAME_ACCESS_DENIED: Cannot access iframe document');
        }
        // ------------------------------------------------------------------
        // 2. Wait for all async resources
        // ------------------------------------------------------------------
        await Promise.all([waitForIframeFonts(iframeDoc), waitForIframeImages(iframeDoc)]);
        // JsBarcode renders SVG elements synchronously after DOMContentLoaded,
        // but the flag may be set slightly after the load event.
        await waitForBarcodes(iframeDoc);
        // Small extra settle to let final layout paint complete
        await new Promise((resolve) => setTimeout(resolve, 150));
        // ------------------------------------------------------------------
        // 3. Find the label root and validate it
        // ------------------------------------------------------------------
        const labelRoot = querySelector(iframeDoc, config.rootSelector);
        if (!labelRoot) {
            throw new Error(`ABM_LABEL_ROOT_NOT_FOUND: No element matched "${config.rootSelector}"`);
        }
        if (labelRoot.scrollWidth <= 0 || labelRoot.scrollHeight <= 0) {
            throw new Error(`ABM_LABEL_ZERO_SIZE: ${variant} label root has zero dimensions ` +
                `(scrollWidth=${labelRoot.scrollWidth}, scrollHeight=${labelRoot.scrollHeight})`);
        }
        // ------------------------------------------------------------------
        // 4. Generate PDF
        // ------------------------------------------------------------------
        const options = {
            margin: 0,
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                scrollX: 0,
                scrollY: 0,
                windowWidth: config.widthPx,
                windowHeight: config.heightPx,
            },
            jsPDF: {
                unit: 'mm',
                format: [config.widthMm, config.heightMm],
                orientation: config.orientation,
                compress: true,
                hotfixes: ['px_scaling'],
            },
            pagebreak: {
                mode: ['avoid-all', 'css', 'legacy'],
                before: [],
                after: [],
                avoid: ['#abm-label-root', '#printit', 'table', 'tr', 'td', '.barcode'],
            },
        };
        await html2pdf().from(labelRoot).set(options).save();
    }
    finally {
        if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
    }
}
