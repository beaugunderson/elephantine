'use strict';

var chance = require('chance').Chance();
var debug = require('debug')('elephantine:expand');
var parse = require('../parsers/l-system.js').parse;
var _ = require('lodash');

var MAX_ITERATIONS = 1000;

function expandCurve(initial, rules, maxLength, maxIterations) {
  var curve = initial;
  var iterations = 0;
  var last;

  maxIterations = maxIterations || MAX_ITERATIONS;

  function expand(c) {
    if (c.probabilities) {
      var choices = _.map(c.probabilities, (p) => p[0]);
      var chances = _.map(c.probabilities, (p) => p[1]);

      var choice = chance.weighted(choices, chances);

      return rules[choice] || choice;
    }

    return rules[c.command] || c;
  }

  while (curve.length <= maxLength && iterations++ < maxIterations) {
    last = curve;

    curve = _.flatten(curve.map(expand));

    if (last.length === curve.length &&
        _.isEqual(last, curve)) {
      debug('warning: curve is not growing');

      break;
    }
  }

  return last;
}

module.exports = function (curve, maxLength, maxIterations) {
  var parsed = parse(curve);

  parsed.expanded = expandCurve(parsed.initial, parsed.rules, maxLength, maxIterations);

  return parsed;
};
