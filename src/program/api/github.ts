import Router from 'koa-router';

import {ExpectedError} from '../core';
import {IssueService} from '../services';
import {GitHubPowerAppConfig, MakeflowPowerGlanceApiBody} from '../types';
import {checkRequiredConfigs, requestProcessor} from '../utils';

export function routeGitHubIssueSynchronizer(
  issueService: IssueService,
  apiRouter: Router,
): void {
  apiRouter.post(
    '/github-issue-synchronizer/notify',
    requestProcessor(async ctx => {
      let {name, token, clock, resources, configs} = ctx.request
        .body as MakeflowPowerGlanceApiBody<GitHubPowerAppConfig>;

      checkRequiredConfigs(
        configs,
        ['github-url', 'github-token', 'github-project-name'],
        'GitHub issue synchronizer inputs',
      );

      if (name !== 'github-issue-synchronizer') {
        throw new ExpectedError(
          'PARAMETER_ERROR',
          'GitHub issue synchronizer only accept parameters with name "github-issue-synchronizer".',
        );
      }

      await issueService.synchronizeIssuesFromConfig({
        token,
        clock,
        resources,
        config: configs,
        options: {
          type: 'github',
          url: configs['github-url'],
          token: configs['github-token'],
          projectName: configs['github-project-name'],
        },
      });

      return {
        data: {},
      };
    }),
  );
}
