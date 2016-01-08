'use strict';

var path = require('path');
var pegjs = require('pegjs-import');

var parser = pegjs.buildParser(
  path.resolve(__dirname, '../parsers/curve.pegjs'));

module.exports = function (curve) {
  return parser.parse(curve.replace(/\s/g, ''));
};
