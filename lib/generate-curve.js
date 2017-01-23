'use strict';

var clean = require('./clean-curve.js');
var consoleFormat = require('emoji-aware').consoleFormat;
var debug = require('debug')('elephantine:generate');
var ruleSplit = require('../parsers/l-system.js').parseRuleBody;
var split = require('emoji-aware').split;
var system = require('./system.js');
var _ = require('lodash');

function getArgument(type, symbol, required) {
  if (!type[symbol].arguments || (Math.random() < 0.05 && !required)) {
    return '';
  }

  return type[symbol].arguments.map(function (arg) {
    if (arg === 'style') {
      return "'red'";
    } else if (arg === 'angle') {
      return Math.round((180 / _.random(2, 16)) * 100) / 100;
    } else if (arg === 'number') {
      return _.random(1, 10);
    } else if (/^[0-9]/.test(arg)) {
      arg = arg.split('-');

      var randomFloat = false;

      if (/\./.test(arg)) {
        randomFloat = true;
      }

      return Math.round(_.random(parseFloat(arg[0], 10),
                                 parseFloat(arg[1], 10),
                                 randomFloat) * 100) / 100;
    }

    return '';
  }).join(',');
}

function chooseSymbols() {
  var chosenSymbols = [];

  ['drawing', 'movement', 'heading', 'appearance'].forEach(function (tag) {
    chosenSymbols = chosenSymbols.concat(
      _.sample(system.symbolsByTag[tag],
               _.random(1, system.symbolsByTag[tag].length)));
  });

  // debug('chosen symbols:', consoleFormat(chosenSymbols.join('')));

  chosenSymbols = _.flatten(chosenSymbols.map(function (symbol) {
    // use multiple sets of arguments
    return _.times(_.random(1, 5), function () {
      return symbol + getArgument(system.commands, symbol);
    });
  }));

  return chosenSymbols;
}

function chooseSettings(number) {
  var chosenSettings = [];

  ['setting'].forEach(function (tag) {
    chosenSettings = chosenSettings.concat(
      _.sample(system.symbolsByTag[tag],
               _.random(1, system.symbolsByTag[tag].length)));
  });

  chosenSettings = _(chosenSettings)
    .shuffle()
    .take(number)
    .value();

  chosenSettings = chosenSettings.map(function (symbol) {
    return symbol + '=' + getArgument(system.settings, symbol, true);
  });

  chosenSettings = chosenSettings.join('; ');

  return chosenSettings;
}

function toString(start, rules, chosenSettings) {
  var rulesString = _.map(rules, function (r, symbol) {
    return symbol + '=' + r;
  }).join('; ');

  return [
    start,
    rulesString,
    chosenSettings
  ].join('; ');
}

function generate() {
  var decisions = {
    desiredLength: _.random(30, 100),
    initialCanContainDrawingSymbols: _.random(1, 100) >= 75,
    controlWeight: _.random(0.3, 0.7),
    ruleCount: _.random(1, 7)
  };

  decisions.numberOfSettings = Math.floor(decisions.desiredLength / 14);
  decisions.initialLength = Math.floor(decisions.desiredLength / 14) +
    _.random(0, 3),
  decisions.ruleCount = Math.floor(decisions.desiredLength / 25) +
    _.random(0, 2);

  debug('decisions: %j', decisions);

  var index = 0;
  var remainingCharacters;
  var rule;
  var rules = {};
  var start = '';
  var symbols = 'abcdefghijklmnopqrstuvwxyz'.split('');

  function construct() {
    return toString(start, rules, chosenSettings);
  }

  function updateRemaining() {
    remainingCharacters = decisions.desiredLength - split(construct()).length;
  }

  // remove control symbols from potential symbols
  symbols = _.difference(symbols, system.controlSymbols);

  var chosenSymbols = chooseSymbols();
  var chosenSettings = chooseSettings(decisions.numberOfSettings);
  // select some symbols to use as nodes in alphabetical order
  var ruleSymbols = _.take(symbols, decisions.ruleCount);

  debug('chosen symbols: %s', consoleFormat(chosenSymbols.join('')));
  debug('chosen settings: %s', consoleFormat(chosenSettings));
  debug('rule symbols: %s', ruleSymbols.join(' '));

  function randomSymbol() {
    return Math.random() > decisions.controlWeight ?
      _.sample(ruleSymbols) :
      _.sample(chosenSymbols);
  }

  // generate random start symbol (small)
  if (decisions.initialCanContainDrawingSymbols) {
    start += _.times(decisions.initialLength, randomSymbol).join('');
  } else {
    start += _.sample(ruleSymbols, decisions.initialLength).join('');
  }

  debug('start: %s', start);

  updateRemaining();

  debug('remaining characters: %d', remainingCharacters);

  var averageLength = Math.floor(
    (remainingCharacters - (ruleSymbols.length * 2) - 1) / ruleSymbols.length);

  debug('average length: %d', averageLength);

  // generate a rule for each symbol
  for (var i = 0; i < ruleSymbols.length && remainingCharacters > 0; i++) {
    rule = '';

    var lessThanAverage = _.random(2, averageLength);

    // insert random node or control symbols
    while (split(rule).length < lessThanAverage) {
      rule += randomSymbol();
    }

    var ruleArray = ruleSplit(rule);

    if (split(rule).length + 2 <= averageLength) {
      var bracketPairsToAdd = _.random(Math.floor(ruleArray.length / 6));

      // insert push/pop symbols, which need to be matched
      if (ruleArray.length > 1 && bracketPairsToAdd > 0) {
        debug('%s rule: %s', ruleSymbols[i], consoleFormat(rule));

        _.times(bracketPairsToAdd, function () {
          index = _.random(ruleArray.length - 1);

          ruleArray = ruleArray.slice(0, index).concat('[',
            ruleArray.slice(index));

          index += _.random(2, ruleArray.length - index - 2);

          ruleArray = ruleArray.slice(0, index).concat(']',
            ruleArray.slice(index));
        });
      }
    }

    if (ruleArray.length) {
      rule = ruleArray.join('');
      rules[ruleSymbols[i]] = rule;

      updateRemaining();

      debug('%s rule: %s', ruleSymbols[i], consoleFormat(rule));
    }
  }

  if (remainingCharacters < 0) {
    debug('remaining characters: %d', remainingCharacters);

    debug('removing rules...');

    var rulesToRemove = ruleSymbols.slice();

    while (remainingCharacters < 0) {
      var ruleToRemove = rulesToRemove.pop();

      delete rules[ruleToRemove];

      updateRemaining();

      debug('removed %s, new remaining %d', ruleToRemove, remainingCharacters);
    }
  }

  return clean(toString(start, rules, chosenSettings), ruleSymbols);
}

module.exports = function () {
  var curve;

  while (!curve) {
    try {
      curve = generate();

      break;
    } catch (e) {
      // pass
    }
  }

  return curve;
};
