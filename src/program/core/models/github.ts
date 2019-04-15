import {ObjectId} from 'mongodb';

import {TaskStage} from './task';

export interface GitHubDataDocument extends GitHubData {
  _id: ObjectId;
  /**
   * The numeric id of each repositories.
   */
  issueNumber: number;
}

export interface GitHubData {
  installation: string;
  clock: number;
  taskId: string;
  githubAPIUrl: string;
  githubToken: string;
  githubProjectName: string;
  taskStage: TaskStage;
  taskBrief: string;
  taskDescription: string;
  taskActiveNodes: string[];
  taskNodes: string[];
}
