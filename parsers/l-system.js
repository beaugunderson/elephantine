'use strict';

var emoji = require('emoji-aware/parsers/emoji.js');
var parsimmon = require('parsimmon');
var merge = require('lodash').merge;
var flattenDeep = require('lodash').flattenDeep;

function lexeme(parser) {
  return parser.skip(parsimmon.optWhitespace);
}

var NumberSymbol = exports.NumberSymbol = parsimmon.seq(
  parsimmon.regex(/-?([0-9]+\.)?[0-9]+/),
  emoji.OptionalVariationSelector.times(0),
  parsimmon.string('\u20E3').times(0)
).map(function (result) {
  return parseFloat(result[0], 10);
});

var TextSymbol = exports.TextSymbol = parsimmon.regex(/[a-z ]*/i);

var StringSymbol = exports.StringSymbol = parsimmon.alt(
  parsimmon.seq(
    parsimmon.string('"'),
    TextSymbol,
    parsimmon.string('"')
  ),
  parsimmon.seq(
    parsimmon.string("'"),
    TextSymbol,
    parsimmon.string("'")
  )
).map(function (result) {
  return result[1];
}).desc('a quote string');

var Argument = parsimmon.alt(
  NumberSymbol,
  StringSymbol
).desc('an argument');

// var Arguments = parsimmon.sepBy(
//   Argument,
//   parsimmon.string(',')
// );

var Arguments = parsimmon.seq(
  Argument,
  parsimmon.seq(
    parsimmon.string(','),
    Argument
  ).atLeast(0)
)
.atLeast(0)
.map(function (result) {
  return flattenDeep(result);
}).desc('one or more arguments');

var CommandSymbol = parsimmon.alt(
  parsimmon.regex(/[a-z!@%^&*_+()\[\]\{\}\<\>α-]/i),
  emoji.Emoji
).desc('a command symbol');

var Command = parsimmon.seq(
  CommandSymbol,
  Arguments
).map(function (result) {
  return {
    command: result[0],
    args: result[1]
  };
}).desc('a command');

var RuleInitial = Command.atLeast(1);

var Rule = parsimmon.seqMap(
  CommandSymbol,
  parsimmon.string('='),
  parsimmon.alt(
    Command.atLeast(1),
    Argument.atLeast(1)
  ),
  lexeme(parsimmon.string(';')).times(0, 1),

  function (commandSymbol, _, commandsOrArguments) {
    var rule = {};

    rule[commandSymbol] = commandsOrArguments;

    return rule;
  }
);

// used in `clean`
var RuleBody = exports.RuleBody = Command.atLeast(0).map(function (commands) {
  return commands.map(function (command) {
    return [command.command, command.args].join('');
  });
});

var Curve = exports.Curve = parsimmon.seqMap(
  RuleInitial,
  parsimmon.regex(/\s*;\s*/),
  Rule.atLeast(1),

  function (initial, _, rules) {
    var merged = {};

    rules.forEach(function (rule) {
      merged = merge(merged, rule);
    });

    return {
      initial: initial,
      rules: merged
    };
  }
);

exports.parseRuleBody = function (string) {
  var result = RuleBody.parse(string);

  if (result.status) {
    return result.value;
  }

  throw new Error('Error parsing string: ' + JSON.stringify(result, null, 2));
};

exports.parse = function (string) {
  var result = Curve.parse(string);

  if (result.status) {
    return result.value;
  }

  throw new Error('Error parsing string: ' + JSON.stringify(result, null, 2));
};
