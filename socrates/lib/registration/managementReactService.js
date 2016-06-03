'use strict';

var R = require('ramda');

var conf = require('simple-configure');
var beans = conf.get('beans');
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
                duration: registrationReadModel.participantEventFor(line.member.id()).duration,
                roomType: registrationReadModel.registeredInRoomType(line.member.id())
              };
            }, addonLines);
            const groupedLines = R.groupBy(l => l.roomType, enhancedLines);

            const participantsByResources = R.map(roomType => {
                return {
                  limit: socratesReadModel.quotaFor(roomType),
                  roomType: roomType,
                  participants: groupedLines[roomType] || []
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

      activityParticipantService.getWaitinglistParticipantsFor(currentYear, function (err17, waitinglistParticipants) {
        if (err17) { return callback(err17); }
        managementService.addonLinesOf(waitinglistParticipants, function (err18, waitinglistAddonLines) {
          if (err18) { return callback(err18); }

          var waitinglistLinesOf = {};
          roomOptions.allIds().forEach(roomType => { waitinglistLinesOf[roomType] = []; });
          waitinglistAddonLines.forEach(line => {
            registrationReadModel.roomTypesOf(line.member.id()).forEach(roomType => { waitinglistLinesOf[roomType].push(line); });
          });

          const waitinglistInfo = waitinglistAddonLines.map(line => {
            return {
              joined: registrationReadModel.joinedWaitinglistAt(line.member.id()),
              nickname: line.member.nickname(),
              firstname: line.member.firstname(),
              lastname: line.member.lastname(),
              email: line.member.email(),
              location: line.member.location(),
              roommate: line.participation.roommate(),
              roomTypes: registrationReadModel.roomTypesOf(line.member.id()),
              tShirtSize: line.addon.tShirtSize(),
              desiredRoommate: line.participation.roommate(),
              homeAddress: line.addon.homeAddressLines(),
              billingAddress: line.addon.billingAddressLines()
            };
          });

          callback(null, waitinglistInfo);
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
