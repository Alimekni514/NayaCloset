import type { AbmPositionDetail } from '@delivery-commerce/shared';

export type AbmDetailPrintVariant = 'normal' | 'zebra';

export interface AbmDetailParsedDocument {
  barcode: string;
  hasNormalPrintLink: boolean;
  hasZebraPrintLink: boolean;
  currentStatusLabel: string;
  departureLabel: string;
  departureDate: string | null;
  destinationLabel: string;
  destinationDate: string | null;
  events: Array<{
    id: string;
    label: string;
    occurredAt: string | null;
    isCurrent: boolean;
  }>;
  shipment: {
    type?: string;
    service?: string;
    weightKg?: number | null;
    pieces?: number | null;
  };
  dimensions: {
    lengthCm?: number | null;
    widthCm?: number | null;
    heightCm?: number | null;
  };
}

export interface AbmPrintInspectionResult {
  contentType: string;
  dispositionFilename: string;
  body: string | Buffer;
}

export type AbmPositionDetailResult = AbmPositionDetail;
