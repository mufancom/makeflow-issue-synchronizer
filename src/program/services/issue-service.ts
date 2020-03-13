import * as v from 'villa';

import {
  ExpectedError,
  GitHubIssueAdapter,
  GitLabIssueAdapter,
  IIssueAdapter,
  Issue,
  IssueDocument,
  IssueProviderOptions,
} from '../core';
import {PowerAppConfig} from '../types';
import {checkRequiredConfigs} from '../utils';

import {DBService} from './db-service';
import {InstallationService} from './installation-service';
import {LockService, LockServiceZookeeperLockPath} from './lock-service';
import {MakeflowService} from './makeflow-service';
import {API} from '@makeflow/types';

const ISSUE_SYNC_CONCURRENCY = 5;

type IssueAdapterDict = {[K in Issue['options']['type']]: IIssueAdapter};

export interface IssueServiceSynchronizeIssuesOptions {
  organization: string;
  installation: string;
  token: string;
  clock: number;
  resources: API.PowerGlance.ResourceEntry[];
  config: PowerAppConfig;
  options: IssueProviderOptions;
}

export class IssueService {
  private issueAdapterDict: IssueAdapterDict = {
    github: new GitHubIssueAdapter(),
    gitlab: new GitLabIssueAdapter(),
  };

  constructor(
    private installationService: InstallationService,
    private makeflowService: MakeflowService,
    private dbService: DBService,
    private lockService: LockService,
  ) {}

  async synchronizeIssuesFromConfig({
    token,
    clock,
    organization: organizationId,
    installation: installationId,
    resources,
    config,
    options,
  }: IssueServiceSynchronizeIssuesOptions): Promise<void> {
    if (resources.some(resource => resource.ref.type !== 'task')) {
      throw new ExpectedError(
        'PARAMETER_ERROR',
        'GitHub issue synchronizer only handle resource with type "task"',
      );
    }

    for (let resource of resources) {
      checkRequiredConfigs(
        resource.inputs,
        ['task-stage', 'task-brief'],
        `resource inputs of "${resource.ref.type}:${resource.ref.id}"`,
      );
    }

    await v.parallel(
      resources
        .filter(({inputs: {disabled}}) => !disabled)
        .map(
          ({ref: {id}, inputs, removed}): Issue => {
            return {
              clock,
              task: id,
              organization: organizationId,
              installation: installationId,
              token,
              tagsPattern: config['tags-pattern'],
              stagesPattern: config['stages-pattern'],
              taskBrief: inputs['task-brief'],
              taskStage: inputs['task-stage'],
              taskNodes: inputs['task-nodes'],
              taskDescription: inputs['task-description'],
              taskTags: inputs['task-tags'],
              taskURL: inputs['task-url'],
              taskMetadataSource: inputs['task-metadata-source'],
              options,
              removed: !!removed,
            } as Issue;
          },
        ),
      issue => this.synchronizeIssue(issue),
      ISSUE_SYNC_CONCURRENCY,
    );
  }

  async synchronizeIssue(issue: Issue): Promise<void> {
    let lockPath: LockServiceZookeeperLockPath | undefined;

    try {
      let {
        options: {type: adapterType},
      } = issue;

      let adapter = this.issueAdapterDict[adapterType];

      lockPath = await this.lockService.lock(adapter.getLockResourceId(issue));

      let query = adapter.getIssueQuery(issue);

      let issueDoc = await this.dbService
        .collectionOfType('issue')
        .findOne(query);

      let {
        token,
        clock,
        task: taskId,
        options,
        removed,
        organization: organizationId,
        installation: installationId,
      } = issue;

      if (issueDoc) {
        await adapter.updateIssue(issue, issueDoc.issueNumber);

        await this.dbService.collectionOfType('issue').updateOne(query, {
          $set: {
            token,
            clock,
            task: taskId,
            options,
          },
        });
      } else if (!removed) {
        let issueNumber = adapter.analyzeIssueNumber(issue);

        if (issueNumber !== undefined) {
          await adapter.updateIssue(issue, issueNumber);
        } else {
          issueNumber = await adapter.createIssue(issue);
        }

        await this.dbService.collectionOfType('issue').insertOne({
          issueNumber,
          token,
          clock,
          task: taskId,
          options,
        } as IssueDocument);

        let installation = await this.installationService.getActiveInstallation(
          {
            organization: organizationId,
            installation: installationId,
          },
        );

        if (installation && installation.accessToken) {
          await this.makeflowService.addTaskOutputs(
            taskId,
            adapter.getTaskOutputsFromIssueNumber(issue, issueNumber),
            {
              baseURL: installation.makeflowBaseURL,
              token: installation.accessToken,
            },
          );
        }
      }
    } finally {
      if (lockPath) {
        await this.lockService.unlock(lockPath);
      }
    }
  }
}
