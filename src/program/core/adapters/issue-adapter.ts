import {FilterQuery} from 'mongodb';

import {Issue, IssueDocument} from '../models';

const SYNC_ALL = '*';
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
      tagsPattern = SYNC_OFF,
      stagesPattern = SYNC_OFF,
    } = issue;

    let stageLabelNames = this.getLabelNamesByPattern(
      stagesPattern,
      taskNonDoneActiveNodes,
    );

    let tagLabelNames = this.getLabelNamesByPattern(
      tagsPattern,
      taskTags.map(tag => tag.name),
      [tagName],
    );

    return [...stageLabelNames, ...tagLabelNames];
  }

  private getLabelNamesByPattern(
    labelPattern: string,
    originLabels: string[],
    avoidedLabels: string[] = [],
  ): string[] {
    if (labelPattern === 'off') {
      return [];
    }

    let allowedLabelsMap = new Map(
      labelPattern.split(',').map(item => {
        let [key, value] = item.split(':');

        return [key.trimStart(), value];
      }),
    );

    if (!allowedLabelsMap.has(SYNC_ALL)) {
      originLabels = originLabels.filter(label => allowedLabelsMap.has(label));
    }

    if (avoidedLabels.length) {
      originLabels = originLabels.filter(
        label => !avoidedLabels.includes(label),
      );
    }

    return originLabels.map(label => allowedLabelsMap.get(label) || label);
  }
}

export interface IIssueAdapter extends IssueAdapter<Issue> {}

export const AbstractIssueAdapter = IssueAdapter;
