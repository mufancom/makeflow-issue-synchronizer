import Router from 'koa-router';

export function routeTestAPI(apiRouter: Router): void {
  apiRouter.get('/test', ctx => {
    ctx.body = 'hello';
  });
}
