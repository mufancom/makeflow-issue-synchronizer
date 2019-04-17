import {Issue, IssueDocument} from '../../core';
import {DBService} from '../db-service';
import {LockService, LockServiceZookeeperLockPath} from '../lock-service';

import {IssueProvider} from './@issue-provider';
import {GitHubIssueProvider, GitLabIssueProvider} from './@providers';

type IssueProviderDict = {
  [K in Issue['providerOptions']['type']]: IssueProvider
};

export class IssueService {
  private issueProviderDict: IssueProviderDict = {
    github: new GitHubIssueProvider(),
    gitlab: new GitLabIssueProvider(),
  };

  constructor(private dbService: DBService, private lockService: LockService) {}

  async synchronizeIssue(issue: Issue): Promise<void> {
    let lockPath: LockServiceZookeeperLockPath | undefined;

    try {
      let {
        providerOptions: {type: providerType},
      } = issue;

      let provider = this.issueProviderDict[providerType];

      lockPath = await this.lockService.lock(provider.getLockResourceId(issue));

      let query = provider.getIssueQuery(issue);

      let issueDoc = await this.dbService
        .collectionOfType('issue')
        .findOne(query);

      let {config: configId, clock, task: taskId, providerOptions} = issue;

      if (issueDoc) {
        await provider.updateIssue(issue, issueDoc.issueNumber);

        await this.dbService.collectionOfType('issue').updateOne(query, {
          $set: {
            config: configId,
            clock,
            task: taskId,
            providerOptions,
          },
        });
      } else {
        let issueNumber = await provider.createIssue(issue);

        await this.dbService.collectionOfType('issue').insertOne({
          issueNumber,
          config: configId,
          clock,
          task: taskId,
          providerOptions,
        } as IssueDocument);
      }
    } catch (error) {
      throw error;
    } finally {
      if (lockPath) {
        await this.lockService.unlock(lockPath);
      }
    }
  }
}
