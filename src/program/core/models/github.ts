import {IIssue} from './issue';

export interface GitHubIssueProviderOptions {
  type: 'github';
  url: string;
  token: string;
  projectName: string;
}

export interface GitHubIssue extends IIssue {
  options: GitHubIssueProviderOptions;
}
