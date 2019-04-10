import {DBServiceOptions, HTTPServiceOptions} from './services';

export interface Config {
  http: HTTPServiceOptions;
  mongodb: DBServiceOptions;
}

// tslint:disable-next-line:no-var-requires no-require-imports
const config = require('../../.config/server.js') as Config;

export default config;
