import {URL} from 'url';

import Octokit from '@octokit/rest';
import escapeStringRegExp from 'escape-string-regexp';
import {FilterQuery} from 'mongodb';

import {ExpectedError} from '../error';
import {GitHubIssue, IssueDocument} from '../models';

import {AbstractIssueAdapter} from './issue-adapter';

type GitHubIssueStatus = 'open' | 'closed';

export class GitHubIssueAdapter extends AbstractIssueAdapter<GitHubIssue> {
  getLockResourceId({token, task: taskId}: GitHubIssue): string {
    return `issue-synchronizer:github:${token}:${taskId}`;
  }

  getIssueQuery({
    token,
    task: taskId,
    options,
  }: GitHubIssue): FilterQuery<IssueDocument> {
    let {projectName} = options;

    return {
      token,
      task: taskId,
      'options.type': 'github',
      'options.projectName': projectName,
    };
  }

  analyzeIssueNumber(issue: GitHubIssue): number | undefined {
    let {
      taskRef,
      options: {url, projectName},
    } = issue;

    if (!taskRef || typeof taskRef !== 'string') {
      return undefined;
    }

    let matchResult = new RegExp(
      `^${escapeStringRegExp(url)}\/${escapeStringRegExp(
        projectName,
      )}\/issues\/(\\d+)\/?$`,
    ).exec(taskRef);

    if (!matchResult) {
      return undefined;
    }

    return Number(matchResult[1]);
  }

  async createIssue(issue: GitHubIssue): Promise<number> {
    let {options, taskBrief, taskDescription, taskStage} = issue;

    let {projectName} = options;

    let [owner, repository] = this.getOwnerAndRepository(projectName);

    let octokit = this.getOctokit(issue);

    let state: GitHubIssueStatus =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'open' : 'closed';

    let response = await octokit.issues.create({
      owner,
      repo: repository,
      title: taskBrief,
      body: taskDescription,
      labels: this.getLabels(issue),
    });

    let issueNumber = response.data.number;

    if (state !== 'open') {
      await octokit.issues.update({
        owner,
        repo: repository,
        number: issueNumber,
        state,
      });
    }

    return issueNumber;
  }

  async updateIssue(issue: GitHubIssue, issueNumber: number): Promise<void> {
    let {options, taskBrief, taskDescription, taskStage, removed} = issue;

    let {projectName} = options;

    let octokit = this.getOctokit(issue);

    let [owner, repository] = this.getOwnerAndRepository(projectName);

    let state: GitHubIssueStatus =
      !removed && (taskStage === 'in-progress' || taskStage === 'to-do')
        ? 'open'
        : 'closed';

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

  private getOctokit(issue: GitHubIssue): Octokit {
    let {
      options: {url, token},
    } = issue;

    let urlObject = new URL(url);
    urlObject.host = `api.${urlObject.host}`;

    let href = urlObject.href;

    let apiBaseURL = href.substr(0, href.length - 1);

    return new Octokit({
      baseUrl: apiBaseURL,
      auth: token,
    });
  }
}
