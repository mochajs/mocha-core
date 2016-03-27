import is from 'check-more-types';

export default function resolver (pattern) {
  if (is.function(pattern)) {
    return pattern;
  }
}
