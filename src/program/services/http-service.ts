import {Server as HTTPServer} from 'http';

import Koa from 'koa';
import buildBodyParser from 'koa-bodyparser';
import Router from 'koa-router';

import {
  routeGitHubIssueSynchronizer,
  routeGitLabIssueSynchronizer,
  routeInstallation,
} from '../api';

import {InstallationService} from './installation-service';
import {IssueService} from './issue-service';

export interface HTTPServiceOptions {
  port: number;
}

export class HTTPService {
  constructor(
    private server: HTTPServer,
    private issueService: IssueService,
    private installationService: InstallationService,
  ) {
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
    routeInstallation(this.installationService, apiRouter);

    app.use(apiRouter.routes());
    app.use(apiRouter.allowedMethods());
  }
}
