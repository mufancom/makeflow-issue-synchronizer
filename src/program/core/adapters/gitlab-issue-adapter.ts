import {URL} from 'url';

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
    let {token, task: taskId} = issue;

    return `issue-synchronizer:gitlab:${token}:${taskId}`;
  }

  getIssueQuery(issue: GitLabIssue): FilterQuery<IssueDocument> {
    let {token, task: taskId, options} = issue;

    let {url, projectName} = options;

    return {
      token,
      task: taskId,
      'options.type': 'gitlab',
      'options.url': url,
      'options.projectName': projectName,
    };
  }

  analyzeIssueNumber(issue: GitLabIssue): number | undefined {
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

  async createIssue(issue: GitLabIssue): Promise<number> {
    let {options, taskBrief, taskStage} = issue;

    let {url, projectName, token} = options;

    let encodedProjectName = encodeURIComponent(projectName);

    let apiURL = `${url}/api/v4/projects/${encodedProjectName}/issues`;
    let body = {
      id: encodedProjectName,
      title: taskBrief,
      description: this.getIssueBody(issue),
      labels: this.getGitLabLabels(issue),
    };

    let response = await this.requestGitLabAPI(apiURL, {
      method: 'post',
      token,
      body,
    });

    let responseData = await response.json();

    if (response.status !== 201) {
      throw new Error(responseData.message);
    }

    let issueNumber = responseData.iid as number;

    let stateEvent: GitlabStateEvent =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'reopen' : 'close';

    if (stateEvent !== 'reopen') {
      let body = {
        id: encodedProjectName,
        issue_iid: issueNumber,
        state_event: stateEvent,
      };

      await this.requestGitLabAPI(apiURL, {
        method: 'put',
        body,
        token,
      });
    }

    return issueNumber;
  }

  async updateIssue(issue: GitLabIssue, issueNumber: number): Promise<void> {
    let {options, taskBrief, taskStage, removed} = issue;

    let {url, projectName, token} = options;

    let encodedProjectName = encodeURIComponent(projectName);

    let apiURL = `${url}/api/v4/projects/${encodedProjectName}/issues/${issueNumber}`;

    let stateEvent: GitlabStateEvent =
      !removed && (taskStage === 'in-progress' || taskStage === 'to-do')
        ? 'reopen'
        : 'close';

    let body = {
      id: encodedProjectName,
      issue_iid: issueNumber,
      title: taskBrief,
      labels: this.getGitLabLabels(issue),
      description: this.getIssueBody(issue),
      state_event: stateEvent,
    };

    await this.requestGitLabAPI(apiURL, {
      method: 'put',
      body,
      token,
    });
  }

  getTaskOutputsFromIssueNumber(
    issue: GitLabIssue,
    issueNumber: number,
  ): Dict<unknown> {
    let url = new URL(issue.options.url);

    url.pathname = `${issue.options.projectName}/issues/${issueNumber}`;

    return {
      'gitlab:issue:id': issueNumber,
      'gitlab:issue:url': url.toString(),
    };
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

  private getIssueBody(issue: GitLabIssue): string {
    let {taskURL, taskDescription} = issue;

    return `Makeflow task reference: ${taskURL}\n${taskDescription}`;
  }
}
