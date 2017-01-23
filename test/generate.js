'use strict';

import test from 'ava';
import {generate} from '..';

var _ = require('lodash');

test('generate some systems without dying', t => {
  t.plan(50);

  _.times(50, function () {
    var output = generate();

    t.truthy(output.length > 0);
  });
});
