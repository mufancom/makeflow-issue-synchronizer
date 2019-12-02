import {URL} from 'url';

import {Dict} from 'tslang';

import {APIService} from './api-service';

interface MFAPISuccessResult {
  data: any;
}

interface MFAPIErrorResult {
  error: {
    code: string;
    message: string;
  };
}

type MFAPIResult = MFAPISuccessResult | MFAPIErrorResult;

export interface MakeflowServiceRequestOptions {
  token: string;
  baseURL: string;
  body?: string | object;
  headers?: Dict<unknown>;
}

export class MakeflowService {
  constructor(private apiService: APIService) {}

  async addTaskOutputs(
    taskId: string,
    outputs: Dict<unknown>,
    {baseURL, token}: {baseURL: string; token: string},
  ): Promise<void> {
    await this.requestMakeflowAPI('/task/add-outputs', {
      token,
      baseURL,
      body: {
        task: taskId,
        outputs,
      },
    });
  }

  private async requestMakeflowAPI<TData>(
    path: string,
    {token, baseURL, body, headers}: MakeflowServiceRequestOptions,
  ): Promise<TData> {
    let makeflowAddressURL = new URL(baseURL);

    let response = await this.apiService.post(
      `${makeflowAddressURL.origin}/api/v1${path}`,
      body,
      {
        headers: {
          ...headers,
          'x-access-token': token,
        },
      },
    );

    let result = (await response.json()) as MFAPIResult;

    if ('error' in result) {
      let error = result.error;

      if (error.code === 'PERMISSION_DENIED') {
        // TODO: handle permission denied
      }

      throw new Error(`[${error.code}] ${error.message}`);
    } else {
      return result.data as TData;
    }
  }
}
