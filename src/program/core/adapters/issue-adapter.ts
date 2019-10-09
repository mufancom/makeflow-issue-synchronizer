import {FilterQuery} from 'mongodb';

import {Issue, IssueDocument} from '../models';

const SYNC_PATTERN_ALL = '*';
const SYNC_PATTERN_OFF = '';

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
      tagsPattern = SYNC_PATTERN_OFF,
      stagesPattern = SYNC_PATTERN_OFF,
    } = issue;

    let stageLabelNames = this.getLabelNamesByPattern(
      stagesPattern,
      taskNonDoneActiveNodes,
    );

    let tagLabelNames = this.getLabelNamesByPattern(
      tagsPattern,
      taskTags.map(tag => tag.displayName),
    );

    return [...stageLabelNames, ...tagLabelNames];
  }

  private getLabelNamesByPattern(
    labelPattern: string,
    labels: string[],
    excludeLabels: string[] = [],
  ): string[] {
    if (labelPattern === SYNC_PATTERN_OFF) {
      return [];
    }

    let allowedLabelsMap = new Map(
      labelPattern.split(',').map(item => {
        let [key, value] = item.split(':');

        return [key.trim(), value && value.trim()];
      }),
    );

    if (!allowedLabelsMap.has(SYNC_PATTERN_ALL)) {
      labels = labels.filter(label => allowedLabelsMap.has(label));
    }

    if (excludeLabels.length) {
      labels = labels.filter(label => !excludeLabels.includes(label));
    }

    return labels.map(label => allowedLabelsMap.get(label) || label);
  }
}

export interface IIssueAdapter extends IssueAdapter<Issue> {}

export const AbstractIssueAdapter = IssueAdapter;
