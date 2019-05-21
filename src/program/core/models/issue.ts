import {ObjectId} from 'mongodb';
import {Dict} from 'tslang';

import {GitHubIssueProviderOptions} from './github';
import {GitLabIssueProviderOptions} from './gitlab';
import {TaskStage, TaskTag} from './task';

export interface IssueDocument {
  _id: ObjectId;
  issueNumber: number;
  config: string;
  clock: number;
  task: string;
  options: IssueProviderOptions;
}

export type IssueProviderOptions =
  | GitHubIssueProviderOptions
  | GitLabIssueProviderOptions;

export interface IIssue {
  config: string;
  clock: number;
  task: string;
  tagName: string;
  options: object;
  tagsPattern: string;
  stagesPattern: string;
  taskStage: TaskStage;
  taskBrief: string;
  taskDescription: string;
  taskNonDoneActiveNodes: string[];
  taskTags: TaskTag[];
  metadata: Dict<unknown>;
}
