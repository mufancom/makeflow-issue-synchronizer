import {FilterQuery} from 'mongodb';
import fetch, {Response} from 'node-fetch';
import {Dict} from 'tslang';

import {
  ExpectedError,
  GitLabIssueProviderOptions,
  Issue,
  IssueDocument,
} from '../../../core';
import {IIssueProvider} from '../@issue-provider';

type GitlabAPIMethod = 'get' | 'post' | 'put' | 'delete';

type GitlabStateEvent = 'reopen' | 'close';

interface GitLabAPIOptions {
  method: GitlabAPIMethod;
  token: string;
  body?: Dict<unknown> | string;
}

export class GitLabIssueProvider implements IIssueProvider {
  getLockResourceId(issue: Issue): string {
    let {config: configId, task: taskId} = issue;

    return `issue-synchronizer:gitlab:${configId}:${taskId}`;
  }

  getIssueQuery(issue: Issue): FilterQuery<IssueDocument> {
    let {config: configId, task: taskId, providerOptions} = issue;

    let {
      gitlabURL,
      gitlabProjectName,
    } = providerOptions as GitLabIssueProviderOptions;

    return {
      config: configId,
      task: taskId,
      'providerOptions.gitlabURL': gitlabURL,
      'providerOptions.gitlabProjectName': gitlabProjectName,
    };
  }

  async createIssue(issue: Issue): Promise<number> {
    let {providerOptions, taskBrief, taskDescription} = issue;

    let {
      gitlabURL,
      gitlabProjectName,
      gitlabToken,
    } = providerOptions as GitLabIssueProviderOptions;

    let encodedProjectName = encodeURIComponent(gitlabProjectName);

    let url = `${gitlabURL}/api/v4/projects/${encodedProjectName}/issues`;
    let body = {
      id: encodedProjectName,
      title: taskBrief,
      description: taskDescription,
      labels: this.getLabels(issue),
    };

    let response = await this.requestGitLabAPI(url, {
      method: 'post',
      token: gitlabToken,
      body,
    });

    let responseData = await response.json();

    return responseData.iid as number;
  }

  async updateIssue(issue: Issue, issueNumber: number): Promise<void> {
    let {providerOptions, taskBrief, taskDescription, taskStage} = issue;

    let {
      gitlabURL,
      gitlabProjectName,
      gitlabToken,
    } = providerOptions as GitLabIssueProviderOptions;

    let encodedProjectName = encodeURIComponent(gitlabProjectName);

    let url = `${gitlabURL}/api/v4/projects/${encodedProjectName}/issues/${issueNumber}`;

    let stateEvent: GitlabStateEvent =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'reopen' : 'close';

    let body = {
      id: encodedProjectName,
      issue_iid: issueNumber,
      title: taskBrief,
      labels: this.getLabels(issue),
      description: taskDescription,
      state_event: stateEvent,
    };

    await this.requestGitLabAPI(url, {
      method: 'put',
      body,
      token: gitlabToken,
    });
  }

  private getLabels(issue: Issue): string {
    let {taskNonDoneActiveNodes, taskTags} = issue;

    return [...taskNonDoneActiveNodes, ...taskTags.map(tag => tag.name)].join(
      ',',
    );
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
