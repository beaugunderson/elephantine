'use strict';

import test from 'ava';

var generate = require('../lib/generate-curve.js');
var _ = require('lodash');

test('generate some systems without dying', t => {
  t.plan(50);

  _.times(50, function () {
    var output = generate();

    t.ok(output.length > 0);
  });
});
