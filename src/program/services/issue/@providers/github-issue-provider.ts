import Octokit from '@octokit/rest';
import {FilterQuery} from 'mongodb';

import {ExpectedError, GitHubIssue, IssueDocument} from '../../../core';
import {AbstractIssueProvider} from '../@issue-provider';

type GitHubIssueStatus = 'open' | 'closed';

export class GitHubIssueProvider extends AbstractIssueProvider {
  getLockResourceId(issue: GitHubIssue): string {
    let {config: configId, task: taskId} = issue;

    return `issue-synchronizer:github:${configId}:${taskId}`;
  }

  getIssueQuery(issue: GitHubIssue): FilterQuery<IssueDocument> {
    let {config: configId, task: taskId, providerOptions} = issue;

    let {githubAPIURL, githubProjectName} = providerOptions;

    return {
      config: configId,
      task: taskId,
      'providerOptions.githubAPIURL': githubAPIURL,
      'providerOptions.githubProjectName': githubProjectName,
    };
  }

  async createIssue(issue: GitHubIssue): Promise<number> {
    let {providerOptions, taskBrief, taskDescription} = issue;

    let {githubAPIURL, githubProjectName, githubToken} = providerOptions;

    let [owner, repository] = this.getOwnerAndRepository(githubProjectName);

    let octokit = new Octokit({
      baseUrl: githubAPIURL,
      auth: githubToken,
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
    let {providerOptions, taskBrief, taskDescription, taskStage} = issue;

    let {githubAPIURL, githubProjectName, githubToken} = providerOptions;

    let octokit = new Octokit({
      baseUrl: githubAPIURL,
      auth: githubToken,
    });

    let [owner, repository] = this.getOwnerAndRepository(githubProjectName);

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
