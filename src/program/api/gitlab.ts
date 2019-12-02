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
      let {
        name,
        organization: organizationId,
        appInstallation: appInstallationId,
        token,
        clock,
        resources,
        configs,
      } = ctx.request.body as MakeflowPowerGlanceApiBody<GitLabPowerAppConfig>;

      console.info(
        'Received gitlab issue synchronization request: ',
        {
          name,
          token,
          clock,
        },
        resources,
      );

      checkRequiredConfigs(
        configs,
        ['gitlab-url', 'gitlab-token', 'gitlab-project-name'],
        'GitLab issue synchronizer inputs',
      );

      if (name !== 'gitlab-issue-synchronizer') {
        throw new ExpectedError(
          'PARAMETER_ERROR',
          'GitLab issue synchronizer only accept parameters with name "gitlab-issue-synchronizer".',
        );
      }

      await issueService.synchronizeIssuesFromConfig({
        organization: organizationId,
        appInstallation: appInstallationId,
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
