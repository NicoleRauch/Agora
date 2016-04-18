'use strict';

var _ = require('lodash');
var R = require('ramda');
var async = require('async');

var conf = require('simple-configure');
var beans = conf.get('beans');
var memberstore = beans.get('memberstore');
var activityParticipantService = beans.get('activityParticipantService');
var roomOptions = beans.get('roomOptions');
var managementService = beans.get('managementService');
var currentUrl = beans.get('socratesConstants').currentUrl;
var currentYear = beans.get('socratesConstants').currentYear;

var eventstoreService = beans.get('eventstoreService');

module.exports = {

  participants: function (callback) {
    eventstoreService.getRegistrationReadModel(currentUrl, function (err00, registrationReadModel) {
      if (err00 || !registrationReadModel) { return callback(err00); }
      eventstoreService.getSoCraTesReadModel(currentUrl, function (err000, socratesReadModel) {
        if (err000 || !socratesReadModel) { return callback(err000); }

        activityParticipantService.getParticipantsFor(currentYear, function (err_, participants) {
          if (err_) { return callback(err_); }
          managementService.addonLinesOf(participants, function (err1, addonLines) {
            if (err1) { return callback(err1); }

            var enhancedLines = R.map(line => {
              return {
                nickname: line.member.nickname(),
                firstname: line.member.firstname(),
                lastname: line.member.lastname(),
                email: line.member.email(),
                location: line.member.location(),

                tShirtSize: line.addon.tShirtSize(),
                homeAddress: line.addon.homeAddressLines(),
                billingAddress: line.addon.billingAddressLines(),

                desiredRoommate: line.participation.roommate(),

                registered: registrationReadModel.joinedSoCraTesAt(line.member.id()),
                duration: registrationReadModel.durationFor(line.member.id()),
                roomType: registrationReadModel.registeredInRoomType(line.member.id())
              };
            }, addonLines);
            const groupedLines = R.groupBy(l => l.roomType, enhancedLines);

            const participantsByResources = R.map(roomType => {
                return {
                  limit: socratesReadModel.quotaFor(roomType),
                  participants: groupedLines[roomType]
                };
              },
              roomOptions.allIds());

            callback(null, participantsByResources);
          });
        });
      });
    });

  },

  waiting: function (callback) {
    eventstoreService.getRegistrationReadModel(currentUrl, function (err00, registrationReadModel) {
      if (err00 || !registrationReadModel) { return callback(err00); }

      var waitinglistMembers = [];

      function membersOnWaitinglist(roomType, globalCallback) {
        async.map(registrationReadModel.allWaitinglistParticipantsIn(roomType),
          function (entry, callback) {
            memberstore.getMemberForId(entry.memberId, function (err2, member) {
              if (err2 || !member) { return callback(err2); }
              member.addedToWaitinglistAt = entry.joinedWaitinglist;
              callback(null, member);
            });
          },
          function (err2, results) {
            if (err2) { return callback(err2); }
            waitinglistMembers.push(_.compact(results));
            globalCallback();
          });
      }

      async.each(roomOptions.allIds(),
        membersOnWaitinglist,
        function (err2) {
          if (err2) { return callback(err2); }

          managementService.addonLinesOf(_.flatten(waitinglistMembers), function (err1, waitinglistLines) {
            if (err1) { return callback(err1); }

            var result = _(waitinglistLines).map(function (line) {
              return {
                firstname: line.member.firstname(),
                lastname: line.member.lastname(),
                email: line.member.email(),
                tShirtSize: line.addon.tShirtSize(),
                desiredRoommate: line.participation.roommate(),
                homeAddress: line.addon.homeAddressLines(),
                billingAddress: line.addon.billingAddressLines(),
                resourceNames: registrationReadModel.roomTypesOf(line.member.id())
              };
            });

            callback(null, result);
          });
        });
    });
  },

  durations: function (callback) {
    eventstoreService.getRegistrationReadModel(currentUrl, function (err, registrationReadModel) {
      if (err || !registrationReadModel) { return callback(err); }

      callback(null, managementService.durations(registrationReadModel));
    });
  }
};
