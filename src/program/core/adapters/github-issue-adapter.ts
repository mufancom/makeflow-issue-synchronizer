import Octokit from '@octokit/rest';
import {FilterQuery} from 'mongodb';

import {ExpectedError} from '../error';
import {GitHubIssue, IssueDocument} from '../models';

import {AbstractIssueAdapter} from './issue-adapter';

type GitHubIssueStatus = 'open' | 'closed';

export class GitHubIssueAdapter extends AbstractIssueAdapter<GitHubIssue> {
  getLockResourceId({config: configId, task: taskId}: GitHubIssue): string {
    return `issue-synchronizer:github:${configId}:${taskId}`;
  }

  getIssueQuery({
    config: configId,
    task: taskId,
    options,
  }: GitHubIssue): FilterQuery<IssueDocument> {
    let {apiURL, projectName} = options;

    return {
      config: configId,
      task: taskId,
      'options.type': 'github',
      'options.apiURL': apiURL,
      'options.projectName': projectName,
    };
  }

  async createIssue(issue: GitHubIssue): Promise<number> {
    let {options, taskBrief, taskDescription} = issue;

    let {apiURL, projectName, token} = options;

    let [owner, repository] = this.getOwnerAndRepository(projectName);

    let octokit = new Octokit({
      baseUrl: apiURL,
      auth: token,
    });

    let response = await octokit.issues.create({
      owner,
      repo: repository,
      title: taskBrief,
      body: taskDescription,
      labels: this.getLabels(issue),
    });

    return response.data.number;
  }

  async updateIssue(issue: GitHubIssue, issueNumber: number): Promise<void> {
    let {options, taskBrief, taskDescription, taskStage} = issue;

    let {apiURL, projectName, token} = options;

    let octokit = new Octokit({
      baseUrl: apiURL,
      auth: token,
    });

    let [owner, repository] = this.getOwnerAndRepository(projectName);

    let state: GitHubIssueStatus =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'open' : 'closed';

    await octokit.issues.update({
      owner,
      repo: repository,
      number: issueNumber,
      title: taskBrief,
      body: taskDescription,
      labels: this.getLabels(issue),
      state,
    });
  }

  private getOwnerAndRepository(projectName: string): [string, string] {
    let [owner, repository] = projectName.split('/');

    if (!owner || !repository) {
      throw new ExpectedError(
        'APP_CONFIG_ERROR',
        '"github-project-name" should be provided as "owner/repository"',
      );
    }

    return [owner, repository];
  }
}
