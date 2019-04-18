import {FilterQuery} from 'mongodb';

import {Issue, IssueDocument} from '../../core';

export interface IIssueProvider {
  getLockResourceId(issue: Issue): string;
  getIssueQuery(issue: Issue): FilterQuery<IssueDocument>;
  createIssue(issue: Issue): Promise<number>;
  updateIssue(issue: Issue, issueNumber: number): Promise<void>;
}
