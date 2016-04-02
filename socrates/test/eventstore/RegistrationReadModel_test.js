'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var e = beans.get('eventConstants');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationReadModel = beans.get('RegistrationReadModel');

var sessionId1 = 'session-id-1';
var sessionId2 = 'session-id-2';

var singleBedRoom = 'singleBedRoom';
var bedInDouble = 'bedInDouble';

var untilSaturday = 'untilSaturday';
var untilSundayMorning = 'untilSundayMorning';

var memberId1 = 'member-id-1';
var memberId2 = 'member-id-2';

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var aShortTimeAgo = moment.tz().subtract(10, 'minutes');
var anEvenShorterTimeAgo = moment.tz().subtract(1, 'minutes');

function setTimestamp(event, timestamp) {
  event.timestamp = timestamp.valueOf();
  return event;
}

describe('The registration read model', function () {

  var eventStore;
  var readModel;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
    readModel = new RegistrationReadModel(eventStore);
  });

  describe('calculating the reservation expiration time', function () {

    it('returns undefined as the expiration time if there are no reservations for the given session id', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId2)).to.be(undefined);
    });

    it('returns the expiration time of the reservation if there is one', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
    });

    it('returns undefined as the expiration time of the reservation if it is already expired', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aLongTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId1)).to.be(undefined);
    });

    it('returns the expiration time of the waitinglist reservation if there is no regular reservation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
    });

    it('returns the expiration time of the reservation if there are both regular and waitinglist reservations', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo),
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), anEvenShorterTimeAgo)
      ];

      expect(readModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());

    });
  });

  describe('giving the reservations and participants for a room type', function () {

    it('does not consider any reservations or participants when there are no events', function () {

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('does not consider reservations that are already expired', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aLongTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('considers reservations that are still active', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aShortTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.RESERVATION_WAS_ISSUED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });

    it('considers participations', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1), aLongTimeAgo),
        setTimestamp(events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId2, memberId2), aShortTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          timestamp: aLongTimeAgo.valueOf()
        },
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId2,
          memberId: memberId2,
          roomType: singleBedRoom,
          duration: untilSundayMorning,
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });

    it('does not consider registrations that have a matching participation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aShortTimeAgo),
        setTimestamp(events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1), anEvenShorterTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          timestamp: anEvenShorterTimeAgo.valueOf()
        }]);
    });

    it('does not consider DID_NOT_... reservation and registration events', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1), aShortTimeAgo),
        setTimestamp(events.didNotIssueReservationForAlreadyReservedSession(bedInDouble, untilSaturday, sessionId1), aShortTimeAgo),
        setTimestamp(events.didNotIssueReservationForFullResource(singleBedRoom, untilSaturday, sessionId2), aShortTimeAgo),
        setTimestamp(events.didNotRegisterParticipantForFullResource(singleBedRoom, untilSundayMorning, sessionId1, memberId1), aShortTimeAgo),
        setTimestamp(events.didNotRegisterParticipantASecondTime(singleBedRoom, untilSundayMorning, sessionId1, memberId1), aShortTimeAgo)
      ];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.RESERVATION_WAS_ISSUED,
          sessionID: sessionId1,
          roomType: singleBedRoom,
          duration: untilSaturday,
          timestamp: aShortTimeAgo.valueOf()
        }]);
      expect(readModel.reservationsAndParticipantsFor(bedInDouble)).to.eql([]);
    });

    it('returns only the events belonging to the queried room type', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(bedInDouble, untilSaturday, sessionId1), aLongTimeAgo),
        setTimestamp(events.reservationWasIssued(singleBedRoom, untilSundayMorning, sessionId1), aShortTimeAgo),
        setTimestamp(events.participantWasRegistered(bedInDouble, untilSaturday, sessionId2, memberId2), aShortTimeAgo),
        setTimestamp(events.participantWasRegistered(singleBedRoom, untilSundayMorning, sessionId1, memberId1), anEvenShorterTimeAgo)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          roomType: singleBedRoom,
          duration: untilSundayMorning,
          timestamp: anEvenShorterTimeAgo.valueOf()
        }]);
      expect(readModel.reservationsAndParticipantsFor(bedInDouble)).to.eql([
        {
          event: e.PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId2,
          memberId: memberId2,
          roomType: bedInDouble,
          duration: untilSaturday,
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });

  });

  describe('considering removals', function () {
    it('does not list the registration event of a participant that has been removed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1),
        events.participantWasRemoved(singleBedRoom, memberId1)];

      expect(readModel.reservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('does not return the member id  and information of a participant that has been removed', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1),
        events.participantWasRemoved(singleBedRoom, memberId1)];

      expect(readModel.participantsByMemberIdFor(singleBedRoom)).to.eql({});
    });
  });

  describe('calculating the existence of a valid reservation', function () {

    it('returns false if there are no reservations for the given session id', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId2)).to.be(false);
    });

    it('returns true if there is a valid reservation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });

    it('returns false if the reservation is already expired', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aLongTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(false);
    });

    it('returns true if there is a waitinglist reservation but no no regular reservation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aShortTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });

    it('returns true if there are both regular and waitinglist reservations', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(singleBedRoom, 'untilSaturday', sessionId1), aShortTimeAgo),
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), anEvenShorterTimeAgo)
      ];

      expect(readModel.hasValidReservationFor(sessionId1)).to.be(true);
    });
  });

  describe('for waitinglist reservations and participants', function () {
    it('does not consider any waitinglist reservations or participants when there are no events', function () {
      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('does not consider reservations that are already expired', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued(singleBedRoom, sessionId1), aLongTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([]);
    });

    it('considers reservations that are still active', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aShortTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          sessionID: sessionId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });

    it('considers participations', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1), aLongTimeAgo),
        setTimestamp(events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId2, memberId2), aShortTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: aLongTimeAgo.valueOf()
        },
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId2,
          memberId: memberId2,
          desiredRoomTypes: [singleBedRoom],
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });

    it('does not consider registrations that have a matching participation', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aShortTimeAgo),
        setTimestamp(events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1), anEvenShorterTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: anEvenShorterTimeAgo.valueOf()
        }]);
    });

    it('does not consider DID_NOT_... reservation and registration events', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aShortTimeAgo),
        setTimestamp(events.didNotIssueWaitinglistReservationForAlreadyReservedSession([bedInDouble], sessionId1), aShortTimeAgo),
        setTimestamp(events.didNotRegisterParticipantASecondTime(singleBedRoom, sessionId1, memberId1), aShortTimeAgo)
      ];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
          sessionID: sessionId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: aShortTimeAgo.valueOf()
        }]);
      expect(readModel.waitinglistReservationsAndParticipantsFor(bedInDouble)).to.eql([]);
    });

    it('returns only the events belonging to the queried room type', function () {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued([bedInDouble], sessionId1), aLongTimeAgo),
        setTimestamp(events.waitinglistReservationWasIssued([singleBedRoom], sessionId1), aShortTimeAgo),
        setTimestamp(events.waitinglistParticipantWasRegistered([bedInDouble], sessionId2, memberId2), aShortTimeAgo),
        setTimestamp(events.waitinglistParticipantWasRegistered([singleBedRoom], sessionId1, memberId1), anEvenShorterTimeAgo)];

      expect(readModel.waitinglistReservationsAndParticipantsFor(singleBedRoom)).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId1,
          memberId: memberId1,
          desiredRoomTypes: [singleBedRoom],
          timestamp: anEvenShorterTimeAgo.valueOf()
        }]);
      expect(readModel.waitinglistReservationsAndParticipantsFor(bedInDouble)).to.eql([
        {
          event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
          sessionID: sessionId2,
          memberId: memberId2,
          desiredRoomTypes: [bedInDouble],
          timestamp: aShortTimeAgo.valueOf()
        }]);
    });
  });

  describe('knows about registered persons', function () {
    it('registers a registrationTuple', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(singleBedRoom, untilSaturday, sessionId1),
        events.participantWasRegistered(singleBedRoom, untilSaturday, sessionId1, memberId1)];

      expect(readModel.isAlreadyRegistered(memberId1)).to.be.true();
    });

  });

  describe('knows about a participant\'s selected options', function () {

    it('returns a registered member\'s option', function () {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued('single', 3, sessionId1),
        events.participantWasRegistered('single', 3, sessionId1, memberId1)];

      expect(readModel.selectedOptionsFor(memberId1)).to.be('single,3');
    });

    it('returns a registered member\'s options for waitinglist registration', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued(['single', 'junior'], sessionId1),
        events.waitinglistParticipantWasRegistered(['single', 'junior'], sessionId1, memberId1)];

      expect(readModel.selectedOptionsFor(memberId1)).to.eql('single,waitinglist;junior,waitinglist');
    });

    it('returns null as the options for a not registered member', function () {

      expect(readModel.selectedOptionsFor(memberId1)).to.be(null);
    });

  });
  describe('knows about participants on waitinglist (isALreadyOnWaitinglist)', function () {
    it('returns false if participant is not on waitinglist', function () {
      eventStore.state.registrationEvents = [];

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(false);
    });

    it('returns true if participant is on waitinglist', function () {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered(['single', 'junior'], sessionId1, memberId1)
      ];

      expect(readModel.isAlreadyOnWaitinglist(memberId1)).to.eql(true);
    });


  });

});
