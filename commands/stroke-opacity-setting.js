'use strict';

var color = require('onecolor');
var strokeOpacity = require('./stroke-opacity.js');

exports.arguments = strokeOpacity.arguments;
exports.symbols = strokeOpacity.symbols;
exports.tags = ['setting'];

exports.draw = function drawStrokeOpacitySetting(state, ctx, opacity) {
  state.strokeOpacity = opacity || 1;

  console.log('meow', opacity);

  ctx.strokeStyle = color(state.strokeColor)
    .alpha(state.strokeOpacity)
    .cssa();
};
