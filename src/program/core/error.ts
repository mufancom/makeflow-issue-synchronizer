import ExtendableError from 'extendable-error';

import {HTTPStatusCode} from './http';

export class ExpectedError<
  TCode extends string = string,
  TMessage extends string = string
> extends ExtendableError {
  message!: TMessage;

  constructor(
    public code: TCode,
    message?: TMessage,
    public status = HTTPStatusCode.Ok,
  ) {
    super(message);
  }
}
