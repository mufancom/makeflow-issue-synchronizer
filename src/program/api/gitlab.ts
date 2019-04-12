import Router from 'koa-router';
import {draftToMarkdown} from 'markdown-draft-js';

import {GitLabService} from '../services';

export function routeGitLabIssueSynchronizer(
  gitLabService: GitLabService,
  apiRouter: Router,
): void {
  apiRouter.post('/gitlab-issue-synchronizer/notify', async ctx => {
    let body = ctx.request.body;

    if (body.name !== 'gitlab-issue-synchronizer') {
      return;
    }

    let originalInputs = body.inputs;

    let descriptionObject = originalInputs['task-description'];
    let descriptionContent = descriptionObject && descriptionObject.content;

    await gitLabService.synchronizeIssue({
      gitlabAPIUrl: originalInputs['gitlab-api-url'],
      gitlabToken: originalInputs['gitlab-token'],
      gitlabProjectName: originalInputs['gitlab-project-name'],
      taskId: originalInputs['task-id'],
      taskBrief: originalInputs['task-brief'],
      taskStage: originalInputs['task-stage'],
      taskActiveNodes: originalInputs['task-active-nodes'],
      taskDescription: descriptionContent
        ? draftToMarkdown(descriptionContent)
        : '',
    });

    ctx.body = {};
  });
}
