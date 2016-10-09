/* eslint no-underscore-dangle: 0 */
'use strict';

var moment = require('moment-timezone');

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var R = require('ramda');

const config = require('../../testutil/configureForTest');
var beans = config.get('beans');
const cache = config.get('cache');

var socratesActivitiesService = beans.get('socratesActivitiesService');
var Member = beans.get('member');

var memberstore = beans.get('memberstore');
var notifications = beans.get('socratesNotifications');

var events = beans.get('events');
var e = beans.get('eventConstants');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var RoomsReadModel = beans.get('RoomsReadModel');
var RegistrationReadModel = beans.get('RegistrationReadModel');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');
var socratesConstants = beans.get('socratesConstants');

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var now = moment.tz();

describe('SoCraTes Activities Service', function () {

  var eventStore;
  var changedResource;
  var saveEventStore;

  var newParticipantNotification;
  var changedDurationNotification;
  var changedRoomTypeNotification;
  var changedWaitinglistNotification;
  var removedFromParticipantsNotification;
  var removedFromWaitinglistNotification;

  beforeEach(function () {
    cache.flushAll();

    eventStore = new GlobalEventStore();

    newParticipantNotification = sinon.stub(notifications, 'newParticipant');
    changedDurationNotification = sinon.stub(notifications, 'changedDuration');
    changedResource = sinon.spy();
    changedRoomTypeNotification = sinon.stub(notifications, 'changedResource', changedResource);
    changedWaitinglistNotification = sinon.stub(notifications, 'changedWaitinglist');
    removedFromParticipantsNotification = sinon.stub(notifications, 'removedFromParticipants');
    removedFromWaitinglistNotification = sinon.stub(notifications, 'removedFromWaitinglist');

    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      if (nickname === 'nicknameForPair1') { return callback(null, new Member({id: 'memberIdForPair1'})); }
      if (nickname === 'nicknameForPair2') { return callback(null, new Member({id: 'memberIdForPair2'})); }
      callback(null, new Member({id: 'memberId'}));
    });

    sinon.stub(eventstore, 'getEventStore', function (url, callback) {
      const newStore = new GlobalEventStore();
      newStore.state = Object.assign({}, eventStore.state);
      callback(null, newStore);
    });
    saveEventStore = sinon.stub(eventstore, 'saveEventStore', function (store, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

  function stripTimestamps(someEvents) {
    return someEvents.map(event => {
      var newEvent = R.clone(event);
      delete newEvent.timestamp;
      return newEvent;
    });
  }

  describe('fromWaitinglistToParticipant', function () {

    it('registers the user when he is on the waitinglist, updates the registration read model and saves the eventstore', function (done) {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered(['single'], 'sessionId', 'memberId', aLongTimeAgo)];

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single', duration: 2}, now, function (err) {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);

        expect(newParticipantNotification.called).to.be.true();

        const readModel = cache.get(socratesConstants.currentUrl + '_registrationReadModel');
        expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(1);

        done(err);
      });
    });

    it('registers the user even when he is not on the waitinglist', function (done) {

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single', duration: 2}, now, function (err) {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: undefined, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);

        expect(newParticipantNotification.called).to.be.true();
        done(err);
      });
    });

    it('registers the user even when the limit is 0', function (done) {
      eventStore.state.events = [
        events.roomQuotaWasSet('single', 0),
        events.waitinglistParticipantWasRegistered(['single'], 'sessionId', 'memberId', aLongTimeAgo)];

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single', duration: 2}, now, function (err) {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 0},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);

        expect(newParticipantNotification.called).to.be.true();
        done(err);
      });
    });

    it('registers the user even when the resource is full', function (done) {
      eventStore.state.events = [
        events.roomQuotaWasSet('single', 1),
        events.participantWasRegistered('single', 3, 'otherSessionId', 'otherMemberId', aLongTimeAgo),
        events.waitinglistParticipantWasRegistered(['single'], 'sessionId', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single', duration: 2}, now, function (err) {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 1},
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'otherSessionId', roomType: 'single', memberId: 'otherMemberId', duration: 3, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);

        expect(newParticipantNotification.called).to.be.true();
        done(err);
      });
    });

    it('does not register the user if he is already registered, even if the room is different', function (done) {
      eventStore.state.events = [
        events.participantWasRegistered('junior', 3, 'sessionId', 'memberId', aLongTimeAgo),
        events.waitinglistParticipantWasRegistered(['single'], 'sessionId', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single', duration: 2}, now, function (err) {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', roomType: 'junior', memberId: 'memberId', duration: 3, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.DID_NOT_REGISTER_PARTICIPANT_FROM_WAITINGLIST_A_SECOND_TIME, roomType: 'single', memberId: 'memberId', duration: 2}]);

        expect(newParticipantNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not register the user if the nickname is empty', function (done) {
      socratesActivitiesService.fromWaitinglistToParticipant({nickname: '', roomType: 'single', duration: 4}, now, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(newParticipantNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not register the user if the room type is invalid', function (done) {
      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'unknown', duration: 4}, now, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(newParticipantNotification.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

    it('does not register the user if the duration is invalid', function (done) {
      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single', duration: 0}, now, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(newParticipantNotification.called).to.be.false();
        expect(err.errors).to.eql(['The duration is invalid!']);
        done();
      });
    });

  });

  describe('newDurationFor', function () {

    it('saves the activity with a new duration for the given member in the given resource and updates the event store and the read model', function (done) {
      eventStore.state.events = [
        events.participantWasRegistered('single', 2, 'sessionId', 'memberId', aLongTimeAgo)
      ];

      const params = {nickname: 'nickname', roomType: 'single', duration: 4};
      socratesActivitiesService.newDurationFor(params, function (err) {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.DURATION_WAS_CHANGED, roomType: 'single', memberId: 'memberId', duration: 4, joinedSoCraTes: aLongTimeAgo.valueOf()}]);

        expect(changedDurationNotification.called).to.be.true();

        const readModel = cache.get(socratesConstants.currentUrl + '_registrationReadModel');
        expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(1);
        expect(readModel.reservationsAndParticipantsFor('single')[0].duration).to.eql(4);
        done(err);
      });
    });

    it('does not change the duration for a non-participant', function (done) {
      eventStore.state.events = [];

      const params = {nickname: 'nickname', roomType: 'single', duration: 4};
      socratesActivitiesService.newDurationFor(params, function (err) {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT, memberId: 'memberId', duration: 4}]);

        expect(changedDurationNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not change the duration if the nickname is empty', function (done) {
      socratesActivitiesService.newDurationFor({nickname: '', roomType: 'single', duration: 4}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(changedDurationNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not change the duration if the room type is invalid', function (done) {
      socratesActivitiesService.newDurationFor({nickname: 'nickname', roomType: 'unknown', duration: 4}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(changedDurationNotification.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

    it('does not change the duration if the duration is invalid', function (done) {
      socratesActivitiesService.newDurationFor({nickname: 'nickname', roomType: 'single', duration: 0}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(changedDurationNotification.called).to.be.false();
        expect(err.errors).to.eql(['The duration is invalid!']);
        done();
      });
    });
  });

  describe('newRoomTypeFor', function () {

    it('moves a member\'s registration to a different resource and updates event store and read model', function (done) {
      eventStore.state.events = [
        events.participantWasRegistered('single', 2, 'sessionId', 'memberId', aLongTimeAgo)
      ];

      const params = {nickname: 'nickname', newRoomType: 'bed_in_double'};
      socratesActivitiesService.newRoomTypeFor(params, function (err) {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.ROOM_TYPE_WAS_CHANGED, roomType: 'bed_in_double', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()}]);

        expect(changedRoomTypeNotification.called).to.be.true();

        const readModel = cache.get(socratesConstants.currentUrl + '_registrationReadModel');
        expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(0);
        expect(readModel.reservationsAndParticipantsFor('bed_in_double')).to.have.length(1);
        done(err);
      });
    });

    it('does not change the room type for a non-participant and updates event store and read model', function (done) {
      eventStore.state.events = [];

      const params = {nickname: 'nickname', newRoomType: 'bed_in_double'};
      socratesActivitiesService.newRoomTypeFor(params, function (err) {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, roomType: 'bed_in_double', memberId: 'memberId'}]);

        expect(changedRoomTypeNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not change the room type if the nickname is empty', function (done) {
      socratesActivitiesService.newRoomTypeFor({nickname: '', newRoomType: 'single'}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(changedRoomTypeNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not change the room type if the room type is invalid', function (done) {
      socratesActivitiesService.newRoomTypeFor({nickname: 'nickname', newRoomType: 'unknown'}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(changedRoomTypeNotification.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

  });

  describe('addParticipantPairFor', function () {

    it('joins two members to form a room, updates the eventstore and the read model', function (done) {

      eventStore.state.events = [
        events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair1', aLongTimeAgo),
        events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair2', aLongTimeAgo)
      ];

      socratesActivitiesService.addParticipantPairFor({roomType: 'bed_in_double', participant1Nick: 'nicknameForPair1', participant2Nick: 'nicknameForPair2'}, function (err) {
        var pairEvents = saveEventStore.firstCall.args[0].state.events;
        expect(pairEvents).to.have.length(3);
        expect(pairEvents[2].participant1Id).to.be('memberIdForPair1');
        expect(pairEvents[2].participant2Id).to.be('memberIdForPair2');

        const readModel = cache.get(socratesConstants.currentUrl + '_roomsReadModel');
        expect(readModel.roomPairsFor('bed_in_double')).to.have.length(1);

        done(err);
      });
    });

    it('does not add a participant pair if the first nickname is empty', function (done) {
      socratesActivitiesService.addParticipantPairFor({roomType: 'bed_in_double', participant1Nick: '', participant2Nick: 'nicknameForPair2'}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['An empty first nickname is invalid!']);
        done();
      });
    });

    it('does not add a participant pair if the second nickname is empty', function (done) {
      socratesActivitiesService.addParticipantPairFor({roomType: 'bed_in_double', participant1Nick: 'nicknameForPair1', participant2Nick: ''}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['An empty second nickname is invalid!']);
        done();
      });
    });

    it('does not add a participant pair if the room type is invalid', function (done) {
      socratesActivitiesService.addParticipantPairFor({roomType: 'unknown', participant1Nick: 'nicknameForPair1', participant2Nick: 'nicknameForPair2'}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

  });

  describe('removeParticipantPairFor', function () {

    it('removes a room pair', function (done) {
      eventStore.state.events = [
        events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair1', aLongTimeAgo),
        events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair2', aLongTimeAgo),
        events.roomPairWasAdded('bed_in_double', 'memberIdForPair1', 'memberIdForPair2')
      ];

      expect(new RoomsReadModel(eventStore, new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore))).roomPairsFor('bed_in_double')).to.eql([{ // TODO extract to its own test!
        participant1Id: 'memberIdForPair1',
        participant2Id: 'memberIdForPair2'
      }]);

      socratesActivitiesService.removeParticipantPairFor({roomType: 'bed_in_double', participant1Nick: 'nicknameForPair1', participant2Nick: 'nicknameForPair2'}, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberIdForPair1', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberIdForPair2', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.ROOM_PAIR_WAS_ADDED, roomType: 'bed_in_double', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'},
          {event: e.ROOM_PAIR_WAS_REMOVED, roomType: 'bed_in_double', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'}
        ]);

        const readModel = cache.get(socratesConstants.currentUrl + '_roomsReadModel');
        expect(readModel.roomPairsFor('bed_in_double')).to.have.length(0);

        //      expect(new RoomsReadModel(eventStore, new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore))).roomPairsFor('bed_in_double')).to.eql([]);
        done(err);
      });
    });

    it('does not remove a participant pair if the first nickname is empty', function (done) {
      socratesActivitiesService.removeParticipantPairFor({roomType: 'bed_in_double', participant1Nick: '', participant2Nick: 'nicknameForPair2'}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['An empty first nickname is invalid!']);
        done();
      });
    });

    it('does not remove a participant pair if the second nickname is empty', function (done) {
      socratesActivitiesService.removeParticipantPairFor({roomType: 'bed_in_double', participant1Nick: 'nicknameForPair1', participant2Nick: ''}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['An empty second nickname is invalid!']);
        done();
      });
    });

    it('does not remove a participant pair if the room type is invalid', function (done) {
      socratesActivitiesService.removeParticipantPairFor({roomType: 'unknown', participant1Nick: 'nicknameForPair1', participant2Nick: 'nicknameForPair2'}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

  });

  describe('removeParticipant', function () {

    it('removes a participant from the given resource', function (done) {
      eventStore.state.events = [
        events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.removeParticipantFor({roomType: 'bed_in_double', participantNick: 'nickname'}, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.PARTICIPANT_WAS_REMOVED, roomType: 'bed_in_double', memberId: 'memberId'}
        ]);

        expect(removedFromParticipantsNotification.called).to.be.true();

        //      expect(R.keys(new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore)).participantsByMemberIdFor('bed_in_double'))).to.eql([]);
        done(err);
      });
    });

    it('when removing a participant, also removes him from his room pair and updates event store and read models', function (done) {
      eventStore.state.events = [
        events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair1', aLongTimeAgo),
        events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair2', aLongTimeAgo),
        events.roomPairWasAdded('bed_in_double', 'memberIdForPair1', 'memberIdForPair2')
      ];

      socratesActivitiesService.removeParticipantFor({roomType: 'bed_in_double', participantNick: 'nicknameForPair1'}, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberIdForPair1', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberIdForPair2', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.ROOM_PAIR_WAS_ADDED, roomType: 'bed_in_double', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'},
          {event: e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED, roomType: 'bed_in_double', memberIdToBeRemoved: 'memberIdForPair1', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'},
          {event: e.PARTICIPANT_WAS_REMOVED, roomType: 'bed_in_double', memberId: 'memberIdForPair1'}
        ]);

        expect(removedFromParticipantsNotification.called).to.be.true();

        const registrationReadModel = cache.get(socratesConstants.currentUrl + '_registrationReadModel');
        const roomsReadModel = cache.get(socratesConstants.currentUrl + '_roomsReadModel');
        expect(R.keys(registrationReadModel.participantsByMemberIdFor('bed_in_double'))).to.eql(['memberIdForPair2']);
        expect(roomsReadModel.roomPairsFor('bed_in_double')).to.eql([]);
        done(err);
      });
    });

    it('does not send a notification when the removal fails because the participant was not registered', function (done) {
      eventStore.state.events = [];

      socratesActivitiesService.removeParticipantFor({roomType: 'bed_in_double', participantNick: 'nickname'}, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED, roomType: 'bed_in_double', memberId: 'memberId'}
        ]);

        expect(removedFromParticipantsNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not send a notification when the removal fails because the room type does not match', function (done) {
      eventStore.state.events = [
        events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.removeParticipantFor({roomType: 'single', participantNick: 'nickname'}, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED_FOR_THIS_ROOM_TYPE, roomType: 'single', memberId: 'memberId'}
        ]);

        expect(removedFromParticipantsNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not remove a participant if the nickname is empty', function (done) {
      socratesActivitiesService.removeParticipantFor({roomType: 'bed_in_double', participantNick: ''}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromParticipantsNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not remove a participant if the room type is invalid', function (done) {
      socratesActivitiesService.removeParticipantFor({roomType: 'unknown', participantNick: 'nickname'}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromParticipantsNotification.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

  });

  describe('newWaitinglistFor', function () {

    it('changes the waitinglist of a waitinglist member and updates the event store and the read model', function (done) {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered(['single'], 'session-id', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: ['bed_in_double']}, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf(), sessionId: 'session-id'},
          {event: e.DESIRED_ROOM_TYPES_WERE_CHANGED, desiredRoomTypes: ['bed_in_double'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()}
        ]);

        expect(changedWaitinglistNotification.called).to.be.true();

        const readModel = cache.get(socratesConstants.currentUrl + '_registrationReadModel');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')).to.have.length(0);
        expect(readModel.waitinglistReservationsAndParticipantsFor('bed_in_double')).to.have.length(1);

        done(err);
      });
    });

    it('does not change the waitinglist of a non-waitinglist member and updates the event store and the read model', function (done) {
      eventStore.state.events = [];

      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: ['bed_in_double']}, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_PARTICIPANT_IS_NOT_ON_WAITINGLIST, desiredRoomTypes: ['bed_in_double'], memberId: 'memberId'}
        ]);

        expect(changedWaitinglistNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not change the waitinglist if the new options are identical to the old options', function (done) {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered(['single'], 'session-id', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: ['single']}, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf(), sessionId: 'session-id'},
          {event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_THERE_WAS_NO_CHANGE, desiredRoomTypes: ['single'], memberId: 'memberId'}
        ]);

        expect(changedWaitinglistNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not change the waitinglist if the nickname is empty', function (done) {
      socratesActivitiesService.newWaitinglistFor({nickname: '', newDesiredRoomTypes: ['single']}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(changedWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not change the waitinglist if one of the room types is invalid', function (done) {
      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: ['single', 'unknown']}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(changedWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['One of the room types is invalid!']);
        done();
      });
    });

    it('does not change the waitinglist if the list of room types is empty', function (done) {
      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: []}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(changedWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['Please select at least one desired room type!']);
        done();
      });
    });

  });

  describe('removeWaitinglistParticipant', function () {

    it('removes a waitinglist member from the given resource and updates event store and read model', function (done) {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered(['single'], 'session-id', 'memberId', aLongTimeAgo)
      ];

      const params = {desiredRoomTypes: ['single'], waitinglistMemberNick: 'nickname'};
      socratesActivitiesService.removeWaitinglistMemberFor(params, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REMOVED, desiredRoomTypes: ['single'], memberId: 'memberId'}
        ]);

        expect(removedFromWaitinglistNotification.called).to.be.true();

        const readModel = cache.get(socratesConstants.currentUrl + '_registrationReadModel');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')).to.have.length(0);
        done(err);
      });
    });

    it('does not remove a waitinglist member if they are not registered', function (done) {
      eventStore.state.events = [];

      const params = {desiredRoomTypes: ['single'], waitinglistMemberNick: 'nickname'};
      socratesActivitiesService.removeWaitinglistMemberFor(params, function (err) {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.DID_NOT_REMOVE_WAITINGLIST_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED, desiredRoomTypes: ['single'], memberId: 'memberId'}
        ]);

        expect(removedFromWaitinglistNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not remove from the waitinglist if the nickname is empty', function (done) {
      socratesActivitiesService.removeWaitinglistMemberFor({waitinglistMemberNick: '', desiredRoomTypes: ['single']}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not remove from the waitinglist if one of the room types is invalid', function (done) {
      socratesActivitiesService.removeWaitinglistMemberFor({waitinglistMemberNick: 'nickname', desiredRoomTypes: ['single', 'unknown']}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['One of the room types is invalid!']);
        done();
      });
    });

    it('does not remove from the waitinglist if the list of room types is empty', function (done) {
      socratesActivitiesService.removeWaitinglistMemberFor({waitinglistMemberNick: 'nickname', desiredRoomTypes: []}, function (err) {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['Please select at least one desired room type!']);
        done();
      });
    });

  });
});
