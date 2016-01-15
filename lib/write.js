'use strict';

var Canvas = require('canvas-utilities').Canvas;
var canvasUtilities = require('canvas-utilities/lib/utilities.js');
var debug = require('debug')('elephantine:write');
var fs = require('fs');
var render = require('./render-curve.js');

module.exports = function (curve, width, height, filename, cb) {
  var canvas = new Canvas(width, height);
  var ctx = canvasUtilities.getContext(canvas);

  var result = render(ctx, curve, width, height);

  debug('saving...');

  canvas.toBuffer(function (err, buffer) {
    if (err) {
      return cb(err);
    }

    var stats = {
      width: result.renderWidth,
      height: result.renderHeight,
      points: result.points
    };

    if (filename) {
      return fs.writeFile(filename, buffer, function (writeErr) {
        cb(writeErr, stats);
      });
    }

    cb(err, buffer, stats);
  });
};
