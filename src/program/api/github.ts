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
        source: {
          organization: originalOrganization,
          installation: originalInstallation,
        },
        token,
        clock,
        resources,
        powerGlanceConfigs,
      } = ctx.request.body as
        | API.PowerGlance.InitializeHookParams
        | API.PowerGlance.UpdateHookParams;

      // TODO: remove while makeflow updated
      let organizationId =
        typeof originalOrganization === 'string'
          ? originalOrganization
          : originalOrganization.id;
      let installationId =
        typeof originalInstallation === 'string'
          ? originalInstallation
          : originalInstallation.id;

      let gitHubConfigs = powerGlanceConfigs as GitHubPowerAppConfig;

      console.info(
        'Received github issue synchronization request: ',
        resources,
      );

      checkRequiredConfigs(
        powerGlanceConfigs,
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
