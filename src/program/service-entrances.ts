import {createServer} from 'http';

import config from './config';
import {DBService, HTTPService, IssueService, LockService} from './services';

export const httpServer = createServer();

export const dbService = new DBService(config.mongodb);

export const lockService = new LockService({zookeeper: config.zookeeper});

export const issueService = new IssueService(dbService, lockService);

export const httpService = new HTTPService(httpServer, issueService);

export const servicesReady = Promise.all([dbService.ready]);

export function listen(port = config.http.port): void {
  httpServer.listen(port, () => console.info(`Listening on port ${port}...`));
}
