import {FilterQuery} from 'mongodb';

import {Issue, IssueDocument} from '../models';

const SYNC_ALL = '*';
const SYNC_ON = 'on';
const SYNC_OFF = 'off';

abstract class IssueAdapter<TIssue extends Issue> {
  abstract getLockResourceId(issue: TIssue): string;
  abstract getIssueQuery(issue: TIssue): FilterQuery<IssueDocument>;
  abstract createIssue(issue: TIssue): Promise<number>;
  abstract updateIssue(issue: TIssue, issueNumber: number): Promise<void>;
  abstract analyzeIssueNumber(issue: TIssue): number | undefined;

  getLabels(issue: TIssue): string[] {
    let {
      taskNonDoneActiveNodes,
      taskTags,
      tagName,
      syncTags = SYNC_OFF,
      syncStageTags = SYNC_OFF,
    } = issue;

    let stageTagNames = syncStageTags === SYNC_ON ? taskNonDoneActiveNodes : [];

    let taskTagNames = taskTags.map(tag => tag.name);

    let taskTagNamesToSync: string[];

    if (syncTags === SYNC_ALL) {
      taskTagNamesToSync = taskTagNames;
    } else if (syncTags && syncTags !== SYNC_OFF) {
      let abelToSyncTagNameSet = new Set(syncTags.split(','));

      taskTagNamesToSync = taskTagNames.filter(tagName =>
        abelToSyncTagNameSet.has(tagName),
      );
    } else {
      taskTagNamesToSync = [];
    }

    return [...stageTagNames, ...taskTagNamesToSync].filter(
      label => label !== tagName,
    );
  }
}

export interface IIssueAdapter extends IssueAdapter<Issue> {}

export const AbstractIssueAdapter = IssueAdapter;
