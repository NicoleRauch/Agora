'use strict';

var _ = require('lodash');
var express = require('express');
var path = require('path');
var conf = require('nconf');
var moment = require('moment-timezone');
var mimetypes = require('mime-types');

var imageExtensions = _(mimetypes.extensions)
  .filter(function (value, key) { return key.match(/^image/); })
  .flatten().value();

function regexEscape(string) {
  return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function asWholeWordEscaped(string) {
  return '^' + regexEscape(string) + '$';
}

module.exports = {
  toObject: function (Constructor, callback, err, jsobject) {
    if (err) {return callback(err); }
    if (jsobject) { return callback(null, new Constructor(jsobject)); }
    callback(null, null);
  },

  toObjectList: function (Constructor, callback, err, jsobjects) {
    if (err) { return callback(err); }
    callback(null, _.map(jsobjects, function (each) { return new Constructor(each); }));
  },

  toArray: function (elem) {
    if (!elem) { return []; }
    if (elem instanceof Array) { return elem; }
    if (typeof elem === 'string') { return elem.split(','); }
    return [elem];
  },

  toLowerCaseRegExp: function (string) {
    return new RegExp(asWholeWordEscaped(string), 'i');
  },

  arrayToLowerCaseRegExp: function (stringsArray) {
    return new RegExp(_(stringsArray).compact().map(asWholeWordEscaped).join('|'), 'i');
  },

  differenceCaseInsensitive: function (strings, stringsToReduce) {
    function prepare(strings) {
      return _(strings).compact().invoke('toLowerCase').value();
    }

    return _.difference(prepare(strings), prepare(stringsToReduce));
  },

  toFullQualifiedUrl: function (prefix, localUrl) {
    function trimLeadingAndTrailingSlash(string) {
      return string.replace(/(^\/)|(\/$)/g, '');
    }

    return conf.get('publicUrlPrefix') + '/' + trimLeadingAndTrailingSlash(prefix) + '/' + trimLeadingAndTrailingSlash(localUrl);
  },

  expressAppIn: function (directory) {
    var app = express();
    app.set('views', path.join(directory, 'views'));
    app.set('view engine', 'jade');
    return app;
  },

  validate: function (currentValue, previousValue, validator, callback) {
    if (currentValue) { currentValue = currentValue.trim(); }
    if (previousValue) { previousValue = previousValue.trim(); }

    if (previousValue === currentValue) {
      return callback('true');
    }
    validator(currentValue, function (err, result) {
      if (err) { return callback('false'); }
      callback(result.toString());
    });
  },

  representsImage: function (filenameOrExtension) {
    var extension = filenameOrExtension.indexOf('.') < 1 ? filenameOrExtension : path.extname(filenameOrExtension);
    return imageExtensions.indexOf(extension.replace(/\./, '')) > -1;
  },

  regexEscape: regexEscape
};

