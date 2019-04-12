import {ObjectId} from 'mongodb';

import {TaskStage} from './task';

export interface GitHubInputsDocument extends GitHubInputs {
  _id: ObjectId;
  /**
   * The numeric id of each repositories.
   */
  issueNumber: number;
}

export interface GitHubInputs {
  githubAPIUrl: string;
  githubToken: string;
  githubProjectName: string;
  taskId: string;
  taskStage: TaskStage;
  taskBrief: string;
  taskDescription: string;
  taskActiveNodes: string[];
}
