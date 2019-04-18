import {IIssue} from './issue';

export interface GitLabIssueProviderOptions {
  type: 'gitlab';
  gitlabURL: string;
  gitlabToken: string;
  gitlabProjectName: string;
}

export interface GitLabIssue extends IIssue {
  providerOptions: GitLabIssueProviderOptions;
}
