import escapeStringRegExp from 'escape-string-regexp';
import {FilterQuery} from 'mongodb';
import fetch, {Response} from 'node-fetch';
import {Dict} from 'tslang';

import {ExpectedError} from '../error';
import {GitLabIssue, IssueDocument} from '../models';

import {AbstractIssueAdapter} from './issue-adapter';

type GitlabAPIMethod = 'get' | 'post' | 'put' | 'delete';

type GitlabStateEvent = 'reopen' | 'close';

interface GitLabAPIOptions {
  method: GitlabAPIMethod;
  token: string;
  body?: Dict<unknown> | string;
}

export class GitLabIssueAdapter extends AbstractIssueAdapter<GitLabIssue> {
  getLockResourceId(issue: GitLabIssue): string {
    let {config: configId, task: taskId} = issue;

    return `issue-synchronizer:gitlab:${configId}:${taskId}`;
  }

  getIssueQuery(issue: GitLabIssue): FilterQuery<IssueDocument> {
    let {config: configId, task: taskId, options} = issue;

    let {url, projectName} = options;

    return {
      config: configId,
      task: taskId,
      'options.type': 'gitlab',
      'options.url': url,
      'options.projectName': projectName,
    };
  }

  analyzeIssueNumber(issue: GitLabIssue): number | undefined {
    let {
      metadata,
      options: {url, projectName},
    } = issue;

    let ref = metadata && metadata.ref;

    if (!ref || typeof ref !== 'string') {
      return undefined;
    }

    let matchResult = new RegExp(
      `^${escapeStringRegExp(url)}\/${escapeStringRegExp(
        projectName,
      )}\/issues\/(\\d+)\/?$`,
    ).exec(ref);

    if (!matchResult) {
      return undefined;
    }

    return Number(matchResult[1]);
  }

  async createIssue(issue: GitLabIssue): Promise<number> {
    let {options, taskBrief, taskDescription} = issue;

    let {url, projectName, token} = options;

    let encodedProjectName = encodeURIComponent(projectName);

    let apiURL = `${url}/api/v4/projects/${encodedProjectName}/issues`;
    let body = {
      id: encodedProjectName,
      title: taskBrief,
      description: taskDescription,
      labels: this.getGitLabLabels(issue),
    };

    let response = await this.requestGitLabAPI(apiURL, {
      method: 'post',
      token,
      body,
    });

    let responseData = await response.json();

    return responseData.iid as number;
  }

  async updateIssue(issue: GitLabIssue, issueNumber: number): Promise<void> {
    let {options, taskBrief, taskDescription, taskStage} = issue;

    let {url, projectName, token} = options;

    let encodedProjectName = encodeURIComponent(projectName);

    let apiURL = `${url}/api/v4/projects/${encodedProjectName}/issues/${issueNumber}`;

    let stateEvent: GitlabStateEvent =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'reopen' : 'close';

    let body = {
      id: encodedProjectName,
      issue_iid: issueNumber,
      title: taskBrief,
      labels: this.getGitLabLabels(issue),
      description: taskDescription,
      state_event: stateEvent,
    };

    await this.requestGitLabAPI(apiURL, {
      method: 'put',
      body,
      token,
    });
  }

  private getGitLabLabels(issue: GitLabIssue): string {
    return this.getLabels(issue).join(',');
  }

  private async requestGitLabAPI(
    url: string,
    {method, body, token}: GitLabAPIOptions,
  ): Promise<Response> {
    if (typeof body === 'object') {
      body = Object.entries(body)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        )
        .join('&');
    }

    if (method === 'get') {
      url = body ? `${url}?${body}` : url;
    }

    let response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Private-Token': token,
      },
      body: method !== 'get' ? body : undefined,
    });

    if (response.status === 401) {
      throw new ExpectedError('GITLAB_AUTHORIZE_FAILED');
    }

    return response;
  }
}
