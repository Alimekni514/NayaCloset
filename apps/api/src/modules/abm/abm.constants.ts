export const ABM_LOGIN_PATH = '/Authentification/Login';
export const ABM_LOGIN_ACTION_SUFFIX = '?Length=16';
export const ABM_DASHBOARD_PATH = '/cHome/GetDashboardStats';
export const ABM_AUTH_COOKIE_NAME = '.AspNet.ApplicationCookie';

export const ABM_LOGIN_SUCCESS_RESPONSES = new Set([
  'success_admin',
  'success_principal',
  'success_client',
  'account_spe',
]);

export const ABM_LOGIN_BLOCKED_RESPONSE = 'bloque';
export const ABM_LOGIN_UNSUPPORTED_RESPONSE = 'type_usr';

export const ABM_TOTAL_EVENT_IDS = {
  POSITION: -1,
  RETOUR: -2,
  ECHANGE: -3,
} as const;

export const ABM_SUPPORTED_GROUPS = ['POSITION', 'RETOUR', 'ECHANGE'] as const;
