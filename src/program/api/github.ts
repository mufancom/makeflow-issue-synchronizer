import Router from 'koa-router';
import {draftToMarkdown} from 'markdown-draft-js';

import {GitHubService} from '../services';

export function routeGitHubIssueSynchronizer(
  gitHubService: GitHubService,
  apiRouter: Router,
): void {
  apiRouter.post('/github-issue-synchronizer/notify', async ctx => {
    let {name, installation, clock, resource, inputs} = ctx.request.body;

    if (name !== 'github-issue-synchronizer' || resource.type !== 'task') {
      return;
    }

    let descriptionObject = inputs['task-description'];
    let descriptionContent = descriptionObject && descriptionObject.content;

    await gitHubService.synchronizeIssue({
      installation,
      clock,
      taskId: resource.id,
      githubAPIUrl: inputs['github-api-url'],
      githubToken: inputs['github-token'],
      githubProjectName: inputs['github-project-name'],
      taskBrief: inputs['task-brief'],
      taskStage: inputs['task-stage'],
      taskNodes: inputs['task-nodes'],
      taskActiveNodes: inputs['task-active-nodes'],
      taskDescription: descriptionContent
        ? draftToMarkdown(descriptionContent)
        : '',
    });

    ctx.body = {};
  });
}
