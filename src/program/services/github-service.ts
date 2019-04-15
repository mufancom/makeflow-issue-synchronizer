import Octokit from '@octokit/rest';

import {GitHubData, GitHubDataDocument} from '../core';

import {DBService} from './db-service';
import {LockService} from './lock-service';

export class GitHubService {
  constructor(private dbService: DBService, private lockService: LockService) {}

  async synchronizeIssue(data: GitHubData): Promise<void> {
    let {taskId, installation, githubAPIUrl, githubProjectName} = data;

    if (!taskId) {
      return;
    }

    let lockPath = await this.lockService.lock(
      `github-issue-synchronizer:${installation}:${taskId}:${encodeURIComponent(
        githubAPIUrl,
      )}:${encodeURIComponent(githubProjectName)}`,
    );

    let previousData = await this.dbService
      .collectionOfType('github-issue-synchronizer-data')
      .findOne({
        installation,
        githubAPIUrl,
        githubProjectName,
        taskId,
      });

    if (previousData) {
      await this.updateIssue(data, previousData);
    } else {
      await this.createIssue(data);
    }

    await this.lockService.unlock(lockPath);
  }

  private async createIssue(data: GitHubData): Promise<void> {
    let {
      githubAPIUrl,
      githubToken,
      githubProjectName,
      taskBrief,
      taskDescription,
      taskActiveNodes,
    } = data;

    let [owner, repository] = githubProjectName.split('/');

    let octokit = new Octokit({
      baseUrl: githubAPIUrl,
      auth: githubToken,
    });

    let response = await octokit.issues.create({
      owner,
      repo: repository,
      title: taskBrief,
      body: taskDescription,
      labels: taskActiveNodes,
    });

    let issueNumber = response.data.number;

    if (typeof issueNumber !== 'number') {
      return;
    }

    await this.dbService
      .collectionOfType('github-issue-synchronizer-data')
      .insertOne({
        issueNumber,
        ...data,
      } as GitHubDataDocument);
  }

  private async updateIssue(
    data: GitHubData,
    previousDataDocument: GitHubDataDocument,
  ): Promise<void> {
    let {_id, issueNumber, clock: previousClock} = previousDataDocument;

    let {
      clock,
      githubAPIUrl: githubAPIUrl,
      githubProjectName,
      githubToken,
      taskBrief,
      taskDescription,
      taskNodes,
      taskActiveNodes,
      taskStage,
    } = data;

    if (clock <= previousClock) {
      return;
    }

    let octokit = new Octokit({
      baseUrl: githubAPIUrl,
      auth: githubToken,
    });

    let [owner, repository] = githubProjectName.split('/');

    let state: 'open' | 'closed' =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'open' : 'closed';

    let issueResponse = await octokit.issues.get({
      owner,
      repo: repository,
      number: issueNumber,
    });

    if (issueResponse.status !== 200 || !issueResponse.data) {
      return;
    }

    let issueLabelNames = [
      ...issueResponse.data.labels
        .map(label => label.name)
        .filter(labelName => !taskNodes.includes(labelName)),
      ...taskActiveNodes,
    ];

    let response = await octokit.issues.update({
      owner,
      repo: repository,
      number: issueNumber,
      title: taskBrief,
      body: taskDescription,
      labels: issueLabelNames,
      state,
    });

    if (response.status !== 200) {
      return;
    }

    await this.dbService
      .collectionOfType('github-issue-synchronizer-data')
      .updateOne(
        {
          _id,
        },
        {
          $set: {
            ...data,
          },
        },
      );
  }
}
