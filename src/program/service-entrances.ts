import {createServer} from 'http';

import config from './config';
import {DBService, GithubService, HTTPService} from './services';

export const httpServer = createServer();

export const dbService = new DBService(config.mongodb);

export const githubService = new GithubService(dbService);

export const httpService = new HTTPService(httpServer, githubService);

export const servicesReady = Promise.all([dbService.ready]);

export function listen(port = config.http.port): void {
  httpServer.listen(port, () => console.info(`Listening on port ${port}...`));
}
