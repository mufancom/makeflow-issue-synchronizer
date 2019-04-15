import {createServer} from 'http';

import config from './config';
import {
  DBService,
  GitHubService,
  GitLabService,
  HTTPService,
  LockService,
} from './services';

export const httpServer = createServer();

export const dbService = new DBService(config.mongodb);

export const lockService = new LockService({zookeeper: config.zookeeper});

export const gitHubService = new GitHubService(dbService, lockService);

export const gitLabService = new GitLabService(dbService, lockService);

export const httpService = new HTTPService(
  httpServer,
  gitHubService,
  gitLabService,
);

export const servicesReady = Promise.all([dbService.ready]);

export function listen(port = config.http.port): void {
  httpServer.listen(port, () => console.info(`Listening on port ${port}...`));
}
