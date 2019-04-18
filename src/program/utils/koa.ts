import {Middleware, ParameterizedContext} from 'koa';

import {APIResponse, APIResponseError, ExpectedError} from '../core';

export type APIHandler = (
  ctx: ParameterizedContext,
) => Promise<APIResponse | void>;

export function respond(handler: APIHandler): Middleware {
  return async (ctx, next): Promise<any> => {
    let result: APIResponse = {};

    try {
      result = (await handler(ctx)) || {};
    } catch (error) {
      let resultError: APIResponseError;

      if (error instanceof ExpectedError) {
        let {code, message} = error;

        resultError = {
          code,
          message,
        };
      } else {
        resultError = {
          code: 'UNKNOWN',
        };
      }

      ctx.body = {error: resultError};
    }

    ctx.body = result;

    await next();
  };
}
