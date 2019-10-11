import Router from 'koa-router';

import {ExpectedError} from '../core';
import {IssueService} from '../services';
import {GitLabPowerAppConfig, MakeflowPowerGlanceApiBody} from '../types';
import {checkRequiredConfigs, requestProcessor} from '../utils';

export function routeGitLabIssueSynchronizer(
  issueService: IssueService,
  apiRouter: Router,
): void {
  apiRouter.post(
    '/gitlab-issue-synchronizer/notify',
    requestProcessor(async ctx => {
      let {name, token, clock, resources, configs} = ctx.request
        .body as MakeflowPowerGlanceApiBody<GitLabPowerAppConfig>;

      console.info('Received gitlab issue synchronization request: ', {
        name,
        token,
        clock,
        resources,
      });

      checkRequiredConfigs(
        configs,
        ['gitlab-url', 'gitlab-token', 'gitlab-project-name'],
        'GitHub issue synchronizer inputs',
      );

      if (name !== 'gitlab-issue-synchronizer') {
        throw new ExpectedError(
          'PARAMETER_ERROR',
          'GitHub issue synchronizer only accept parameters with name "gitlab-issue-synchronizer".',
        );
      }

      await issueService.synchronizeIssuesFromConfig({
        token,
        clock,
        resources,
        config: configs,
        options: {
          type: 'gitlab',
          url: configs['gitlab-url'],
          token: configs['gitlab-token'],
          projectName: configs['gitlab-project-name'],
        },
      });

      return {
        data: {},
      };
    }),
  );
}
