import {createServer} from 'http';

import config from './config';
import {DBService, GitHubService, GitLabService, HTTPService} from './services';

export const httpServer = createServer();

export const dbService = new DBService(config.mongodb);

export const gitHubService = new GitHubService(dbService);

export const gitLabService = new GitLabService(dbService);

export const httpService = new HTTPService(
  httpServer,
  gitHubService,
  gitLabService,
);

export const servicesReady = Promise.all([dbService.ready]);

export function listen(port = config.http.port): void {
  httpServer.listen(port, () => console.info(`Listening on port ${port}...`));
}
