import fs from 'node:fs/promises';
import path from 'node:path';

import { createCanvas } from '@napi-rs/canvas';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

type PdfSummary = {
  file: string;
  pageWidth: number;
  pageHeight: number;
  fonts: string[];
  textBounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
};

const SCALE = 2;

const ensureDirectory = async (directory: string) => {
  await fs.mkdir(directory, { recursive: true });
};

const readPdfSummary = async (file: string): Promise<PdfSummary> => {
  const data = new Uint8Array(await fs.readFile(file));
  const document = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const page = await document.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const text = await page.getTextContent();

  const fonts = new Set<string>();
  const bounds = {
    left: Number.POSITIVE_INFINITY,
    top: Number.POSITIVE_INFINITY,
    right: Number.NEGATIVE_INFINITY,
    bottom: Number.NEGATIVE_INFINITY,
  };

  for (const item of text.items) {
    if (!('str' in item) || !item.str.trim()) {
      continue;
    }

    fonts.add(item.fontName);
    const x = item.transform[4];
    const y = item.transform[5];
    bounds.left = Math.min(bounds.left, x);
    bounds.top = Math.min(bounds.top, y - item.height);
    bounds.right = Math.max(bounds.right, x + item.width);
    bounds.bottom = Math.max(bounds.bottom, y);
  }

  return {
    file: path.basename(file),
    pageWidth: viewport.width,
    pageHeight: viewport.height,
    fonts: [...fonts],
    textBounds: bounds,
  };
};

const renderPdfToPng = async (file: string, outputFile: string): Promise<PNG> => {
  const data = new Uint8Array(await fs.readFile(file));
  const document = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const page = await document.getPage(1);
  const viewport = page.getViewport({ scale: SCALE });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context as never,
    viewport,
    canvasFactory: {
      create: (width: number, height: number) => {
        const instance = createCanvas(width, height);
        return {
          canvas: instance,
          context: instance.getContext('2d'),
        };
      },
      reset: (canvasAndContext, width: number, height: number) => {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
      },
      destroy: (canvasAndContext) => {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
      },
    },
  }).promise;

  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputFile, buffer);
  return PNG.sync.read(buffer);
};

const createAlignedCanvas = (source: PNG, width: number, height: number): PNG => {
  const target = new PNG({ width, height, fill: true });
  PNG.bitblt(source, target, 0, 0, source.width, source.height, 0, 0);
  return target;
};

const createOverlay = (official: PNG, generated: PNG): PNG => {
  const overlay = new PNG({ width: official.width, height: official.height });

  for (let index = 0; index < overlay.data.length; index += 4) {
    overlay.data[index] = Math.round((official.data[index] + generated.data[index]) / 2);
    overlay.data[index + 1] = Math.round((official.data[index + 1] + generated.data[index + 1]) / 2);
    overlay.data[index + 2] = Math.round((official.data[index + 2] + generated.data[index + 2]) / 2);
    overlay.data[index + 3] = 255;
  }

  return overlay;
};

const main = async () => {
  const officialFile = process.argv[2];
  const generatedFile = process.argv[3];

  if (!officialFile || !generatedFile) {
    throw new Error('Usage: npm run compare:abm-label -- <official.pdf> <generated.pdf>');
  }

  const outputDirectory = path.resolve(process.cwd(), '../../.logs/abm-label-comparison');
  await ensureDirectory(outputDirectory);

  const officialSummary = await readPdfSummary(officialFile);
  const generatedSummary = await readPdfSummary(generatedFile);

  const officialPng = await renderPdfToPng(officialFile, path.join(outputDirectory, 'official.png'));
  const generatedPng = await renderPdfToPng(generatedFile, path.join(outputDirectory, 'generated.png'));

  const width = Math.max(officialPng.width, generatedPng.width);
  const height = Math.max(officialPng.height, generatedPng.height);

  const alignedOfficial = createAlignedCanvas(officialPng, width, height);
  const alignedGenerated = createAlignedCanvas(generatedPng, width, height);
  const overlay = createOverlay(alignedOfficial, alignedGenerated);
  const diff = new PNG({ width, height });

  const differingPixels = pixelmatch(
    alignedOfficial.data,
    alignedGenerated.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 },
  );

  await fs.writeFile(path.join(outputDirectory, 'overlay.png'), PNG.sync.write(overlay));
  await fs.writeFile(path.join(outputDirectory, 'diff.png'), PNG.sync.write(diff));

  const comparison = {
    generatedAt: new Date().toISOString(),
    scale: SCALE,
    official: officialSummary,
    generated: generatedSummary,
    meanPixelDifference: differingPixels / (width * height),
    differingPixels,
    differingPixelPercentage: (differingPixels / (width * height)) * 100,
    majorMisalignmentNotes: [
      officialSummary.pageWidth !== generatedSummary.pageWidth ||
      officialSummary.pageHeight !== generatedSummary.pageHeight
        ? 'Page dimensions differ.'
        : 'Page dimensions align.',
    ],
  };

  await fs.writeFile(
    path.join(outputDirectory, 'comparison.json'),
    JSON.stringify(comparison, null, 2),
    'utf8',
  );

  console.log(JSON.stringify(comparison, null, 2));
};

void main();
