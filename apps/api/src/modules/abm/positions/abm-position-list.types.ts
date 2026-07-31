import type {
  AbmPositionListItem,
  AbmPositionsQuery,
  AbmPositionsResponse,
  AbmPositionStatusCategory,
} from '@delivery-commerce/shared';

import type { AbmExternalPositionListItem } from './abm-position-list.external.schemas';

export type NormalizedAbmPositionsQuery = {
  from: string;
  to: string;
};

export type AbmPositionListResult = AbmPositionsResponse;

export type AbmPositionListSummary = AbmPositionsResponse['summary'];

export type AbmPositionDeleteResult = {
  deleted: true;
};


export type AbmPositionStatusMapping = {
  category: AbmPositionStatusCategory;
  canEdit: boolean;
  canDelete: boolean;
};

export type AbmNormalizedPositionSource = {
  raw: AbmExternalPositionListItem;
  normalized: AbmPositionListItem;
};

export type AbmPositionsQueryInput = AbmPositionsQuery;
