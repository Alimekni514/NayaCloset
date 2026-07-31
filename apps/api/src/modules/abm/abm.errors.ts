import { StatusCodes } from 'http-status-codes';

import { HttpError } from '../../lib/http-error';

export type AbmErrorCode =
  | 'ABM_CONFIGURATION_ERROR'
  | 'ABM_INVALID_POSITION_ID'
  | 'ABM_LOGIN_FAILED'
  | 'ABM_ACCOUNT_BLOCKED'
  | 'ABM_ACCOUNT_TYPE_UNSUPPORTED'
  | 'ABM_SESSION_EXPIRED'
  | 'ABM_TIMEOUT'
  | 'ABM_BAD_RESPONSE'
  | 'ABM_UNAVAILABLE'
  | 'ABM_LOCATION_LOAD_FAILED'
  | 'ABM_INVALID_COD_AMOUNT'
  | 'ABM_SERVER_ERROR'
  | 'ABM_POSITION_CREATION_FAILED'
  | 'ABM_POSITION_DETAIL_PARSE_FAILED'
  | 'ABM_POSITION_DELETE_NOT_ALLOWED'
  | 'ABM_POSITION_DELETE_FAILED'
  | 'ABM_PRINT_UNSUPPORTED'
  | 'ABM_LABEL_UNSUPPORTED_FORMAT'
  | 'ABM_LABEL_EMPTY'
  | 'ABM_LABEL_FETCH_FAILED'
  | 'ABM_LABEL_PDF_GENERATION_FAILED';

const ERROR_DEFINITIONS: Record<
  AbmErrorCode,
  { statusCode: number; message: string; details?: { code: AbmErrorCode } }
> = {
  ABM_CONFIGURATION_ERROR: {
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
    message: "L'integration ABM n'est pas configuree.",
    details: { code: 'ABM_CONFIGURATION_ERROR' },
  },
  ABM_INVALID_POSITION_ID: {
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'Identifiant de position invalide.',
    details: { code: 'ABM_INVALID_POSITION_ID' },
  },
  ABM_LOGIN_FAILED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'Impossible de charger les statistiques ABM pour le moment.',
    details: { code: 'ABM_LOGIN_FAILED' },
  },
  ABM_ACCOUNT_BLOCKED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'Impossible de charger les statistiques ABM pour le moment.',
    details: { code: 'ABM_ACCOUNT_BLOCKED' },
  },
  ABM_ACCOUNT_TYPE_UNSUPPORTED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'Impossible de charger les statistiques ABM pour le moment.',
    details: { code: 'ABM_ACCOUNT_TYPE_UNSUPPORTED' },
  },
  ABM_SESSION_EXPIRED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'Impossible de charger les statistiques ABM pour le moment.',
    details: { code: 'ABM_SESSION_EXPIRED' },
  },
  ABM_TIMEOUT: {
    statusCode: StatusCodes.GATEWAY_TIMEOUT,
    message: 'Impossible de charger les statistiques ABM pour le moment.',
    details: { code: 'ABM_TIMEOUT' },
  },
  ABM_BAD_RESPONSE: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'Impossible de charger les statistiques ABM pour le moment.',
    details: { code: 'ABM_BAD_RESPONSE' },
  },
  ABM_UNAVAILABLE: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'Impossible de charger les statistiques ABM pour le moment.',
    details: { code: 'ABM_UNAVAILABLE' },
  },
  ABM_LOCATION_LOAD_FAILED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'Impossible de charger les localites ABM.',
    details: { code: 'ABM_LOCATION_LOAD_FAILED' },
  },
  ABM_INVALID_COD_AMOUNT: {
    statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
    message: 'Le montant a collecter est invalide.',
    details: { code: 'ABM_INVALID_COD_AMOUNT' },
  },
  ABM_SERVER_ERROR: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'ABM a rencontre une erreur interne pendant la creation.',
    details: { code: 'ABM_SERVER_ERROR' },
  },
  ABM_POSITION_CREATION_FAILED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'ABM a refuse la creation de la position.',
    details: { code: 'ABM_POSITION_CREATION_FAILED' },
  },
  ABM_POSITION_DETAIL_PARSE_FAILED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'Impossible de lire les informations de cette position.',
    details: { code: 'ABM_POSITION_DETAIL_PARSE_FAILED' },
  },
  ABM_POSITION_DELETE_NOT_ALLOWED: {
    statusCode: StatusCodes.CONFLICT,
    message: 'Cette position ne peut plus etre supprimee.',
    details: { code: 'ABM_POSITION_DELETE_NOT_ALLOWED' },
  },
  ABM_POSITION_DELETE_FAILED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'Impossible de supprimer la position.',
    details: { code: 'ABM_POSITION_DELETE_FAILED' },
  },
  ABM_PRINT_UNSUPPORTED: {
    statusCode: StatusCodes.NOT_IMPLEMENTED,
    message: "L'impression ABM n'est pas encore disponible de maniere securisee.",
    details: { code: 'ABM_PRINT_UNSUPPORTED' },
  },
  ABM_LABEL_UNSUPPORTED_FORMAT: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: "Le format d'etiquette retourne par ABM n'est pas pris en charge.",
    details: { code: 'ABM_LABEL_UNSUPPORTED_FORMAT' },
  },
  ABM_LABEL_EMPTY: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: "Impossible de preparer l'etiquette.",
    details: { code: 'ABM_LABEL_EMPTY' },
  },
  ABM_LABEL_FETCH_FAILED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: "Impossible de preparer l'etiquette.",
    details: { code: 'ABM_LABEL_FETCH_FAILED' },
  },
  ABM_LABEL_PDF_GENERATION_FAILED: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: "Impossible de generer le PDF de l'etiquette.",
    details: { code: 'ABM_LABEL_PDF_GENERATION_FAILED' },
  },
};

export const createAbmHttpError = (code: AbmErrorCode): HttpError => {
  const definition = ERROR_DEFINITIONS[code];
  return new HttpError(definition.statusCode, definition.message, definition.details);
};
