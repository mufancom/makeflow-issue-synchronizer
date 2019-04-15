import {ObjectId} from 'mongodb';

import {TaskStage} from './task';

export interface GitLabDataDocument extends GitLabData {
  _id: ObjectId;
  /**
   * Internal issue id for each projects.
   */
  iid: number;
}

export interface GitLabData {
  installation: 0;
  clock: number;
  taskId: string;
  gitlabAPIUrl: string;
  gitlabToken: string;
  gitlabProjectName: string;
  taskStage: TaskStage;
  taskBrief: string;
  taskDescription: string;
  taskActiveNodes: string[];
  taskNodes: string[];
}
