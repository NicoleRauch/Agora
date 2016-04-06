'use strict';
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var e = beans.get('eventConstants');

function enrich(event) {
  event.timestamp = moment().valueOf();
  return event;
}

module.exports = {
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // general SoCraTes data:
  roomQuotaWasSet: function (roomType, quota) {
    return enrich({event: e.ROOM_QUOTA_WAS_SET, roomType, quota});
  },

  urlWasSet: function (url) {
    return enrich({event: e.URL_WAS_SET, url});
  },

  startTimeWasSet: function (startMoment) {
    return enrich({event: e.START_TIME_WAS_SET, startTimeInMillis: startMoment.valueOf()});
  },

  endTimeWasSet: function (endMoment) {
    return enrich({event: e.END_TIME_WAS_SET, endTimeInMillis: endMoment.valueOf()});
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // reservation:
  reservationWasIssued: function (roomType, duration, sessionId) {
    return enrich({event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId, roomType, duration});
  },

  waitinglistReservationWasIssued: function (desiredRoomTypes, sessionId, joinedWaitinglist) {
    return enrich({event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId, desiredRoomTypes, joinedWaitinglist: joinedWaitinglist.valueOf()});
  },

  didNotIssueReservationForAlreadyReservedSession: function (roomType, duration, sessionId) {
    return enrich({event: e.DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION, sessionID: sessionId, roomType, duration});
  },

  didNotIssueWaitinglistReservationForAlreadyReservedSession: function (desiredRoomTypes, sessionId, joinedWaitinglist) {
    return enrich({event: e.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION, sessionID: sessionId, desiredRoomTypes, joinedWaitinglist: joinedWaitinglist.valueOf()});
  },

  didNotIssueReservationForFullResource: function (roomType, duration, sessionId) {
    return enrich({event: e.DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE, sessionID: sessionId, roomType, duration});
  },

  // registration:
  participantWasRegistered: function (roomType, duration, sessionId, memberId) {
    return enrich({event: e.PARTICIPANT_WAS_REGISTERED, sessionID: sessionId, roomType, duration, memberId});
  },

  waitinglistParticipantWasRegistered: function (desiredRoomTypes, sessionId, memberId, joinedWaitinglist) {
    return enrich({event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId, desiredRoomTypes, memberId, joinedWaitinglist: joinedWaitinglist.valueOf()});
  },

  didNotRegisterParticipantForFullResource: function (roomType, duration, sessionId, memberId) {
    return enrich({event: e.DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE, sessionID: sessionId, roomType, duration, memberId});
  },

  didNotRegisterParticipantASecondTime: function (roomType, duration, sessionId, memberId) {
    return enrich({event: e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME, sessionID: sessionId, roomType, duration, memberId});
  },

  // removal:

  participantWasRemoved: function (roomType, memberId) {
    return enrich({event: e.PARTICIPANT_WAS_REMOVED, memberId: memberId, roomType});
  },
  didNotRemoveParticipantBecauseTheyAreNotRegistered: function (roomType, memberId) {
    return enrich({event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED, memberId, roomType});
  },
  didNotRemoveParticipantBecauseTheyAreNotRegisteredForThisRoomType: function (roomType, memberId) {
    return enrich({event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED_FOR_THIS_ROOM_TYPE, memberId, roomType});
  },
  waitinglistParticipantWasRemoved: function (desiredRoomTypes, memberId, joinedWaitinglist) {
    return enrich({event: e.WAITINGLIST_PARTICIPANT_WAS_REMOVED, memberId, desiredRoomTypes, joinedWaitinglist: joinedWaitinglist.valueOf()});
  },
  didNotRemoveWaitinglistParticipantBecauseTheyAreNotRegistered: function (desiredRoomTypes, memberId) {
    return enrich({event: e.DID_NOT_REMOVE_WAITINGLIST_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED, memberId, desiredRoomTypes});
  },

  // management after registration:
  roomTypeWasChanged: function (memberId, roomType, duration) {
    return enrich({event: e.ROOM_TYPE_WAS_CHANGED, memberId, roomType, duration});
  },

  didNotChangeRoomTypeForNonParticipant: function (memberId, roomType) {
    return enrich({event: e.DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, memberId, roomType});
  },

  desiredRoomTypesWereChanged: function (memberId, desiredRoomTypes, joinedWaitinglist) {
    return enrich({event: e.DESIRED_ROOM_TYPES_WERE_CHANGED, memberId, desiredRoomTypes, joinedWaitinglist: joinedWaitinglist.valueOf()});
  },

  didNotChangeDesiredRoomTypesBecauseParticipantIsNotOnWaitinglist: function (memberId, desiredRoomTypes) {
    return enrich({event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_PARTICIPANT_IS_NOT_ON_WAITINGLIST, memberId, desiredRoomTypes});
  },
  didNotChangeDesiredRoomTypesBecauseThereWasNoChange: function (memberId, desiredRoomTypes, joinedWaitinglist) {
    return enrich({event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_THERE_WAS_NO_CHANGE, memberId, desiredRoomTypes, joinedWaitinglist: joinedWaitinglist.valueOf()});
  },

  durationWasChanged: function (memberId, roomType, duration) {
    return enrich({event: e.DURATION_WAS_CHANGED, memberId, roomType, duration});
  },

  didNotChangeDurationForNonParticipant: function (memberId, duration) {
    return enrich({event: e.DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT, memberId, duration});
  },

  registeredParticipantFromWaitinglist: function (roomType, duration, memberId) {
    return enrich({event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType, duration, memberId});
  },

  didNotRegisterParticipantFromWaitinglistASecondTime: function (roomType, duration, memberId) {
    return enrich({event: e.DID_NOT_REGISTER_PARTICIPANT_FROM_WAITINGLIST_A_SECOND_TIME, roomType, duration, memberId});
  },

  didNotRegisterParticipantFromWaitinglistBecauseTheyWereNotOnWaitinglist: function (roomType, duration, memberId) {
    return enrich({event: e.DID_NOT_REGISTER_PARTICIPANT_FROM_WAITINGLIST_BECAUSE_THEY_WERE_NOT_ON_WAITINGLIST, roomType, duration, memberId});
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // rooms:
  roomPairWasAdded: function (roomType, participant1Id, participant2Id) {
    return enrich({event: e.ROOM_PAIR_WAS_ADDED,  roomType, participant1Id, participant2Id});
  },
  didNotAddRoomPairBecauseParticipantIsNotInRoomType: function (roomType, memberId) {
    return enrich({event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType, memberId});
  },
  didNotAddRoomPairBecauseParticipantIsAlreadyInRoom: function (roomType, memberId) {
    return enrich({event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_ALREADY_IN_ROOM, roomType, memberId});
  },
  didNotAddRoomPairBecauseParticipantIsPairedWithThemselves: function (roomType, memberId) {
    return enrich({event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_PAIRED_WITH_THEMSELVES, roomType, memberId});
  },

  roomPairWasRemoved: function (roomType, participant1Id, participant2Id) {
    return enrich({event: e.ROOM_PAIR_WAS_REMOVED, roomType, participant1Id, participant2Id});
  },
  didNotRemoveRoomPairBecauseParticipantIsNotInRoomType: function (roomType, memberId) {
    return enrich({event: e.DID_NOT_REMOVE_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType, memberId});
  },
  didNotRemoveRoomPairBecauseThePairDoesNotExistForThisRoomType: function (roomType, participant1Id, participant2Id) {
    return enrich({event: e.DID_NOT_REMOVE_ROOM_PAIR_BECAUSE_THE_PAIR_DOES_NOT_EXIST_FOR_THIS_ROOM_TYPE, roomType, participant1Id, participant2Id});
  },

  roomPairContainingAParticipantWasRemoved: function (roomType, memberIdToBeRemoved, participant1Id, participant2Id) {
    return enrich({event: e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED, roomType, memberIdToBeRemoved, participant1Id, participant2Id});
  },
  didNotRemoveRoomPairContainingBecauseThePairDoesNotExistForThisRoomType: function (roomType, memberId) {
    return enrich({event: e.DID_NOT_REMOVE_ROOM_PAIR_CONTAINING_BECAUSE_THE_PAIR_DOES_NOT_EXIST_FOR_THIS_ROOM_TYPE, roomType, memberId});
  }
};
