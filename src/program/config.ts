import {
  DBServiceOptions,
  HTTPServiceOptions,
  ZookeeperOptions,
} from './services';

export interface Config {
  http: HTTPServiceOptions;
  mongodb: DBServiceOptions;
  zookeeper: ZookeeperOptions;
}

// tslint:disable-next-line:no-var-requires no-require-imports
const config = require('../../.config/server.js') as Config;

export default config;
