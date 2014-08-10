'use strict';

module.exports = function (appLogger) {
  return function (error, req, res, next) { // express needs four arguments!
    var status = error.status || 500;
    res.status(status);
    appLogger.error(error.stack);
    if (/InternalOpenIDError|BadRequestError|InternalOAuthError/.test(error.name)) {
      return res.render('errorPages/authenticationError.jade', {error: error, status: status});
    }
    res.render('errorPages/500.jade', {error: error, status: status});
  };
};
