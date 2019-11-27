import Router from 'koa-router';

import {InstallationService} from '../services';
import {
  MakeflowDeactivateInstallationBody,
  MakeflowGrantPermissionBody,
  MakeflowRevokePermissionBody,
  MakeflowTouchInstallationBody,
} from '../types';
import {requestProcessor} from '../utils';

export function routeInstallation(
  installationService: InstallationService,
  apiRouter: Router,
): void {
  apiRouter.post(
    // TODO: Extract
    '/:type(github|gitlab)-issue-synchronizer/installation/touch',
    requestProcessor(async ctx => {
      let {
        organization: organizationId,
        appInstallation: appInstallationId,
        baseURL,
      } = ctx.request.body as MakeflowTouchInstallationBody;

      let granted = await installationService.touchInstallation({
        organization: organizationId,
        appInstallation: appInstallationId,
        makeflowBaseURL: baseURL,
      });

      return {
        granted,
      };
    }),
  );

  apiRouter.post(
    '/:type(github|gitlab)-issue-synchronizer/installation/deactivate',
    requestProcessor(async ctx => {
      let {
        organization: organizationId,
        appInstallation: appInstallationId,
      } = ctx.request.body as MakeflowDeactivateInstallationBody;

      await installationService.deactivateInstallation({
        organization: organizationId,
        appInstallation: appInstallationId,
      });
    }),
  );

  apiRouter.post(
    '/:type(github|gitlab)-issue-synchronizer/permission/grant',
    requestProcessor(async ctx => {
      let {
        organization: organizationId,
        appInstallation: appInstallationId,
        accessToken,
      } = ctx.request.body as MakeflowGrantPermissionBody;

      await installationService.grantPermission(
        {
          organization: organizationId,
          appInstallation: appInstallationId,
        },
        accessToken,
      );
    }),
  );

  apiRouter.post(
    '/:type(github|gitlab)-issue-synchronizer/permission/revoke',
    requestProcessor(async ctx => {
      let {
        organization: organizationId,
        appInstallation: appInstallationId,
      } = ctx.request.body as MakeflowRevokePermissionBody;

      await installationService.revokePermission({
        organization: organizationId,
        appInstallation: appInstallationId,
      });
    }),
  );
}
