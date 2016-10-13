'use strict';

var async = require('async');
var color = require('onecolor');
var debug = require('debug')('elephantine:render');
var expand = require('./expand-curve.js');
var random = require('random-seed');
var system = require('./system.js');
var _ = require('lodash');

function formatNumber(number) {
  return Math.round(number * 100) / 100;
}

var seed = _.random(true);

function write(string) {
  if (!process.stdout) {
    return;
  }

  process.stdout.write(string);
}

// function drawBounds(ctx, globals) {
//   ctx.strokeStyle = 'red';

//   ctx.beginPath();

//   ctx.moveTo(globals.minX, globals.minY + state.yOffset);
//   ctx.lineTo(globals.minX, globals.maxY + state.yOffset);
//   ctx.lineTo(globals.maxX, globals.maxY + state.yOffset);
//   ctx.lineTo(globals.maxX, globals.minY + state.yOffset);

//   ctx.closePath();

//   ctx.stroke();
// }

function render(curve, settings, maxLength, width, height, ctx, draw,
                xOffset, yOffset, scale, interactive, cb) {
  var stack = [];

  var state = {
    angle: 60,
    angleChaos: 0,

    distance: 10,
    distanceChaos: 0,

    heading: 90,

    fillColor: 'white',
    fillOpacity: 0.6,

    strokeColor: 'white',
    strokeOpacity: 1,

    width: width,
    height: height,

    x: 0,
    y: 0,

    xOffset: xOffset || 0,
    yOffset: yOffset || 0,

    // TODO: move these to globals
    random: random.create(seed),
    scale: scale || 1,
    seed: seed
  };

  // store every point drawn
  var points = {
    x: {},
    y: {},
    total: {}
  };

  var globals = {
    i: 0,

    curveLength: curve.expanded.length,

    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };

  var previousState;

  _.each(settings, function (args, symbol) {
    if (system.settings[symbol].apply) {
      system.settings[symbol].apply(state, args[0]);
    }
  });

  if (draw) {
    ctx.save();

    // clear the background
    ctx.fillStyle = 'rgb(100, 100, 100)';
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max((7.0 / 5000) * width, 1.0);

    _.each(settings, function (args, symbol) {
      if (system.settings[symbol].draw) {
        system.settings[symbol].draw(state, ctx, args[0]);
      }
    });

    // initial colour if specific colouring not used
    ctx.strokeStyle = color(state.strokeColor).alpha(state.strokeOpacity).cssa();
    ctx.fillStyle = color(state.fillColor).alpha(state.fillOpacity).cssa();

    // offset as required
    ctx.translate(state.xOffset, 0);
  }

  function updateBounds() {
    if (state.x < globals.minX) {
      globals.minX = state.x;
    } else if (state.x > globals.maxX) {
      globals.maxX = state.x;
    }

    if (state.y < globals.minY) {
      globals.minY = state.y;
    } else if (state.y > globals.maxY) {
      globals.maxY = state.y;
    }
  }

  // catch the initial position
  updateBounds();

  function handleCommand(command) {
    previousState = _.cloneDeep(state);

    if (command.setting) {
      if (system.settings[command.setting].apply) {
        system.settings[command.setting].apply(state, command.args[0]);
      }

      return;
    }

    var c = system.commands[command.command];

    if (c) {
      // TODO: apply command.args
      if (c.apply) {
        c.apply(state, previousState, globals, command.args[0]);

        // keep track of the number of distinct point coordinates
        points.x[state.x] = true;
        points.y[state.y] = true;

        points.total[`${state.x}x${state.y}`] = true;
      }

      updateBounds();

      if (draw && c.draw) {
        _.each(settings, function (args, symbol) {
          if (system.settings[symbol].beforeDraw) {
            system.settings[symbol].beforeDraw(state, previousState, globals, ctx, args[0]);

            // TODO: DRY this
            ctx.strokeStyle = color(state.strokeColor).alpha(state.strokeOpacity).cssa();
            ctx.fillStyle = color(state.fillColor).alpha(state.fillOpacity).cssa();
          }
        });

        // TODO: apply command.args
        c.draw(state, previousState, globals, ctx, command.args[0]);
      }
    } else {
      switch (command.command) {
      // TODO: have to store these elsewhere, maybe it's OK that they're here?
      case '[':
        stack.push(_.cloneDeep(state));
        break;

      case ']':
        state = stack.pop();
        break;

      default:
        break;
      }
    }

    if (globals.i % 10000 === 0) {
      write('+');
    } else if (globals.i % 1000 === 0) {
      write('.');
    }

    globals.i++;
  }

  function finish() {
    write('\n');

    if (draw) {
      ctx.restore();
    }

    globals.points = {
      x: Object.keys(points.x).length,
      y: Object.keys(points.y).length,
      total: Object.keys(points.total).length
    };
  }

  if (interactive) {
    var DURATION = 3 * 1000;
    var FRAME_LENGTH = 1000 / 60;
    var FRAMES = Math.round(DURATION / 60);

    var chunks = _.chunk(curve.expanded, curve.expanded.length / FRAMES);

    async.eachSeries(chunks, function (chunk, cbEach) {
      setTimeout(function () {
        _.each(chunk, handleCommand);

        cbEach();
      }, FRAME_LENGTH);
    }, function (err) {
      finish();

      cb(err, globals);
    });
  } else {
    _.each(curve.expanded, handleCommand);

    finish();

    return globals;
  }
}

module.exports = function (ctx, curve, width, height, maxLength, interactive, cb) {
  if (!maxLength) {
    maxLength = 100000;
  }

  try {
    var parsed = expand(curve, maxLength);
  } catch (e) {
    if (cb) {
      return cb(e);
    }

    throw e;
  }

  var settings = {};

  // initialize settings
  _.each(parsed.rules, function (rule, symbol) {
    if (_.includes(system.symbolsByTag.setting, symbol)) {
      settings[symbol] = rule;

      delete parsed.rules[symbol];
    }
  });

  debug('path length: %d', parsed.expanded.length);

  // first render, for scale
  var result = render(parsed, settings, maxLength, width, height, null, false);

  var renderWidth = result.maxX - result.minX;
  var renderHeight = result.maxY - result.minY;

  // add padding
  result.minX -= renderWidth * 0.05;
  result.minY -= renderHeight * 0.05;

  result.maxX += renderWidth * 0.05;
  result.maxY += renderHeight * 0.05;

  renderWidth = Math.round(result.maxX - result.minX);
  renderHeight = Math.round(result.maxY - result.minY);

  debug('bounds: %d, %d, %d, %d',
    formatNumber(result.minX),
    formatNumber(result.minY),
    formatNumber(result.maxX),
    formatNumber(result.maxY));

  var scale;

  debug('width, height: %dx%d', renderWidth, renderHeight);

  if (renderWidth / renderHeight > width / height) {
    scale = width / renderWidth;
  } else {
    scale = height / renderHeight;
  }

  debug('scale: %d', formatNumber(scale));

  result.minX *= scale;
  result.minY *= scale;
  result.maxX *= scale;
  result.maxY *= scale;

  renderWidth = Math.round(result.maxX - result.minX);
  renderHeight = Math.round(result.maxY - result.minY);

  debug('width, height: %dx%d', renderWidth, renderHeight);

  var CENTER_X = width / 2;
  var CENTER_Y = height / 2;

  var xOffset = Math.round(CENTER_X - ((renderWidth / 2) + result.minX));
  var yOffset = Math.round(CENTER_Y - ((renderHeight / 2) + result.minY));

  debug('x, y offset: %d, %d', xOffset, yOffset);

  if (interactive) {
    render(parsed, settings, maxLength, width, height, ctx, true,
      xOffset, yOffset, scale, interactive, function (err, drawResult) {
        drawResult = drawResult || {};

        drawResult.renderWidth = renderWidth;
        drawResult.renderHeight = renderHeight;

        cb(err, drawResult);
      });
  } else {
    result = render(parsed, settings, maxLength, width, height, ctx, true,
                    xOffset, yOffset, scale);

    result.renderWidth = renderWidth;
    result.renderHeight = renderHeight;

    return result;
  }
};
