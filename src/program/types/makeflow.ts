export type TaskStage = 'to-do' | 'in-progress' | 'done' | 'canceled';

export interface TaskTag {
  id: string;
  displayName: string;
}

export interface ResourceRef {
  type: string;
  id: string;
}

export type TaskNodeStage = 'none' | 'in-progress' | 'done' | 'terminated';

export interface TaskNode {
  id: string;
  displayName: string;
  stage: TaskNodeStage;
}

export interface ResourceInputs {
  'task-stage': TaskStage;
  'task-brief': string;
  'task-description': string;
  'task-tags': TaskTag[];
  'task-nodes': TaskNode[];
  'task-ref': string;
  'task-url': string;
  disabled: boolean;
}

export interface Resource {
  ref: ResourceRef;
  inputs: ResourceInputs;
  removed?: boolean;
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
  organization: string;
  installation: string;
  resources: Resource[];
  initialize: boolean;
  configs: TConfig;
}

export interface MakeflowTouchInstallationBody {
  organization: string;
  team: string;
  installation: string;
  url: string;
  token: string;
}

export interface MakeflowDeactivateInstallationBody {
  organization: string;
  team: string;
  installation: string;
  token: string;
}

export interface MakeflowGrantPermissionBody {
  organization: string;
  team: string;
  installation: string;
  token: string;
  accessToken: string;
}

export interface MakeflowRevokePermissionBody {
  organization: string;
  team: string;
  installation: string;
  token: string;
}
