import _ from 'lodash';
import fetch, {Response} from 'node-fetch';
import {Dict} from 'tslang';

import {GitLabInputs, GitLabInputsDocument} from '../core';

import {DBService} from './db-service';

type RequestGitLabAPIMethod = 'get' | 'post' | 'put' | 'delete';

export class GitLabService {
  constructor(private dbService: DBService) {}

  async synchronizeIssue(inputs: GitLabInputs): Promise<void> {
    let {taskId, gitlabAPIUrl: gitlabUrl, gitlabProjectName} = inputs;

    if (!taskId) {
      return;
    }

    let previousInputs = await this.dbService
      .collectionOfType('gitlab-issue-synchronizer-inputs')
      .findOne({
        gitlabAPIUrl: gitlabUrl,
        gitlabProjectName,
        taskId,
      });

    if (previousInputs) {
      await this.updateIssue(inputs, previousInputs);
    } else {
      await this.createIssue(inputs);
    }
  }

  private async createIssue(inputs: GitLabInputs): Promise<void> {
    let {
      gitlabAPIUrl: gitlabAPIUrl,
      gitlabProjectName,
      gitlabToken,
      taskBrief,
      taskDescription,
      taskActiveNodes,
    } = inputs;

    let encodedProjectName = encodeURIComponent(gitlabProjectName);

    let url = `${gitlabAPIUrl}/projects/${encodedProjectName}/issues`;
    let body = {
      id: encodedProjectName,
      title: taskBrief,
      description: taskDescription,
      labels: taskActiveNodes.join(','),
    };

    let response = await this.requestGitLabAPI(url, 'post', body, gitlabToken);

    let data = await response.json();

    let issueInternalId = data.iid;

    if (response.status !== 201 || !Number.isInteger(issueInternalId)) {
      return;
    }

    await this.dbService
      .collectionOfType('gitlab-issue-synchronizer-inputs')
      .insertOne({
        iid: issueInternalId,
        ...inputs,
      } as GitLabInputsDocument);
  }

  private async updateIssue(
    inputs: GitLabInputs,
    previousInputsDocument: GitLabInputsDocument,
  ): Promise<void> {
    let {_id, iid} = previousInputsDocument;

    let {
      gitlabAPIUrl: gitlabApiUrl,
      gitlabProjectName,
      gitlabToken,
      taskBrief,
      taskDescription,
      taskActiveNodes,
      taskStage,
    } = inputs;

    let encodedProjectName = encodeURIComponent(gitlabProjectName);

    let url = `${gitlabApiUrl}/projects/${encodedProjectName}/issues/${iid}`;

    let stateEvent: 'reopen' | 'close' =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'reopen' : 'close';

    let body = {
      id: encodedProjectName,
      issue_iid: iid,
      title: taskBrief,
      labels: taskActiveNodes.join(','),
      description: taskDescription,
      state_event: stateEvent,
    };

    let response = await this.requestGitLabAPI(url, 'put', body, gitlabToken);

    if (response.status !== 201) {
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

  private async requestGitLabAPI(
    url: string,
    method: RequestGitLabAPIMethod,
    body: Dict<unknown>,
    token: string,
  ): Promise<Response> {
    let stringifiedBody = Object.entries(body)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      )
      .join('&');

    if (method === 'get') {
      url = body ? `${url}?${body}` : url;
    }

    let response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Private-Token': token,
      },
      body: method !== 'get' ? stringifiedBody : undefined,
    });

    if (response.status === 401) {
      console.error('[GITLAB_AUTHORIZE_FAILED]');
      throw new Error('GITLAB_AUTHORIZE_FAILED');
    }

    return response;
  }
}
