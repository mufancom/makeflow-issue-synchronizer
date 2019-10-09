export type TaskStage = 'to-do' | 'in-progress' | 'done' | 'canceled';

export interface TaskTag {
  id: string;
  displayName: string;
}

export interface ResourceRef {
  type: string;
  id: string;
}

export interface ResourceInputs {
  'task-stage': TaskStage;
  'task-brief': string;
  'task-description': string;
  'task-tags': TaskTag[];
  'task-non-done-active-nodes': string[];
  'task-ref': string;
  disabled: boolean;
}

export interface Resource {
  ref: ResourceRef;
  inputs: ResourceInputs;
}

export type PowerAppConfig = GitHubPowerAppConfig | GitLabPowerAppConfig;

export interface GitHubPowerAppConfig {
  'github-url': string;
  'github-token': string;
  'github-project-name': string;
  'tags-pattern': string;
  'stages-pattern': string;
}

export interface GitLabPowerAppConfig {
  'gitlab-url': string;
  'gitlab-token': string;
  'gitlab-project-name': string;
  'tags-pattern': string;
  'stages-pattern': string;
}

export interface MakeflowPowerGlanceApiBody<TConfig extends PowerAppConfig> {
  name: string;
  clock: number;
  token: string;
  resources: Resource[];
  initialize: boolean;
  configs: TConfig;
}
