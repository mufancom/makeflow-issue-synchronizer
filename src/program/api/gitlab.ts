import Router from 'koa-router';
import {draftToMarkdown} from 'markdown-draft-js';

import {GitLabService} from '../services';

export function routeGitLabIssueSynchronizer(
  gitLabService: GitLabService,
  apiRouter: Router,
): void {
  apiRouter.post('/gitlab-issue-synchronizer/notify', async ctx => {
    let {name, installation, clock, resource, inputs} = ctx.request.body;

    if (name !== 'gitlab-issue-synchronizer' || resource.type !== 'task') {
      return;
    }

    let descriptionObject = inputs['task-description'];
    let descriptionContent = descriptionObject && descriptionObject.content;

    await gitLabService.synchronizeIssue({
      installation,
      clock,
      taskId: resource.id,
      gitlabAPIUrl: inputs['gitlab-api-url'],
      gitlabToken: inputs['gitlab-token'],
      gitlabProjectName: inputs['gitlab-project-name'],
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
