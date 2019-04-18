import {FilterQuery} from 'mongodb';

import {Issue, IssueDocument} from '../../core';

export interface IIssueProvider {
  getLockResourceId(issue: Issue): string;
  getIssueQuery(issue: Issue): FilterQuery<IssueDocument>;
  createIssue(issue: Issue): Promise<number>;
  updateIssue(issue: Issue, issueNumber: number): Promise<void>;
}

abstract class IssueProvider implements IIssueProvider {
  abstract getLockResourceId(issue: Issue): string;
  abstract getIssueQuery(issue: Issue): FilterQuery<IssueDocument>;
  abstract createIssue(issue: Issue): Promise<number>;
  abstract updateIssue(issue: Issue, issueNumber: number): Promise<void>;

  getLabels(issue: Issue): string[] {
    let {
      taskNonDoneActiveNodes,
      taskTags,
      tagName,
      syncTags = '#',
      syncStageTags = '#',
    } = issue;

    let stageTagNames =
      !syncStageTags || syncStageTags === '#' ? [] : taskNonDoneActiveNodes;

    let taskTagNames = taskTags.map(tag => tag.name);
    let toSyncTagNames: string[] = [];

    if (syncTags === '*') {
      toSyncTagNames = taskTagNames;
    } else if (syncTags && syncTags !== '#') {
      let abelToSyncTagNames = syncTags.split(',');

      toSyncTagNames = taskTagNames.filter(tagName =>
        abelToSyncTagNames.includes(tagName),
      );
    }

    return [...stageTagNames, ...toSyncTagNames].filter(
      label => label !== tagName,
    );
  }
}

export const AbstractIssueProvider = IssueProvider;
