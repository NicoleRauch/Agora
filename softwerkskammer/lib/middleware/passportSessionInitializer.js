'use strict';
module.exports = function (req, res, next) {
  var passport = req._passport.instance;

  if (req.session && req.session[passport._key]) {
    // load data from existing session
    req._passport.session = req.session[passport._key];
  } else if (req.session) {
    // initialize new session
    req.session[passport._key] = {};
    req._passport.session = req.session[passport._key];
  } else {
    // no session is available
    req._passport.session = {};
  }

  next();
};
