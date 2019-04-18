import {ObjectId} from 'mongodb';

import {GitHubIssueProviderOptions} from './github';
import {GitLabIssueProviderOptions} from './gitlab';
import {TaskStage, TaskTag} from './task';

export interface IssueDocument {
  _id: ObjectId;
  issueNumber: number;
  config: string;
  clock: number;
  task: string;
  providerOptions: IssueProviderOptions;
}

export type IssueProviderOptions =
  | GitHubIssueProviderOptions
  | GitLabIssueProviderOptions;

export interface IIssue {
  config: string;
  clock: number;
  task: string;
  tagName: string;
  providerOptions: object;
  syncTags: string;
  syncStageTags: string;
  taskStage: TaskStage;
  taskBrief: string;
  taskDescription: string;
  taskNonDoneActiveNodes: string[];
  taskTags: TaskTag[];
}
