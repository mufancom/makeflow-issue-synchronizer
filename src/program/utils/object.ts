import _ from 'lodash';

import {ExpectedError} from '../core';

export function checkRequiredFields(
  object: object,
  fields: string[],
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
