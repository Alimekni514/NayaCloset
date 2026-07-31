import { URLSearchParams } from 'node:url';

import type { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

import { logger } from '../../config/logger';

import {
  ABM_AUTH_COOKIE_NAME,
  ABM_DASHBOARD_PATH,
  ABM_LOGIN_ACTION_SUFFIX,
  ABM_LOGIN_BLOCKED_RESPONSE,
  ABM_LOGIN_PATH,
  ABM_LOGIN_SUCCESS_RESPONSES,
  ABM_LOGIN_UNSUPPORTED_RESPONSE,
} from './abm.constants';
import { createAbmHttpError } from './abm.errors';
import { createAbmSessionState } from './abm.http-client';
import type { AbmConfig, AbmSessionState } from './abm.types';

type ProtectedFormRequestOptions = {
  headers?: Record<string, string>;
  maxRedirects?: number;
};

type ProtectedGetRequestOptions = {
  headers?: Record<string, string>;
  maxRedirects?: number;
};

export type AbmProtectedFormResponse = {
  data: string;
  status: number;
  headers: Record<string, string | string[] | undefined>;
  finalUrl: string;
};

export type AbmProtectedTextResponse = AbmProtectedFormResponse;

export type AbmProtectedBufferResponse = {
  data: Buffer;
  status: number;
  headers: Record<string, string | string[] | undefined>;
  finalUrl: string;
};

const extractResponseUrl = (response: AxiosResponse<string>): string => {
  const responseUrl = (response.request as { res?: { responseUrl?: string } } | undefined)?.res?.responseUrl;
  return responseUrl ?? '';
};

const containsLoginForm = (html: string): boolean => {
  const $ = cheerio.load(html);
  return (
    $('input[name="__RequestVerificationToken"]').length > 0 &&
    $('input[name="UserName"]').length > 0
  );
};

const toBuffer = (value: Buffer | ArrayBuffer | string): Buffer => {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return Buffer.from(value, 'utf-8');
  }

  return Buffer.from(value);
};

const decodePreview = (value: Buffer | ArrayBuffer | string, maxBytes = 2048): string => {
  return toBuffer(value).subarray(0, maxBytes).toString('utf-8');
};

export class AbmSessionManager {
  private readonly config: AbmConfig;
  private state: AbmSessionState;
  private loginPromise: Promise<void> | null = null;

  public constructor(config: AbmConfig) {
    this.config = config;
    this.state = createAbmSessionState(config);
  }

  public async getDashboardPayload(params: { debut: string | null; fin: string | null }): Promise<string> {
    return this.requestProtectedText(ABM_DASHBOARD_PATH, params).then((response) => response.data);
  }

  public async getProtectedText(
    path: string,
    params: Record<string, string | null | undefined> = {},
    options: ProtectedGetRequestOptions = {},
  ): Promise<string> {
    return this.requestProtectedText(path, params, false, options).then((response) => response.data);
  }

  public async getProtectedTextDetailed(
    path: string,
    params: Record<string, string | null | undefined> = {},
    options: ProtectedGetRequestOptions = {},
  ): Promise<AbmProtectedTextResponse> {
    return this.requestProtectedText(path, params, false, options);
  }

  public async getProtectedBufferDetailed(
    path: string,
    params: Record<string, string | null | undefined> = {},
    options: ProtectedGetRequestOptions = {},
  ): Promise<AbmProtectedBufferResponse> {
    return this.requestProtectedBuffer(path, params, false, options);
  }

  public async postProtectedForm(
    path: string,
    form: URLSearchParams | string,
  ): Promise<string> {
    const response = await this.requestProtectedForm(path, form);
    return response.data;
  }

  public async postProtectedFormDetailed(
    path: string,
    form: URLSearchParams | string,
    options: ProtectedFormRequestOptions = {},
  ): Promise<AbmProtectedFormResponse> {
    return this.requestProtectedForm(path, form, false, options);
  }

  public async getCookieDiagnostics(): Promise<{
    applicationCookiePresent: boolean;
    antiforgeryCookiePresent: boolean;
    cookieCount: number;
  }> {
    const cookies = await this.state.jar.getCookies(this.config.baseUrl);

    return {
      applicationCookiePresent: cookies.some((cookie) => cookie.key === ABM_AUTH_COOKIE_NAME),
      antiforgeryCookiePresent: cookies.some((cookie) =>
        /requestverificationtoken/iu.test(cookie.key),
      ),
      cookieCount: cookies.length,
    };
  }

  private async requestProtectedText(
    path: string,
    params: Record<string, string | null | undefined>,
    retried = false,
    options: ProtectedGetRequestOptions = {},
  ): Promise<AbmProtectedTextResponse> {
    await this.ensureLoggedIn();

    const response = await this.safeRequest(() =>
      this.state.client.get<string>(path, {
        params,
        ...(options.headers ? { headers: options.headers } : {}),
        ...(options.maxRedirects != null ? { maxRedirects: options.maxRedirects } : {}),
        validateStatus: () => true,
      }),
    );

    if (this.isUnauthenticatedResponse(response)) {
      if (retried) {
        throw createAbmHttpError('ABM_SESSION_EXPIRED');
      }

      this.resetSession();
      await this.ensureLoggedIn();
      return this.requestProtectedText(path, params, true, options);
    }

    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string | string[] | undefined>,
      finalUrl: extractResponseUrl(response),
    };
  }

  private async requestProtectedBuffer(
    path: string,
    params: Record<string, string | null | undefined>,
    retried = false,
    options: ProtectedGetRequestOptions = {},
  ): Promise<AbmProtectedBufferResponse> {
    await this.ensureLoggedIn();

    const response = await this.safeRequest(() =>
      this.state.client.get<Buffer>(path, {
        params,
        responseType: 'arraybuffer',
        ...(options.headers ? { headers: options.headers } : {}),
        ...(options.maxRedirects != null ? { maxRedirects: options.maxRedirects } : {}),
        validateStatus: () => true,
      }),
    );

    if (this.isUnauthenticatedResponse(response)) {
      if (retried) {
        throw createAbmHttpError('ABM_SESSION_EXPIRED');
      }

      this.resetSession();
      await this.ensureLoggedIn();
      return this.requestProtectedBuffer(path, params, true, options);
    }

    return {
      data: toBuffer(response.data),
      status: response.status,
      headers: response.headers as Record<string, string | string[] | undefined>,
      finalUrl: extractResponseUrl(response as unknown as AxiosResponse<string>),
    };
  }

  private async requestProtectedForm(
    path: string,
    form: URLSearchParams | string,
    retried = false,
    options: ProtectedFormRequestOptions = {},
  ): Promise<AbmProtectedFormResponse> {
    await this.ensureLoggedIn();

    const body = typeof form === 'string' ? form : form.toString();
    const response = await this.safeRequest(() =>
      this.state.client.post<string>(path, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          ...(options.headers ?? {}),
        },
        ...(options.maxRedirects != null ? { maxRedirects: options.maxRedirects } : {}),
        validateStatus: () => true,
      }),
    );

    if (this.isUnauthenticatedResponse(response)) {
      if (retried) {
        throw createAbmHttpError('ABM_SESSION_EXPIRED');
      }

      this.resetSession();
      await this.ensureLoggedIn();
      return this.requestProtectedForm(path, form, true, options);
    }

    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string | string[] | undefined>,
      finalUrl: extractResponseUrl(response),
    };
  }

  private async ensureLoggedIn(): Promise<void> {
    if (await this.hasAuthCookie()) {
      return;
    }

    if (!this.loginPromise) {
      this.loginPromise = this.performLogin().finally(() => {
        this.loginPromise = null;
      });
    }

    await this.loginPromise;
  }

  private async performLogin(): Promise<void> {
    const loginPage = await this.safeRequest(() => this.state.client.get<string>(ABM_LOGIN_PATH));
    const token = this.extractLoginToken(loginPage.data);

    const form = new URLSearchParams({
      __RequestVerificationToken: token,
      UserName: this.config.username,
      password: this.config.password,
    });

    const loginResponse = await this.safeRequest(() =>
      this.state.client.post<string>(`${ABM_LOGIN_PATH}${ABM_LOGIN_ACTION_SUFFIX}`, form.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    const normalizedResponse = this.normalizeLoginResponse(loginResponse.data);

    if (normalizedResponse === ABM_LOGIN_BLOCKED_RESPONSE) {
      throw createAbmHttpError('ABM_ACCOUNT_BLOCKED');
    }

    if (normalizedResponse === ABM_LOGIN_UNSUPPORTED_RESPONSE) {
      throw createAbmHttpError('ABM_ACCOUNT_TYPE_UNSUPPORTED');
    }

    if (!ABM_LOGIN_SUCCESS_RESPONSES.has(normalizedResponse)) {
      throw createAbmHttpError('ABM_LOGIN_FAILED');
    }

    if (!(await this.hasAuthCookie())) {
      throw createAbmHttpError('ABM_SESSION_EXPIRED');
    }
  }

  private normalizeLoginResponse(payload: string): string {
    const trimmed = payload.trim();

    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1).trim();
    }

    return trimmed;
  }

  private extractLoginToken(html: string): string {
    const $ = cheerio.load(html);
    const token = $('input[name="__RequestVerificationToken"]').attr('value');

    if (!token) {
      throw createAbmHttpError('ABM_BAD_RESPONSE');
    }

    return token;
  }

  private async hasAuthCookie(): Promise<boolean> {
    const cookies = await this.state.jar.getCookies(this.config.baseUrl);
    return cookies.some((cookie) => cookie.key === ABM_AUTH_COOKIE_NAME);
  }

  private isUnauthenticatedResponse(response: AxiosResponse<string | Buffer | ArrayBuffer>): boolean {
    const responseUrl = extractResponseUrl(response as AxiosResponse<string>);
    const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
    const bodyPreview = decodePreview(response.data);

    if (responseUrl.includes('/Authentification/Login')) {
      return true;
    }

    if (contentType.includes('text/html') && containsLoginForm(bodyPreview)) {
      return true;
    }

    return false;
  }

  private resetSession(): void {
    this.state = createAbmSessionState(this.config);
  }

  private async safeRequest<T>(
    request: () => Promise<AxiosResponse<T>>,
  ): Promise<AxiosResponse<T>> {
    try {
      return await request();
    } catch (error) {
      logger.warn({ err: error }, 'ABM request failed');

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ECONNABORTED'
      ) {
        throw createAbmHttpError('ABM_TIMEOUT');
      }

      throw createAbmHttpError('ABM_UNAVAILABLE');
    }
  }
}
