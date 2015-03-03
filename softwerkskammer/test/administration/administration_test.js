'use strict';

var request = require('supertest');
var sinonSandbox = require('sinon').sandbox.create();
var expect = require('must');
var moment = require('moment-timezone');

var beans = require('../../testutil/configureForTest').get('beans');

var memberstore = beans.get('memberstore');
var Member = beans.get('member');
var dummymember = new Member({id: 'memberID', nickname: 'hada', email: 'a@b.c', site: 'http://my.blog', firstname: 'Hans', lastname: 'Dampf', authentications: []});

var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var Group = beans.get('group');

var activitiesService = beans.get('activitiesService');
var Activity = beans.get('activity');

var announcementstore = beans.get('announcementstore');
var Announcement = beans.get('announcement');

var fieldHelpers = beans.get('fieldHelpers');
var createApp = require('../../testutil/testHelper')('administrationApp').createApp;

describe('Administration application', function () {
  var appWithSuperuser = request(createApp('superuserID'));

  var emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'groupname',
    location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'),
    url: 'urlOfTheActivity', owner: 'owner' });

  var dummyAnnouncement = new Announcement({
    title: 'title',
    url: 'url',
    message: 'text',
    author: 'author',
    fromUnix: 1375056000, // 29.07.2013
    thruUnix: 1388448000 // 31.12.2013
  });

  beforeEach(function () {
    sinonSandbox.stub(groupsService, 'getAllAvailableGroups', function (callback) {
      return callback(null, [new Group({id: 'id', longName: 'GRUPPO', description: 'desc'})]);
    });
  });

  afterEach(function () {
    sinonSandbox.restore();
  });

  it('shows the table for members', function (done) {
    sinonSandbox.stub(memberstore, 'allMembers', function (callback) {
      return callback(null, [dummymember]);
    });
    appWithSuperuser
      .get('/memberTable')
      .expect(200)
      .expect(/<h2>Verwaltung<small> Mitglieder/)
      .expect(/a@b\.c/, done);
  });

  it('shows the table for members and groups', function (done) {
    sinonSandbox.stub(groupsAndMembersService, 'getAllMembersWithTheirGroups', function (callback) {
      return callback(null, [dummymember], [{group: 'Überflüssig', unmatched: ['peter.pan@alice.de']}]);
    });
    appWithSuperuser
      .get('/memberAndGroupTable')
      .expect(200)
      .expect(/<h2>Verwaltung<small> Mitglieder und Gruppen/)
      .expect(/Hans Dampf/)
      .expect(/<dt>Überflüssig<\/dt>/)
      .expect(/<dd>peter\.pan@alice\.de<\/dd>/)
      .expect(/GRUP&hellip;/, done);
  });

  it('shows the table for groups', function (done) {
    appWithSuperuser
      .get('/groupTable')
      .expect(200)
      .expect(/<h2>Verwaltung<small> Gruppen/)
      .expect(/GRUPPO/, done);
  });

  it('shows the table for activities', function (done) {
    sinonSandbox.stub(activitiesService, 'getActivitiesForDisplay', function (activitiesFetcher, callback) {
      return callback(null, [emptyActivity]);
    });
    appWithSuperuser
      .get('/activityTable')
      .expect(200)
      .expect(/<h2>Verwaltung<small> Aktivitäten /)
      .expect(/Title of the Activity/)
      .expect(/01\.01\.2013/, done);
  });

  it('shows the table for announcements', function (done) {
    sinonSandbox.stub(announcementstore, 'allAnnouncements', function (callback) {
      return callback(null, [ dummyAnnouncement ]);
    });
    appWithSuperuser
      .get('/announcementTable')
      .expect(200)
      .expect(/<h2>Verwaltung<small> Nachrichten/)
      .expect(/29\.07\.2013/, done);
  });

});
