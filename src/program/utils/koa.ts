import {Middleware, ParameterizedContext} from 'koa';

import {APIResponse, APIResponseError, ExpectedError} from '../core';

export type APIHandler = (
  ctx: ParameterizedContext,
) => Promise<APIResponse | void>;

export function respond(handler: APIHandler): Middleware {
  return async (ctx, next): Promise<any> => {
    ctx.status = 200;

    let result: APIResponse = {};

    try {
      let handledResult = await handler(ctx);

      if (handledResult) {
        result = handledResult;
      }
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
