import Octokit from '@octokit/rest';
import _ from 'lodash';

import {GithubInputsDocument, TaskStage} from '../core';
import {recursivelyOmitUndefined} from '../utils';

import {DBService} from './db-service';

export interface GithubInputs {
  githubUrl: string;
  githubToken: string;
  githubProjectName: string;
  taskId: string;
  taskStage: TaskStage;
  taskBrief: string;
  taskActiveNodes: string[];
}

export class GithubService {
  constructor(private dbService: DBService) {}

  async synchronizeIssue(inputs: GithubInputs): Promise<void> {
    let {taskId, githubUrl, githubProjectName} = inputs;

    if (!taskId) {
      return;
    }

    let previousInputs = await this.dbService
      .collectionOfType('github-issue-synchronizer-inputs')
      .findOne({
        githubUrl,
        githubProjectName,
        taskId,
      });

    if (previousInputs) {
      await this.updateIssue(inputs, previousInputs);
    } else {
      await this.createIssue(inputs);
    }
  }

  private async createIssue(inputs: GithubInputs): Promise<void> {
    let {
      githubUrl,
      githubToken,
      githubProjectName,
      taskBrief,
      taskActiveNodes,
    } = inputs;

    let [owner, repository] = githubProjectName.split('/');

    let octokit = new Octokit({
      baseUrl: githubUrl,
      auth: githubToken,
    });

    let response = await octokit.issues.create({
      owner,
      repo: repository,
      title: taskBrief,
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
      } as GithubInputsDocument);
  }

  private async updateIssue(
    inputs: GithubInputs,
    previousInputsDocument: GithubInputsDocument,
  ): Promise<void> {
    let {_id, issueNumber, ...previousInputs} = previousInputsDocument;

    let {
      taskBrief: previousTaskBrief,
      taskActiveNodes: previousTaskActiveNodes,
    } = previousInputs;

    let {
      githubUrl,
      githubProjectName,
      githubToken,
      taskBrief,
      taskActiveNodes,
      taskStage,
    } = inputs;

    let octokit = new Octokit({
      baseUrl: githubUrl,
      auth: githubToken,
    });

    let [owner, repository] = githubProjectName.split('/');

    let state: 'open' | 'closed' =
      taskStage === 'in-progress' || taskStage === 'to-do' ? 'open' : 'closed';

    let response = await octokit.issues.update(
      recursivelyOmitUndefined<Octokit.IssuesUpdateParams>({
        owner,
        repo: repository,
        number: issueNumber,
        title: taskBrief !== previousTaskBrief ? taskBrief : undefined,
        labels: !_.isEqual(taskActiveNodes, previousTaskActiveNodes)
          ? taskActiveNodes
          : undefined,
        state,
      }),
    );

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
