import _ from 'lodash';

import {ExpectedError} from '../core';

export function checkRequiredConfigs<T extends object>(
  object: T,
  fields: (keyof T)[],
  label: string,
): void {
  for (let field of fields) {
    if (_.get(object, field) === undefined) {
      throw new ExpectedError(
        'MISSING_REQUIRED_FIELD',
        `Missing required field "${field}" for ${label}`,
      );
    }
  }
}
