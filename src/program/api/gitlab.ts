import Router from 'koa-router';

import {ExpectedError} from '../core';
import {IssueService} from '../services';

export function routeGitLabIssueSynchronizer(
  issueService: IssueService,
  apiRouter: Router,
): void {
  apiRouter.post('/gitlab-issue-synchronizer/notify', async ctx => {
    let {name, config: configId, clock, resource, inputs} = ctx.request.body;

    if (name !== 'gitlab-issue-synchronizer' || resource.type !== 'task') {
      throw new ExpectedError('Input is not match expected.');
    }

    ctx.body = await issueService.synchronizeIssue({
      clock,
      task: resource.id,
      config: configId,
      providerOptions: {
        type: 'gitlab',
        gitlabURL: inputs['gitlab-url'],
        gitlabToken: inputs['gitlab-token'],
        gitlabProjectName: inputs['gitlab-project-name'],
      },
      taskBrief: inputs['task-brief'],
      taskStage: inputs['task-stage'],
      taskNonDoneActiveNodes: inputs['task-non-done-active-nodes'],
      taskDescription: inputs['task-description'],
      taskTags: inputs['task-tags'],
    });
  });
}
