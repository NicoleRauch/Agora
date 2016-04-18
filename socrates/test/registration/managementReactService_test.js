'use strict';

var moment = require('moment-timezone');
var sinon = require('sinon');
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var eventstoreService = beans.get('eventstoreService');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationReadModel = beans.get('RegistrationReadModel');

var managementReactService = beans.get('managementReactService');

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');

describe('Management React Service', function () {

  afterEach(function () {
    sinon.restore();
  });

  describe('when determining durations', function () {

    it('counts each value', function (done) {
      var eventStore = new GlobalEventStore();
      sinon.stub(eventstoreService, 'getRegistrationReadModel', function (url, callback) { callback(null, new RegistrationReadModel(eventStore)); });
      eventStore.state.registrationEvents = [
        events.participantWasRegistered('single', 2, 'session-id', 'member-id1', aLongTimeAgo),
        events.participantWasRegistered('single', 2, 'session-id', 'member-id2', aLongTimeAgo),
        events.participantWasRegistered('single', 3, 'session-id', 'member-id3', aLongTimeAgo),
        events.participantWasRegistered('single', 4, 'session-id', 'member-id4', aLongTimeAgo),
        events.participantWasRegistered('single', 5, 'session-id', 'member-id5', aLongTimeAgo)
      ];

      managementReactService.durations(function (err, durations) {
        expect(durations).to.have.ownKeys(['2', '3', '4', '5']);
        expect(durations[2]).to.eql({count: 2, duration: 'saturday evening', total: 5});
        expect(durations[3]).to.eql({count: 1, duration: 'sunday morning', total: 3});
        expect(durations[4]).to.eql({count: 1, duration: 'sunday evening', total: 2});
        expect(durations[5]).to.eql({count: 1, duration: 'monday morning', total: 1});
        done(err);
      });

    });

  });

});
