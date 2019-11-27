import {InstallationDocument} from '../core';
import {Installation, InstallationIdentity} from '../types';

import {DBService} from './db-service';

export class InstallationService {
  constructor(private dbService: DBService) {}

  async touchInstallation({
    organization: organizationId,
    appInstallation: appInstallationId,
    makeflowBaseURL,
  }: Installation): Promise<boolean> {
    let {value} = await this.dbService
      .collectionOfType('installation')
      .findOneAndUpdate(
        {
          organization: organizationId,
          appInstallation: appInstallationId,
        },
        {
          $set: {
            makeflowBaseURL,
            active: true,
          },
        },
        {
          upsert: true,
        },
      );

    return !!value && !!value.accessToken;
  }

  async deactivateInstallation({
    organization: organizationId,
    appInstallation: appInstallationId,
  }: InstallationIdentity): Promise<void> {
    await this.dbService.collectionOfType('installation').updateOne(
      {
        organization: organizationId,
        appInstallation: appInstallationId,
      },
      {$set: {active: false}, $unset: {accessToken: ''}},
    );
  }

  async grantPermission(
    {
      organization: organizationId,
      appInstallation: appInstallationId,
    }: InstallationIdentity,
    accessToken: string,
  ): Promise<void> {
    await this.dbService.collectionOfType('installation').updateOne(
      {
        organization: organizationId,
        appInstallation: appInstallationId,
      },
      {$set: {accessToken, active: true}},
    );
  }

  async revokePermission({
    organization: organizationId,
    appInstallation: appInstallationId,
  }: InstallationIdentity): Promise<void> {
    await this.dbService.collectionOfType('installation').updateOne(
      {
        organization: organizationId,
        appInstallation: appInstallationId,
      },
      {$unset: {accessToken: ''}},
    );
  }

  async getActiveInstallation({
    organization: organizationId,
    appInstallation: appInstallationId,
  }: InstallationIdentity): Promise<Installation | undefined> {
    let doc = await this.dbService.collectionOfType('installation').findOne({
      organization: organizationId,
      appInstallation: appInstallationId,
      active: true,
    });

    return doc ? convertInstallationDocumentToInstallation(doc) : undefined;
  }
}

function convertInstallationDocumentToInstallation({
  _id,
  ...rest
}: InstallationDocument): Installation {
  return rest;
}
