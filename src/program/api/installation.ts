import {API} from '@makeflow/types';
import Router from 'koa-router';

import {InstallationService} from '../services';
import {requestProcessor} from '../utils';

export function routeInstallation(
  installationService: InstallationService,
  apiRouter: Router,
): void {
  apiRouter.post(
    // TODO: Extract
    '/:type(github|gitlab)/installation/(activate|update)',
    requestProcessor(async ctx => {
      let {
        source: {
          url,
          organization: originalOrganization,
          installation: originalInstallation,
        },
        accessToken,
      } = ctx.request.body as
        | API.PowerApp.InstallationUpdateHookParams
        | API.PowerApp.InstallationActivateHookParams;

      // TODO: remove while makeflow updated
      let organizationId =
        typeof originalOrganization === 'string'
          ? originalOrganization
          : originalOrganization.id;
      let installationId =
        typeof originalInstallation === 'string'
          ? originalInstallation
          : originalInstallation.id;

      console.info(
        `touching installation "${installationId}" from "${organizationId}"`,
      );

      await installationService.touchInstallation({
        organization: organizationId,
        installation: installationId,
        makeflowBaseURL: url,
        accessToken,
      });
    }),
  );

  apiRouter.post(
    '/:type(github|gitlab)/installation/deactivate',
    requestProcessor(async ctx => {
      let {
        source: {
          organization: originalOrganization,
          installation: originalInstallation,
        },
      } = ctx.request.body as API.PowerApp.InstallationDeactivateHookParams;

      // TODO: remove while makeflow updated
      let organizationId =
        typeof originalOrganization === 'string'
          ? originalOrganization
          : originalOrganization.id;
      let installationId =
        typeof originalInstallation === 'string'
          ? originalInstallation
          : originalInstallation.id;

      console.info(
        `deactivating installation "${installationId}" from "${organizationId}"`,
      );

      await installationService.deactivateInstallation({
        organization: organizationId,
        installation: installationId,
      });
    }),
  );
}
