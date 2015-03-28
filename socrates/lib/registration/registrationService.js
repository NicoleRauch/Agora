'use strict';

var async = require('async');
var _ = require('lodash');

var beans = require('simple-configure').get('beans');

var activitystore = beans.get('activitystore');
var SoCraTesResource = beans.get('socratesResource');
var groupsService = beans.get('groupsService');
var subscriberstore = beans.get('subscriberstore');
var notifications = beans.get('notifications');
var fieldHelpers = beans.get('fieldHelpers');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

module.exports = {

  startRegistration: function (registrationTuple, callback) {
    var self = this;
    activitystore.getActivity(registrationTuple.activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      if (activity.reserve(registrationTuple)) {
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.startRegistration(registrationTuple, callback);
          }
          if (err) { return callback(err); }
          return callback(err);
        });
      }
      return callback(null, 'activities.registration_not_now', 'activities.registration_not_possible');
    });
  },

  saveRegistration: function (memberID, sessionID, body, callback) {
    var self = this;
    var registrationTuple = {
      sessionID: sessionID,
      activityUrl: body.activityUrl,
      resourceName: body.resourceName,
      duration: body.duration
    };
    activitystore.getActivity(registrationTuple.activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      if (!activity.hasValidReservationFor(registrationTuple)) {
        return callback(null, 'message.title.problem', 'activities.registration_timed_out');
      }
      if (activity.isAlreadyRegistered(memberID)) {
        return callback(null, 'message.title.problem', 'activities.already_registered');
      }
      if (activity.register(memberID, registrationTuple)) {
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.startRegistration(registrationTuple, callback);
          }
          if (err) { return callback(err); }
          //notifications.visitorRegistration(activity, memberId, resourceName);
          return subscriberstore.getSubscriber(memberID, function (err, subscriber) {
            if (err) { return callback(err); }
            subscriber.addon().fillFromUI(body);
            subscriberstore.saveSubscriber(subscriber, callback);
          });
        });

      }
      callback(null, 'activities.registration_not_now', 'activities.registration_not_possible');
    });

  }

};
