import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

import type { AbmConfig, AbmSessionState } from './abm.types';

export const createAbmSessionState = (config: AbmConfig): AbmSessionState => {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      baseURL: config.baseUrl,
      jar,
      withCredentials: true,
      timeout: config.timeoutMs,
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: () => true,
      headers: {
        Accept: '*/*',
        'User-Agent': 'delivery-commerce-abm/1.0',
      },
    }),
  );

  return { jar, client };
};
