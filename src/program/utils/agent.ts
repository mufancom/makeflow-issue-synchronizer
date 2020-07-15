import {Agent} from 'http';

import SocksProxyAgent from 'socks-proxy-agent';

const PROXY_ENV_LIST = ['SOCKS_PROXY'];

export function getAgent(): Agent | undefined {
  let proxyEnv = getSomeEnv(PROXY_ENV_LIST);

  if (!proxyEnv) {
    return undefined;
  }

  if (!proxyEnv.startsWith('socks://')) {
    console.warn('Unsupported proxy env detected, will be ignore.');
    return undefined;
  }

  console.info(`Request will with proxy "${proxyEnv}"`);
  return new SocksProxyAgent(proxyEnv);
}

function getSomeEnv(envs: string[]): string | undefined {
  for (let env of envs) {
    let envValue = process.env[env];

    if (envValue) {
      return envValue;
    }
  }

  return undefined;
}
