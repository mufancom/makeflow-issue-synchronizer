import {ObjectId} from 'mongodb';

import {TaskNode, TaskStage, TaskTag} from '../../types';

import {GitHubIssueProviderOptions} from './github';
import {GitLabIssueProviderOptions} from './gitlab';

export interface IssueDocument {
  _id: ObjectId;
  organization: string;
  appInstallation: string;
  issueNumber: number;
  token: string;
  clock: number;
  task: string;
  options: IssueProviderOptions;
}

export type IssueProviderOptions =
  | GitHubIssueProviderOptions
  | GitLabIssueProviderOptions;

export interface IIssue {
  organization: string;
  appInstallation: string;
  token: string;
  clock: number;
  taskRef: string;
  task: string;
  options: object;
  tagsPattern: string;
  stagesPattern: string;
  taskStage: TaskStage;
  taskBrief: string;
  taskDescription: string;
  taskNodes: TaskNode[];
  taskTags: TaskTag[];
  taskURL: string;
  removed: boolean;
}
