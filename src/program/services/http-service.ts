import {Server as HTTPServer} from 'http';

import Koa from 'koa';
import buildBodyParser from 'koa-bodyparser';
import Router from 'koa-router';

import {
  routeGitHubIssueSynchronizer,
  routeGitLabIssueSynchronizer,
} from '../api';

import {IssueService} from './issue';

export interface HTTPServiceOptions {
  port: number;
}

export class HTTPService {
  constructor(private server: HTTPServer, private issueService: IssueService) {
    this.initialize();
  }

  private initialize(): void {
    let app = new Koa<unknown>();

    let bodyParser = buildBodyParser();

    app.use(bodyParser);

    this.initializeAPI(app);

    this.server.on('request', app.callback());
  }

  private initializeAPI(app: Koa): void {
    let apiRouter = new Router<unknown>();

    routeGitHubIssueSynchronizer(this.issueService, apiRouter);
    routeGitLabIssueSynchronizer(this.issueService, apiRouter);

    app.use(apiRouter.routes());
    app.use(apiRouter.allowedMethods);
  }
}
