import {IIssue} from './issue';

export interface GitLabIssueProviderOptions {
  type: 'gitlab';
  url: string;
  token: string;
  projectName: string;
}

export interface GitLabIssue extends IIssue {
  options: GitLabIssueProviderOptions;
}
