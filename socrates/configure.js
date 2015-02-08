'use strict';

process.chdir(__dirname);
var _ = require('lodash');
var conf = require('simple-configure');
var Beans = require('CoolBeans');
var path = require('path');

function createConfiguration() {
  var configdir = path.normalize(__dirname + '/../config/');

  // first, set the default values
  // beans:
  var swkBeans = require(configdir + 'beans.json');
  var socratesBeans = require(configdir + 'beans-socrates.json');
  _.assign(swkBeans, socratesBeans);

  conf.addProperties({
    port: '17224',
    mongoURL: 'mongodb://localhost:27017/swk',
    publicUrlPrefix: 'http://localhost:17224',
    securedByLoginURLPattern: '/wiki|' +
      '/mailsender|' +
      '/members',

    secret: 'secret',
    sessionkey: 'socrates-conference.de',
    beans: new Beans(swkBeans),
    emaildomainname: 'localhost',
    softwerkskammerURL: 'http://localhost:17124',
    socratesURL: 'http://localhost:17224',
    jwt_secret: 'my_very_secret'
  });

  // then, add properties from config files:
  var files = ['mongo-config.json',
    'sympa-config.json',
    'socrates-server-config.json',
    'authentication-config.json',
    'mailsender-config.json',
    'socrates-wikirepo-config.json',
    'activityresults-config.json',
    'crosssite-config.json'];
  conf.addFiles(_.map(files, function (file) { return configdir + file; }));

  return conf;
}
module.exports = createConfiguration();

