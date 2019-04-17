import Router from 'koa-router';

import {ExpectedError} from '../core';
import {IssueService} from '../services';
import {response} from '../utils';

export function routeGitHubIssueSynchronizer(
  issueService: IssueService,
  apiRouter: Router,
): void {
  apiRouter.post(
    '/github-issue-synchronizer/notify',
    response(async ctx => {
      let {name, config: configId, clock, resource, inputs} = ctx.request.body;

      if (name !== 'github-issue-synchronizer' || resource.type !== 'task') {
        throw new ExpectedError('Input is not match expected.');
      }

      await issueService.synchronizeIssue({
        clock,
        task: resource.id,
        config: configId,
        providerOptions: {
          type: 'github',
          githubAPIURL: inputs['github-api-url'],
          githubToken: inputs['github-token'],
          githubProjectName: inputs['github-project-name'],
        },
        taskBrief: inputs['task-brief'],
        taskStage: inputs['task-stage'],
        taskNonDoneActiveNodes: inputs['task-non-done-active-nodes'],
        taskDescription: inputs['task-description'],
        taskTags: inputs['task-tags'],
      });
    }),
  );
}
