import {API} from '@makeflow/types';
import Router from 'koa-router';

import {ExpectedError} from '../core';
import {IssueService} from '../services';
import {GitHubPowerAppConfig} from '../types';
import {checkRequiredConfigs, requestProcessor} from '../utils';

// TODO: Merge github and gitlab api
export function routeGitHubIssueSynchronizer(
  issueService: IssueService,
  apiRouter: Router,
): void {
  apiRouter.post(
    '/github/power-glance/github-issue-synchronizer/(initialize|change)',
    requestProcessor(async ctx => {
      let {
        name,
        source: {organization: organizationId, installation: installationId},
        token,
        clock,
        resources,
        configs,
      } = ctx.request.body as
        | API.PowerGlance.InitializeHookParams
        | API.PowerGlance.UpdateHookParams;

      let gitHubConfigs = configs as GitHubPowerAppConfig;

      console.info(
        'Received github issue synchronization request: ',
        resources,
      );

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
        organization: organizationId,
        installation: installationId,
        token,
        clock,
        resources,
        config: gitHubConfigs,
        options: {
          type: 'github',
          url: gitHubConfigs['github-url'],
          token: gitHubConfigs['github-token'],
          projectName: gitHubConfigs['github-project-name'],
        },
      });

      return {
        data: {},
      };
    }),
  );
}
