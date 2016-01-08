'use strict';

var path = require('path');
var pegjs = require('pegjs-import');

var parser = pegjs.buildParser(path.resolve(__dirname, '../parsers/emoji.pegjs'));

module.exports = function (string) {
  try {
    parser.parse(string);
  } catch (e) {
    return false;
  }

  return true;
};
