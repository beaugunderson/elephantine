'use strict';

import test from 'ava';
import {clean} from '..';
import {INTERPOLATORS, randomScale} from '../lib/scales.js';

test('all interpolators should work', t => {
  t.plan(INTERPOLATORS.length * 2);

  for (let i = 0; i < INTERPOLATORS.length; i++) {
    var scale = randomScale(0, 100, i + 1);
    var result = scale(50);

    t.is(typeof scale, 'function');
    t.is(typeof result, 'string');
  }
});
