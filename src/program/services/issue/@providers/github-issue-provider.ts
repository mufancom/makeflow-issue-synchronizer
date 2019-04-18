import Octokit from '@octokit/rest';
import {FilterQuery} from 'mongodb';

import {
  ExpectedError,
  GitHubIssueProviderOptions,
  Issue,
  IssueDocument,
} from '../../../core';
import {IIssueProvider} from '../@issue-provider';

type GitHubIssueStatus = 'open' | 'closed';

export class GitHubIssueProvider implements IIssueProvider {
  getLockResourceId(issue: Issue): string {
    let {config: configId, task: taskId} = issue;

    return `issue-synchronizer:github:${configId}:${taskId}`;
  }

  getIssueQuery(issue: Issue): FilterQuery<IssueDocument> {
    let {config: configId, task: taskId, providerOptions} = issue;

    let {
      githubAPIURL,
      githubProjectName,
    } = providerOptions as GitHubIssueProviderOptions;

    return {
      config: configId,
      task: taskId,
      'providerOptions.githubAPIURL': githubAPIURL,
      'providerOptions.githubProjectName': githubProjectName,
    };
  }

  async createIssue(issue: Issue): Promise<number> {
    let {providerOptions, taskBrief, taskDescription} = issue;

    let {
      githubAPIURL,
      githubProjectName,
      githubToken,
    } = providerOptions as GitHubIssueProviderOptions;

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

  async updateIssue(issue: Issue, issueNumber: number): Promise<void> {
    let {providerOptions, taskBrief, taskDescription, taskStage} = issue;

    let {
      githubAPIURL: githubAPIUrl,
      githubProjectName,
      githubToken,
    } = providerOptions as GitHubIssueProviderOptions;

    let octokit = new Octokit({
      baseUrl: githubAPIUrl,
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

  private getLabels(issue: Issue): string[] {
    let {taskNonDoneActiveNodes, taskTags} = issue;

    return [...taskNonDoneActiveNodes, ...taskTags.map(tag => tag.name)];
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
