import {IIssue} from './issue';

export interface GitHubIssueProviderOptions {
  type: 'github';
  githubAPIURL: string;
  githubToken: string;
  githubProjectName: string;
}

export interface GitHubIssue extends IIssue {
  providerOptions: GitHubIssueProviderOptions;
}
