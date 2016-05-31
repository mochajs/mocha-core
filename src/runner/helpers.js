import {get} from 'lodash/fp';

export function dereference ({executable}) {
  return executable;
}

export const isExcluded = get('opts.exclude');
export const isInclusive = get('opts.include');

