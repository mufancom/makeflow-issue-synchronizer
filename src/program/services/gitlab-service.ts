import fetch, {Response} from 'node-fetch';
import {Dict} from 'tslang';

import {GitLabData, GitLabDataDocument} from '../core';

import {DBService} from './db-service';
import {LockService} from './lock-service';

interface GitLabAPIOptions {
  method: 'get' | 'post' | 'put' | 'delete';
  token: string;
  body?: Dict<unknown> | string;
}

export class GitLabService {
  constructor(private dbService: DBService, private lockService: LockService) {}

  async synchronizeIssue(data: GitLabData): Promise<void> {
    let {taskId, installation, gitlabAPIUrl, gitlabProjectName} = data;

    if (!taskId) {
      return;
    }

    let lockPath = await this.lockService.lock(
      `gitlab-issue-synchronizer:${installation}:${taskId}:${encodeURIComponent(
        gitlabAPIUrl,
      )}:${encodeURIComponent(gitlabProjectName)}`,
    );

    let previousData = await this.dbService
      .collectionOfType('gitlab-issue-synchronizer-data')
      .findOne({
        installation,
        gitlabAPIUrl,
        gitlabProjectName,
        taskId,
      });

    if (previousData) {
      await this.updateIssue(data, previousData);
    } else {
      await this.createIssue(data);
    }

    await this.lockService.unlock(lockPath);
  }

  private async createIssue(data: GitLabData): Promise<void> {
    let {
      gitlabAPIUrl,
      gitlabProjectName,
      gitlabToken,
      taskBrief,
      taskDescription,
      taskActiveNodes,
    } = data;

    let encodedProjectName = encodeURIComponent(gitlabProjectName);

    let url = `${gitlabAPIUrl}/projects/${encodedProjectName}/issues`;
    let body = {
      id: encodedProjectName,
      title: taskBrief,
      description: taskDescription,
      labels: taskActiveNodes.join(','),
    };

    let response = await this.requestGitLabAPI(url, {
      method: 'post',
      token: gitlabToken,
      body,
    });

    let responseData = await response.json();

    let issueInternalId = responseData.iid;

    if (response.status !== 201 || !Number.isInteger(issueInternalId)) {
      return;
    }

    await this.dbService
      .collectionOfType('gitlab-issue-synchronizer-data')
      .insertOne({
        iid: issueInternalId,
        ...data,
      } as GitLabDataDocument);
  }

  private async updateIssue(
    data: GitLabData,
    previousDataDocument: GitLabDataDocument,
  ): Promise<void> {
    let {_id, iid, clock: previousClock} = previousDataDocument;

    let {
      clock,
      gitlabAPIUrl: gitlabApiUrl,
      gitlabProjectName,
      gitlabToken,
      taskBrief,
      taskDescription,
      taskNodes,
      taskActiveNodes,
      taskStage,
    } = data;

    if (clock <= previousClock) {
      return;
    }

    let encodedProjectName = encodeURIComponent(gitlabProjectName);

    let url = `${gitlabApiUrl}/projects/${encodedProjectName}/issues/${iid}`;

    let issueResponse = await this.requestGitLabAPI(url, {
      method: 'get',
      token: gitlabToken,
    });

    let issue = await issueResponse.json();

    let issueLabels = [
      ...(issue.labels as string[]).filter(label => !taskNodes.includes(label)),
      ...taskActiveNodes,
    ];

    let stateEvent: 'reopen' | 'close' =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'reopen' : 'close';

    let body = {
      id: encodedProjectName,
      issue_iid: iid,
      title: taskBrief,
      labels: issueLabels.join(','),
      description: taskDescription,
      state_event: stateEvent,
    };

    let response = await this.requestGitLabAPI(url, {
      method: 'put',
      body,
      token: gitlabToken,
    });

    if (response.status !== 201) {
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
      console.error('[GITLAB_AUTHORIZE_FAILED]');
      throw new Error('GITLAB_AUTHORIZE_FAILED');
    }

    return response;
  }
}
