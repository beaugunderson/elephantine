'use strict';

var path = require('path');
var pegjs = require('pegjs-import');

var parser = pegjs.buildParser(
  path.resolve(__dirname, '../parsers/rule-body.pegjs'));

module.exports = function (string) {
  return parser.parse(string);
};
