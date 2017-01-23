'use strict';

var _ = require('lodash');

var system = {
  commands: {},
  controlSymbols: [],
  emojiSymbols: [],
  symbolsByTag: {},
  settings: {},
  tags: []
};

var commands = [
  require('../commands/angle-chaos.js'),
  require('../commands/angle.js'),
  require('../commands/circle-filled.js'),
  require('../commands/circle.js'),
  require('../commands/distance-chaos.js'),
  require('../commands/fill-opacity.js'),
  require('../commands/gradient-background.js'),
  require('../commands/line.js'),
  require('../commands/move.js'),
  require('../commands/random-scale-settings.js'),
  require('../commands/rotate-ccw.js'),
  require('../commands/rotate-cw.js'),
  require('../commands/rotate.js'),
  require('../commands/square-filled.js'),
  require('../commands/square.js'),
  require('../commands/stroke-opacity.js'),
  require('../commands/stroke-opacity-setting.js'),
  require('../commands/stroke-style-setting.js'),
  require('../commands/stroke-style.js')
];

commands.forEach(function (command) {
  var emojiSymbol = command.symbols[0];

  system.tags = _.uniq(system.tags.concat(command.tags));

  if (_.includes(command.tags, 'setting')) {
    command.symbols.forEach(function (symbol) {
      system.settings[symbol] = command;
    });
  } else {
    system.controlSymbols = system.controlSymbols.concat(command.symbols);
    system.emojiSymbols.push(emojiSymbol);

    command.symbols.forEach(function (symbol) {
      system.commands[symbol] = command;
    });
  }

  command.tags.forEach(function (tag) {
    system.symbolsByTag[tag] =
      (system.symbolsByTag[tag] || []).concat(emojiSymbol);
  });
});

module.exports = system;
