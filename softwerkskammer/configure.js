'use strict';

process.chdir(__dirname);
var _ = require('lodash');
var Beans = require('CoolBeans');
var conf = require('simple-configure');
var path = require('path');

function createConfiguration() {
  var configdir = path.normalize(__dirname + '/../config/');

  // first, set the default values
  conf.addProperties({
    adminListName: 'admins',
    port: '17124',
    mongoURL: 'mongodb://localhost:27017/swk',
    publicUrlPrefix: 'http://localhost:17124',
    securedByLoginURLPattern: '/activityresults|' +
      '/gallery|' +
      '/mailsender|' +
      '/members|' +
      '/new|' +
      '/edit|' +
      '/submit|' +
      '(subscribe|unsubscribe)/|' +
      '/mailarchive|' +
      '/invitation|' +
      '/addToWaitinglist|' +
      '/removeFromWaitinglist|' +
      '/addon|' +
      '/submitAddon|' +
      '/wiki/socrates.*/|' +
      '/payment|' +
      'dashboard',
    secret: 'secret',
    sessionkey: 'softwerkskammer.org',
    beans: new Beans(configdir + 'beans.json'),
    emaildomainname: 'localhost',
    softwerkskammerURL: 'http://localhost:17124',
    socratesURL: 'http://localhost:17224',
    jwt_secret: 'my_very_secret'
  });

  // then, add properties from config files:
  var files = ['mongo-config.json',
    'sympa-config.json',
    'server-config.json',
    'authentication-config.json',
    'mailsender-config.json',
    'wikirepo-config.json',
    'activityresults-config.json',
    'crosssite-config.json'];
  conf.addFiles(_.map(files, function (file) { return configdir + file; }));

  return conf;
}
module.exports = createConfiguration();

