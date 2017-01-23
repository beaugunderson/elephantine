'use strict';

import expand from '../lib/expand-curve.js';
import test from 'ava';
import {parse} from '../parsers/l-system.js';

var _ = require('lodash');

test('parse and expand rules with probability lists', t => {
  t.plan(2);

  var definition = 'a; a=Ƥ(b:50,c:50); b=a→5; c=a→10;'
  var curve = expand(definition, 1024);

  t.truthy(curve.initial !== undefined);
  t.truthy(curve.expanded.length > definition.length);
});
