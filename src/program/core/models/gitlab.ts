import {ObjectId} from 'mongodb';

import {TaskStage} from './task';

export interface GitLabInputsDocument extends GitLabInputs {
  _id: ObjectId;
  /**
   * Internal issue id for each projects.
   */
  iid: number;
}

export interface GitLabInputs {
  gitlabAPIUrl: string;
  gitlabToken: string;
  gitlabProjectName: string;
  taskId: string;
  taskStage: TaskStage;
  taskBrief: string;
  taskDescription: string;
  taskActiveNodes: string[];
  taskNodes: string[];
}
