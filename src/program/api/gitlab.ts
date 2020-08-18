import {API} from '@makeflow/types';
import Router from 'koa-router';

import {ExpectedError} from '../core';
import {IssueService} from '../services';
import {GitLabPowerAppConfig} from '../types';
import {checkRequiredConfigs, requestProcessor} from '../utils';

export function routeGitLabIssueSynchronizer(
  issueService: IssueService,
  apiRouter: Router,
): void {
  apiRouter.post(
    '/gitlab/power-glance/gitlab-issue-synchronizer/(initialize|change)',
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

      let gitLabConfigs = powerGlanceConfigs as GitLabPowerAppConfig;

      console.info(
        'Received gitlab issue synchronization request: ',
        resources,
      );

      checkRequiredConfigs(
        powerGlanceConfigs,
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
        installation: installationId,
        token,
        clock,
        resources,
        config: gitLabConfigs,
        options: {
          type: 'gitlab',
          url: gitLabConfigs['gitlab-url'],
          token: gitLabConfigs['gitlab-token'],
          projectName: gitLabConfigs['gitlab-project-name'],
        },
      });

      return {
        data: {},
      };
    }),
  );
}
