'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must');
var moment = require('moment-timezone');
var _ = require('lodash');

//var util = require('util');

var beans = require('../../testutil/configureForTest').get('beans');

var activitiesService = beans.get('activitiesService');
var activitystore = beans.get('activitystore');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var memberstore = beans.get('memberstore');

var fieldHelpers = beans.get('fieldHelpers');
var Activity = beans.get('activity');
var Member = beans.get('member');
var Group = beans.get('group');
var notifications = beans.get('notifications');

var dummyActivity = new Activity({title: 'Title of the Activity', description: 'description', assignedGroup: 'assignedGroup',
  location: 'location', direction: 'direction', startDate: '01.01.2013', url: 'urlOfTheActivity', color: 'aus Gruppe' });

var emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'groupname',
  location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlOfTheActivity',
  owner: 'ownerId'});

var group = new Group({id: 'groupname', longName: 'Buxtehude'});

var waitinglistMembersOf = function (activity, resourceName) {
  return _.pluck(_.pluck(activity.resourceNamed(resourceName).waitinglistEntries(), 'state'), '_memberId');
};

var activityWithEinzelzimmer = function (ressource) {
  var state = {resources: {Einzelzimmer: ressource}};
  var activity = new Activity(state);
  sinon.stub(activitystore, 'saveActivity', function (id, callback) { callback(null); });
  sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
  sinon.stub(activitystore, 'getActivityForId', function (id, callback) { callback(null, activity); });
  return activity;
};

describe('Activities Service', function () {

  beforeEach(function () {
    sinon.stub(activitystore, 'allActivities', function (callback) {callback(null, [dummyActivity]); });

    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) {
      callback(null, [
        {id: 'assignedGroup', longName: 'The name of the assigned Group'}
      ]);
    });
    sinon.stub(groupsService, 'allGroupColors', function (callback) {
      var result = {};
      result.assignedGroup = '#123456';
      callback(null, result);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('returns the queried activities and enhances them with their color and group name', function () {
    activitiesService.getActivitiesForDisplay(activitystore.allActivities, function (err, activities) {
      expect(err).to.not.exist();
      expect(activities.length).to.equal(1);
      var activity = activities[0];
      expect(activity.title()).to.equal('Title of the Activity');
      expect(activity.colorRGB).to.equal('#123456');
      expect(activity.groupName()).to.equal('The name of the assigned Group');
    });
  });

  it('returns an activity and enhances it with its group and visitors', function (done) {
    var member1 = new Member({id: 'memberId1', nickname: 'participant1', email: 'a@b.c'});
    var member2 = new Member({id: 'memberId2', nickname: 'participant2', email: 'a@b.c'});
    var owner = new Member({id: 'ownerId', nickname: 'owner', email: 'a@b.c'});
    sinon.stub(activitystore, 'getActivity', function (activityId, callback) { callback(null, emptyActivity); });
    sinon.stub(memberstore, 'getMembersForIds', function (ids, callback) {
      callback(null, [ member1, member2 ]);
    });
    sinon.stub(memberstore, 'getMemberForId', function (id, callback) {
      callback(null, owner);
    });
    sinon.stub(groupstore, 'getGroup', function (groupname, callback) {
      if (groupname === 'groupname') {
        return callback(null, group);
      }
      return callback(null, null);
    });

    activitiesService.getActivityWithGroupAndParticipants('urlOfTheActivity', function (err, activity) {
      expect(activity, 'Activity').to.exist();
      expect(activity.group, 'Group').to.equal(group);
      expect(activity.participants.length).to.equal(2);
      expect(activity.participants, 'Participants').to.contain(member1);
      expect(activity.participants, 'Participants').to.contain(member2);
      expect(activity.ownerNickname, 'Owner').to.equal('owner');
      done(err);
    });
  });

  describe('checks the validity of URLs and', function () {
    it('does not allow the URL \'edit\'', function (done) {
      activitiesService.isValidUrl('edit', '^edit$', function (err, result) {
        expect(result).to.be(false);
        done(err);
      });
    });
    it('allows the untrimmed URL \' edit \'', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, null); });
      activitiesService.isValidUrl(' edit ', '^edit$', function (err, result) {
        expect(result).to.be(true);
        done(err);
      });
    });
  });

  describe('- when adding a visitor -', function () {

    it('succeeds when registration is open', function (done) {
      var activity = activityWithEinzelzimmer({_registrationOpen: true});
      sinon.stub(notifications, 'visitorRegistration');

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(statusTitle, 'Status Title').to.not.exist();
        expect(statusText, 'Status Text').to.not.exist();
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberId');
        done(err);
      });
    });

    it('notifies of the registration', function (done) {
      var activity = activityWithEinzelzimmer({_registrationOpen: true});
      sinon.stub(notifications, 'visitorRegistration');

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err) {
        expect(notifications.visitorRegistration.calledOnce).to.be(true);
        expect(notifications.visitorRegistration.firstCall.args[0]).to.eql(activity);
        expect(notifications.visitorRegistration.firstCall.args[1]).to.equal('memberId');
        expect(notifications.visitorRegistration.firstCall.args[2]).to.equal('Einzelzimmer');
        done(err);
      });
    });

    it('gives a status message when registration is not open', function (done) {
      var activity = activityWithEinzelzimmer({_registrationOpen: false});

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(statusTitle, 'Status Title').to.equal('activities.registration_not_now');
        expect(statusText, 'Status Text').to.equal('activities.registration_not_possible');
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.not.contain('memberId');
        done(err);
      });
    });

    it('succeeds when registration is not open but registrant is on waiting list and allowed to subscribe', function (done) {
      var tomorrow = moment();
      tomorrow.add(1, 'days');
      var activity = activityWithEinzelzimmer({ _registrationOpen: false, _waitinglist: [
        { _memberId: 'memberId', _registrationValidUntil: tomorrow.toDate() }
      ]});
      sinon.stub(notifications, 'visitorRegistration');

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(statusTitle, 'Status Title').to.not.exist();
        expect(statusText, 'Status Text').to.not.exist();
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberId');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err) {
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

  describe('- when removing a visitor -', function () {

    it('succeeds when registration is open', function (done) {
      var activity = activityWithEinzelzimmer({_registrationOpen: true, _registeredMembers: [
        {memberId: 'memberId'},
        {memberId: 'otherId'}
      ]});
      sinon.stub(notifications, 'visitorUnregistration');

      activitiesService.removeVisitorFrom('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.not.contain('memberId');
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('otherId');
        done(err);
      });
    });

    it('succeeds when registration is not open', function (done) {
      var activity = activityWithEinzelzimmer({_registrationOpen: false, _registeredMembers: [
        {memberId: 'memberId'},
        {memberId: 'otherId'}
      ]});
      sinon.stub(notifications, 'visitorUnregistration');

      activitiesService.removeVisitorFrom('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.not.contain('memberId');
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('otherId');
        done(err);
      });
    });

    it('notifies of the unregistration', function (done) {
      var activity = activityWithEinzelzimmer({_registrationOpen: true, _registeredMembers: [
        {memberId: 'memberId'},
        {memberId: 'otherId'}
      ]});
      sinon.stub(notifications, 'visitorUnregistration');

      activitiesService.removeVisitorFrom('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(notifications.visitorUnregistration.calledOnce).to.be(true);
        expect(notifications.visitorUnregistration.firstCall.args[0]).to.eql(activity);
        expect(notifications.visitorUnregistration.firstCall.args[1]).to.equal('memberId');
        expect(notifications.visitorUnregistration.firstCall.args[2]).to.equal('Einzelzimmer');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });

      activitiesService.removeVisitorFrom('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

  describe('- when adding somebody to the waitinglist -', function () {

    it('succeeds when resource has a waitinglist', function (done) {
      var activity = activityWithEinzelzimmer({_waitinglist: []});
      sinon.stub(notifications, 'waitinglistAddition');

      activitiesService.addToWaitinglist('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(statusTitle, 'Status Title').to.not.exist();
        expect(statusText, 'Status Text').to.not.exist();
        var waitinglistMembers = waitinglistMembersOf(activity, 'Einzelzimmer');
        expect(waitinglistMembers).to.contain('memberId');
        done(err);
      });
    });

    it('notifies of the waitinglist addition', function (done) {
      var activity = activityWithEinzelzimmer({_waitinglist: []});
      sinon.stub(notifications, 'waitinglistAddition');

      activitiesService.addToWaitinglist('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err) {
        expect(notifications.waitinglistAddition.calledOnce).to.be(true);
        expect(notifications.waitinglistAddition.firstCall.args[0]).to.eql(activity);
        expect(notifications.waitinglistAddition.firstCall.args[1]).to.equal('memberId');
        expect(notifications.waitinglistAddition.firstCall.args[2]).to.equal('Einzelzimmer');
        done(err);
      });
    });

    it('gives a status message when there is no waitinglist', function (done) {
      var activity = activityWithEinzelzimmer({});

      activitiesService.addToWaitinglist('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(statusTitle, 'Status Title').to.equal('activities.waitinglist_not_possible');
        expect(statusText, 'Status Text').to.equal('activities.no_waitinglist');
        var waitinglistMembers = waitinglistMembersOf(activity, 'Einzelzimmer');
        expect(waitinglistMembers).to.not.contain('memberId');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });

      activitiesService.addToWaitinglist('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err) {
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

  describe('- when removing a waitinglist member -', function () {

    it('succeeds no matter whether registration is open or not', function (done) {
      var activity = activityWithEinzelzimmer({_waitinglist: [
        {_memberId: 'memberId'},
        {_memberId: 'otherId'}
      ]});
      sinon.stub(notifications, 'waitinglistRemoval');

      activitiesService.removeFromWaitinglist('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        var waitinglistMembers = waitinglistMembersOf(activity, 'Einzelzimmer');
        expect(waitinglistMembers).to.not.contain('memberId');
        expect(waitinglistMembers).to.contain('otherId');
        done(err);
      });
    });

    it('notifies of the waitinglist removal', function (done) {
      var activity = activityWithEinzelzimmer({_registrationOpen: true, _registeredMembers: [
        {memberId: 'memberId'},
        {memberId: 'otherId'}
      ]});
      sinon.stub(notifications, 'waitinglistRemoval');

      activitiesService.removeFromWaitinglist('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(notifications.waitinglistRemoval.calledOnce).to.be(true);
        expect(notifications.waitinglistRemoval.firstCall.args[0]).to.eql(activity);
        expect(notifications.waitinglistRemoval.firstCall.args[1]).to.equal('memberId');
        expect(notifications.waitinglistRemoval.firstCall.args[2]).to.equal('Einzelzimmer');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });

      activitiesService.removeFromWaitinglist('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

});
