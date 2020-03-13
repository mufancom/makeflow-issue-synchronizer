import {Dict} from 'tslang';

export type TaskStage = 'to-do' | 'in-progress' | 'done' | 'canceled';

export interface TaskTag {
  id: string;
  displayName: string;
}

export type TaskNodeStage = 'none' | 'in-progress' | 'done' | 'terminated';

export interface TaskNode {
  id: string;
  displayName: string;
  stage: TaskNodeStage;
}

export interface TaskMetadataSource {
  type: string;
  url: string;
}

export interface ResourceInputs {
  'task-stage': TaskStage;
  'task-brief': string;
  'task-description': string;
  'task-tags': TaskTag[];
  'task-nodes': TaskNode[];
  'task-metadata-source'?: TaskMetadataSource;
  'task-url': string;
  disabled: boolean;
}

export type PowerAppConfig = GitHubPowerAppConfig | GitLabPowerAppConfig;

export interface GitHubPowerAppConfig extends Dict<unknown> {
  'github-url': string;
  'github-token': string;
  'github-project-name': string;
  'tags-pattern': string;
  'stages-pattern': string;
}

export interface GitLabPowerAppConfig extends Dict<unknown> {
  'gitlab-url': string;
  'gitlab-token': string;
  'gitlab-project-name': string;
  'tags-pattern': string;
  'stages-pattern': string;
}
