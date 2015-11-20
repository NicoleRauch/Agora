'use strict';

var _ = require('lodash');
var express = require('express');
var path = require('path');
var conf = require('simple-configure');
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
    function prepare(strs) {
      return _(strs).compact().invoke('toLowerCase').value();
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

  regexEscape: regexEscape,

  asyncAndTransform: function (asyncOp, transform, callback) {
    var args = _.tail(asyncOp).concat(
      function (err, result) {
        if (err) { return callback(err); }
        callback(null, transform(result));
      });

    asyncOp[0].apply(null, args);
  },

  ifErrorElse2: function (errorCallback, sources, func) {
    var ifErrorElse = function (errorCallback, func) {
      return function (err, result) {
        if (err) { return errorCallback(err); }
        func(result);
      }
    };

    var self = this;
    if (sources.length === 0) {
      return func();
    }

    sources[0](ifErrorElse(errorCallback, function (result) {
      self.ifErrorElse2(errorCallback, _.tail(sources), _.partial(func, result));
    }));
  },

  // TODO is this the same or is this really something different?
  isNull: function (element) { return element === null; },

  notExists: function (element) { return !element; }
};

