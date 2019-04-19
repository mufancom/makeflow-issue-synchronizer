import Router from 'koa-router';

import {ExpectedError} from '../core';
import {IssueService} from '../services';
import {checkRequiredFields, requestProcessor} from '../utils';

export function routeGitHubIssueSynchronizer(
  issueService: IssueService,
  apiRouter: Router,
): void {
  apiRouter.post(
    '/github-issue-synchronizer/notify',
    requestProcessor(async ctx => {
      let {
        name,
        config: configId,
        'tag-name': tagName,
        clock,
        resource,
        inputs,
      } = ctx.request.body;

      if (name !== 'github-issue-synchronizer') {
        throw new ExpectedError(
          'PARAMETER_ERROR',
          'GitHub issue synchronizer only accept parameters with name "github-issue-synchronizer".',
        );
      }

      if (resource.type !== 'task') {
        throw new ExpectedError(
          'PARAMETER_ERROR',
          'GitHub issue synchronizer only handle resource with type "task"',
        );
      }

      checkRequiredFields(
        inputs,
        ['github-api-url', 'github-token', 'github-project-name', 'task-brief'],
        'GitHub issue synchronizer inputs',
      );

      await issueService.synchronizeIssue({
        clock,
        task: resource.id,
        config: configId,
        options: {
          type: 'github',
          apiURL: inputs['github-api-url'],
          token: inputs['github-token'],
          projectName: inputs['github-project-name'],
        },
        tagName,
        syncTags: inputs['sync-tags'],
        syncStageTags: inputs['sync-stage-tags'],
        taskBrief: inputs['task-brief'],
        taskStage: inputs['task-stage'],
        taskNonDoneActiveNodes: inputs['task-non-done-active-nodes'],
        taskDescription: inputs['task-description'],
        taskTags: inputs['task-tags'],
      });
    }),
  );
}
