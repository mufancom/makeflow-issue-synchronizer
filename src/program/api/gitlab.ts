import Router from 'koa-router';

import {ExpectedError} from '../core';
import {IssueService} from '../services';
import {checkRequiredFields, requestProcessor} from '../utils';

export function routeGitLabIssueSynchronizer(
  issueService: IssueService,
  apiRouter: Router,
): void {
  apiRouter.post(
    '/gitlab-issue-synchronizer/notify',
    requestProcessor(async ctx => {
      let {
        name,
        config: configId,
        'tag-name': tagName,
        clock,
        resource,
        inputs,
      } = ctx.request.body;

      if (name !== 'gitlab-issue-synchronizer') {
        throw new ExpectedError(
          'PARAMETER_ERROR',
          'GitLab issue synchronizer only accept parameters with name "gitlab-issue-synchronizer".',
        );
      }

      if (resource.type !== 'task') {
        throw new ExpectedError(
          'PARAMETER_ERROR',
          'GitLab issue synchronizer only handle resource with type "task"',
        );
      }

      checkRequiredFields(
        inputs,
        ['gitlab-url', 'gitlab-token', 'gitlab-project-name', 'task-brief'],
        'GitLab issue synchronizer inputs',
      );

      await issueService.synchronizeIssue({
        clock,
        task: resource.id,
        config: configId,
        options: {
          type: 'gitlab',
          url: inputs['gitlab-url'],
          token: inputs['gitlab-token'],
          projectName: inputs['gitlab-project-name'],
        },
        tagName,
        syncTags: inputs['sync-tags'],
        syncStageTags: inputs['sync-stage-tags'],
        taskBrief: inputs['task-brief'],
        taskStage: inputs['task-stage'],
        taskNonDoneActiveNodes: inputs['task-non-done-active-nodes'],
        taskDescription: inputs['task-description'],
        taskTags: inputs['task-tags'],
        metadata: inputs['task-metadata'],
      });
    }),
  );
}
