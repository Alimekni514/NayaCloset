import type { AxiosInstance } from 'axios';
import type { CookieJar } from 'tough-cookie';
import type {
  AbmDashboardEvent,
  AbmDashboardGroup,
  AbmDashboardQuery,
  AbmDashboardResponse,
} from '@delivery-commerce/shared';

export interface AbmConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeoutMs: number;
}

export interface AbmExternalDashboardItem {
  TYPE: string;
  EVENTID: number;
  EVENTLIBELLE: string;
  COUNT: number;
  COLOR: string | null;
  ICON: string | null;
  HAS_DATE: boolean;
}

export interface AbmSessionState {
  jar: CookieJar;
  client: AxiosInstance;
}

export interface AbmDashboardServiceInput extends AbmDashboardQuery {}

export interface AbmDashboardServiceResult extends AbmDashboardResponse {}

export interface AbmDashboardMappedGroups {
  POSITION: AbmDashboardEvent[];
  RETOUR: AbmDashboardEvent[];
  ECHANGE: AbmDashboardEvent[];
}

export interface AbmNormalizedItem {
  type: AbmDashboardGroup;
  eventId: number;
  label: string;
  count: number;
  hasDate: boolean;
}
