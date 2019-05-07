import {
  GitHubIssueAdapter,
  GitLabIssueAdapter,
  IIssueAdapter,
  Issue,
  IssueDocument,
} from '../core';

import {DBService} from './db-service';
import {LockService, LockServiceZookeeperLockPath} from './lock-service';

type IssueAdapterDict = {[K in Issue['options']['type']]: IIssueAdapter};

export class IssueService {
  private issueAdapterDict: IssueAdapterDict = {
    github: new GitHubIssueAdapter(),
    gitlab: new GitLabIssueAdapter(),
  };

  constructor(private dbService: DBService, private lockService: LockService) {}

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

      let {config: configId, clock, task: taskId, options} = issue;

      if (issueDoc) {
        await adapter.updateIssue(issue, issueDoc.issueNumber);

        await this.dbService.collectionOfType('issue').updateOne(query, {
          $set: {
            config: configId,
            clock,
            task: taskId,
            options,
          },
        });
      } else {
        let issueNumber = adapter.analyzeIssueNumber(issue);

        if (issueNumber !== undefined) {
          await adapter.updateIssue(issue, issueNumber);
        } else {
          issueNumber = await adapter.createIssue(issue);
        }

        await this.dbService.collectionOfType('issue').insertOne({
          issueNumber,
          config: configId,
          clock,
          task: taskId,
          options,
        } as IssueDocument);
      }
    } finally {
      if (lockPath) {
        await this.lockService.unlock(lockPath);
      }
    }
  }
}
