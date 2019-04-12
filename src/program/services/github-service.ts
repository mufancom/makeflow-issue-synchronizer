import Octokit from '@octokit/rest';
import _ from 'lodash';

import {GitHubInputs, GitHubInputsDocument} from '../core';

import {DBService} from './db-service';

export class GitHubService {
  constructor(private dbService: DBService) {}

  async synchronizeIssue(inputs: GitHubInputs): Promise<void> {
    let {taskId, githubAPIUrl, githubProjectName} = inputs;

    if (!taskId) {
      return;
    }

    let previousInputs = await this.dbService
      .collectionOfType('github-issue-synchronizer-inputs')
      .findOne({
        githubAPIUrl,
        githubProjectName,
        taskId,
      });

    if (previousInputs) {
      await this.updateIssue(inputs, previousInputs);
    } else {
      await this.createIssue(inputs);
    }
  }

  private async createIssue(inputs: GitHubInputs): Promise<void> {
    let {
      githubAPIUrl,
      githubToken,
      githubProjectName,
      taskBrief,
      taskDescription,
      taskActiveNodes,
    } = inputs;

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
      .collectionOfType('github-issue-synchronizer-inputs')
      .insertOne({
        issueNumber,
        ...inputs,
      } as GitHubInputsDocument);
  }

  private async updateIssue(
    inputs: GitHubInputs,
    previousInputsDocument: GitHubInputsDocument,
  ): Promise<void> {
    let {_id, issueNumber} = previousInputsDocument;

    let {
      githubAPIUrl: githubAPIUrl,
      githubProjectName,
      githubToken,
      taskBrief,
      taskDescription,
      taskActiveNodes,
      taskStage,
    } = inputs;

    let octokit = new Octokit({
      baseUrl: githubAPIUrl,
      auth: githubToken,
    });

    let [owner, repository] = githubProjectName.split('/');

    let state: 'open' | 'closed' =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'open' : 'closed';

    let response = await octokit.issues.update({
      owner,
      repo: repository,
      number: issueNumber,
      title: taskBrief,
      body: taskDescription,
      labels: taskActiveNodes,
      state,
    });

    if (response.status !== 200) {
      return;
    }

    await this.dbService
      .collectionOfType('github-issue-synchronizer-inputs')
      .updateOne(
        {
          _id,
        },
        {
          $set: {
            ...inputs,
          },
        },
      );
  }
}
