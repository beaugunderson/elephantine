'use strict';

var scale = require('d3-scale');
var _ = require('lodash');

var INTERPOLATORS = exports.INTERPOLATORS = [
  'interpolateCool',
  'interpolateCubehelixDefault',
  'interpolateInferno',
  'interpolateMagma',
  'interpolatePlasma',
  'interpolateRainbow',
  'interpolateViridis',
  'interpolateWarm'
];

exports.randomScale = function (start, end, index) {
  var interpolator = scale[INTERPOLATORS[index - 1] ||
                           _.sample(INTERPOLATORS)];

  return scale.scaleSequential(interpolator)
    .domain([start, (end - start / 2), end]);
};
