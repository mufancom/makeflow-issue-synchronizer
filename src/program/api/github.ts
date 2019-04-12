import Router from 'koa-router';
import {draftToMarkdown} from 'markdown-draft-js';

import {GitHubService} from '../services';

export function routeGitHubIssueSynchronizer(
  gitHubService: GitHubService,
  apiRouter: Router,
): void {
  apiRouter.post('/github-issue-synchronizer/notify', async ctx => {
    let body = ctx.request.body;

    if (body.name !== 'github-issue-synchronizer') {
      return;
    }

    let originalInputs = body.inputs;

    let descriptionObject = originalInputs['task-description'];
    let descriptionContent = descriptionObject && descriptionObject.content;

    await gitHubService.synchronizeIssue({
      githubAPIUrl: originalInputs['github-api-url'],
      githubToken: originalInputs['github-token'],
      githubProjectName: originalInputs['github-project-name'],
      taskId: originalInputs['task-id'],
      taskBrief: originalInputs['task-brief'],
      taskStage: originalInputs['task-stage'],
      taskNodes: originalInputs['task-nodes'],
      taskActiveNodes: originalInputs['task-active-nodes'],
      taskDescription: descriptionContent
        ? draftToMarkdown(descriptionContent)
        : '',
    });

    ctx.body = {};
  });
}
