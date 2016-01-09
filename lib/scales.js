'use strict';

var scale = require('d3-scale');
var _ = require('lodash');

var SCALES = exports.SCALES = [
  'scaleCool',
  'scaleCubehelix',
  'scaleInferno',
  'scaleMagma',
  'scalePlasma',
  'scaleRainbow',
  'scaleViridis',
  'scaleWarm'
];

exports.randomScale = function (start, end, index) {
  return scale[SCALES[index - 1] || _.sample(SCALES)]()
    .domain([start, (end - start / 2), end]);
};
