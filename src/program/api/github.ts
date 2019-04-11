import Router from 'koa-router';

import {GithubInputs, GithubService} from '../services';
import {convertToCamelObject} from '../utils';

export function routeGithubIssueSynchronizer(
  githubService: GithubService,
  apiRouter: Router,
): void {
  apiRouter.post('/github-issue-synchronizer/notify', async ctx => {
    let body = ctx.request.body;

    if (body.name !== 'github-issue-synchronizer') {
      return;
    }

    let inputs = convertToCamelObject(body.inputs) as GithubInputs;

    await githubService.synchronizeIssue(inputs);

    ctx.body = {};
  });
}
