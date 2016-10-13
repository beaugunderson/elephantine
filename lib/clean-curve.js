'use strict';

var consoleFormat = require('emoji-aware').consoleFormat;
var debug = require('debug')('elephantine:clean');
var parse = require('../parsers/l-system.js').parse;
var ruleSplit = require('../parsers/l-system.js').parseRuleBody;
var _ = require('lodash');

function commandString(command) {
  return command.command + command.args.join('');
}

function unusedSymbols(curveString, ruleSymbols) {
  var curve = parse(curveString);
  var unused = {};

  ruleSymbols.forEach(function (symbol) {
    unused[symbol] = true;
  });

  var initial = ruleSplit(curve.initial.map(commandString).join(''));

  initial.forEach(function (symbol) {
    if (_.includes(ruleSymbols, symbol)) {
      unused[symbol] = false;
    }
  });

  var stack = [];

  _.each(unused, function (value, key) {
    if (!value) {
      stack.push(key);
    }
  });

  var current;
  var rule;

  while ((current = stack.pop())) {
    if (!curve.rules[current]) {
      unused[current] = true;

      continue;
    }

    rule = ruleSplit(curve.rules[current].map(commandString).join(''));

    rule.forEach(function (symbol) {
      if (_.includes(ruleSymbols, symbol) && unused[symbol]) {
        unused[symbol] = false;

        stack.push(symbol);
      }
    });
  }

  return unused;
}

function clean(curveString, ruleSymbols) {
  var curve = parse(curveString);
  var toRemove = unusedSymbols(curveString, ruleSymbols);

  _.each(curve.rules, function (r, symbol) {
    // don't process settings
    if (!_.includes(ruleSymbols, symbol)) {
      return;
    }

    var rule = ruleSplit(r.map(commandString).join(''));

    if (!toRemove[symbol] && rule.length === 1) {
      // the rule is a no-op
      if (rule[0] === symbol) {
        toRemove[symbol] = true;
      // the rule just references another rule, dereference it
      } else if (_.includes(ruleSymbols, rule[0])) {
        toRemove[symbol] = rule[0];
      }
    }
  });

  debug('toRemove: %j', toRemove);

  function resolve(s) {
    // remove
    if (toRemove[s] === true) {
      return null;
    }

    // dereference
    return toRemove[s] || s;
  }

  var initialString = curve.initial.map(commandString).join('');

  initialString = _(ruleSplit(initialString))
    .map(resolve)
    .compact()
    .value()
    .join('');

  var rulesString = _(curve.rules)
    .map(function (r, symbol) {
      var ruleString;

      // don't resolve settings
      if (!_.includes(ruleSymbols, symbol)) {
        return symbol + '=' + r.join('');
      }

      // if the symbol is a no-op remove the rule entirely
      if (toRemove[symbol]) {
        return null;
      }

      ruleString = r.map(commandString).join('');

      var removed = _(ruleSplit(ruleString))
        .map(resolve)
        .compact()
        .value();

      if (!removed.length) {
        return null;
      }

      return symbol + '=' + removed.join('');
    })
    .compact()
    .value()
    .join('; ');

  var oldString;

  // remove commands that cancel each other out
  while (oldString !== rulesString) {
    oldString = rulesString;

    // TODO; don't remove if the second rotation has a parameter?
    rulesString = rulesString
      .replace(/↩️↪️/g, '')
      .replace(/↪️↩️/g, '')
      .replace(/\[\]/g, '');
  }

  // TODO: remove two subsequent settings?

  return [
    initialString,
    rulesString
  ].join('; ');
}

module.exports = function (curveString, ruleSymbols) {
  var oldCurve;
  var newCurve = curveString;

  debug('-clean: %s', consoleFormat(newCurve));

  while (oldCurve !== newCurve) {
    oldCurve = newCurve;
    newCurve = clean(newCurve, ruleSymbols);

    debug('+clean: %s', consoleFormat(newCurve));
  }

  return newCurve;
};
