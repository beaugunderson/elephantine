'use strict';

import test from 'ava';

var clean = require('../lib/clean-curve.js');

test('clean a complicated system', t => {
  t.plan(1);

  var cleaned = clean('abcd; a=a; b=g→a→ciii; c=b; i=g; e=g→; g=→',
                      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);

  t.is(cleaned, 'bb; b=g→→bggg; g=→');
});

test('clean a simple system', t => {
  t.plan(1);

  var cleaned = clean('abcd; a=a; b=→a→c; c=b; e=→',
                      ['a', 'b', 'c', 'd', 'e']);

  t.is(cleaned, 'bb; b=→→b');
});
