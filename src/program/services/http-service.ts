import {Server as HTTPServer} from 'http';

import Koa from 'koa';
import buildBodyParser from 'koa-bodyparser';
import Router from 'koa-router';

import {routeTestAPI} from '../api/test-api';

export interface HTTPServiceOptions {
  port: number;
}

export class HTTPService {
  constructor(private server: HTTPServer) {
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

    routeTestAPI(apiRouter);

    app.use(apiRouter.routes());
    app.use(apiRouter.allowedMethods);
  }
}
