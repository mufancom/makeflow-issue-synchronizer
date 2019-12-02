import {createServer} from 'http';

import config from './config';
import {
  APIService,
  DBService,
  HTTPService,
  InstallationService,
  IssueService,
  LockService,
  MakeflowService,
} from './services';

export const httpServer = createServer();

export const dbService = new DBService(config.mongodb);

export const lockService = new LockService({zookeeper: config.zookeeper});

export const installationService = new InstallationService(dbService);

export const apiService = new APIService();

export const makeflowService = new MakeflowService(apiService);

export const issueService = new IssueService(
  installationService,
  makeflowService,
  dbService,
  lockService,
);

export const httpService = new HTTPService(
  httpServer,
  issueService,
  installationService,
);

export const servicesReady = Promise.all([dbService.ready]);

export function listen(port = config.http.port): void {
  httpServer.listen(port, () => console.info(`Listening on port ${port}...`));
}
