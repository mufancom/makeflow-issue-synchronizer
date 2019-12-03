import {InstallationDocument} from '../core';
import {Installation, InstallationIdentity} from '../types';

import {DBService} from './db-service';

export class InstallationService {
  constructor(private dbService: DBService) {}

  async touchInstallation({
    organization: organizationId,
    installation: installationId,
    makeflowBaseURL,
  }: Installation): Promise<boolean> {
    let {value} = await this.dbService
      .collectionOfType('installation')
      .findOneAndUpdate(
        {
          organization: organizationId,
          installation: installationId,
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
    installation: installationId,
  }: InstallationIdentity): Promise<void> {
    await this.dbService.collectionOfType('installation').updateOne(
      {
        organization: organizationId,
        installation: installationId,
      },
      {$set: {active: false}, $unset: {accessToken: ''}},
    );
  }

  async grantPermission(
    {
      organization: organizationId,
      installation: installationId,
    }: InstallationIdentity,
    accessToken: string,
  ): Promise<void> {
    await this.dbService.collectionOfType('installation').updateOne(
      {
        organization: organizationId,
        installation: installationId,
      },
      {$set: {accessToken, active: true}},
    );
  }

  async revokePermission({
    organization: organizationId,
    installation: installationId,
  }: InstallationIdentity): Promise<void> {
    await this.dbService.collectionOfType('installation').updateOne(
      {
        organization: organizationId,
        installation: installationId,
      },
      {$unset: {accessToken: ''}},
    );
  }

  async getActiveInstallation({
    organization: organizationId,
    installation: installationId,
  }: InstallationIdentity): Promise<Installation | undefined> {
    let doc = await this.dbService.collectionOfType('installation').findOne({
      organization: organizationId,
      installation: installationId,
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
