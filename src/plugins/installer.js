'use strict';

import _ from 'highland';

function installer (stream) {
  console.log(stream._alreadyConsumed);

  const installStream = _()
    .map(plugin => plugin.install());

  stream.tap(value => console.log(value.name))
    .flatMap(plugin => plugin.dependencies)
    .otherwise(stream.fork().pipe(installStream))
    .toArray(stuff => console.log(stuff));

  return installStream;
}

export default installer;
