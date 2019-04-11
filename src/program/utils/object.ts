import _ from 'lodash';
import {Dict} from 'tslang';

export function convertToCamelObject(object: Dict<unknown>): Dict<unknown> {
  if (typeof object !== 'object') {
    return object;
  }

  return Object.entries(object)
    .map(
      ([key, value]): [string, unknown] => {
        return [_.camelCase(key), value];
      },
    )
    .reduce(
      (object, [key, value]) => {
        if (typeof value === 'object' && value) {
          if (Array.isArray(value)) {
            object[key] = value.map(item => convertToCamelObject(item));
          } else {
            object[key] = convertToCamelObject(value);
          }
        } else {
          object[key] = value;
        }

        return object;
      },
      {} as Dict<unknown>,
    );
}

export function recursivelyOmitUndefined<T extends object>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}
