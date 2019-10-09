import {GitHubIssue} from './github';
import {GitLabIssue} from './gitlab';

export type Issue = GitHubIssue | GitLabIssue;

export * from './github';
export * from './gitlab';
export * from './issue';
