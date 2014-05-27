'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = require('../../testutil/configureForTest').get('beans');
var Member = beans.get('member');
var membersAPI = beans.get('membersAPI');
var memberstore = beans.get('memberstore');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var activitiesAPI = beans.get('activitiesAPI');
var notifications = beans.get('notifications');
var dummymember;

var createApp = require('../../testutil/testHelper')('membersApp').createApp;
var app = createApp();

var allMembers;
var getMember;
var getSubscribedGroupsForUser;

describe('Members application', function () {

  beforeEach(function () {
    dummymember = new Member({id: 'memberID', nickname: 'hada', email: 'a@b.c', site: 'http://my.blog', firstname: 'Hans', lastname: 'Dampf', authentications: []});
    allMembers = sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember]);
    });
    getMember = sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      callback(null, dummymember);
    });
    getSubscribedGroupsForUser = sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (email, callback) {
      callback(null, []);
    });
    sinon.stub(activitiesAPI, 'getPastActivitiesOfMember', function (member, callback) {
      callback(null, []);
    });
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) {
      callback(null, []);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('shows the list of members as retrieved from the membersstore if the user is registered', function (done) {
    request(createApp('hada'))
      .get('/')
      .expect(200)
      .expect(/href="\/members\/hada"/)
      .expect(/Hans Dampf/, function (err) {
        expect(allMembers.calledOnce).to.be(true);
        done(err);
      });
  });

  it('shows the details of one member as retrieved from the membersstore', function (done) {
    request(createApp('hada'))
      .get('/hada')
      .expect(200)
      .expect(/http:\/\/my\.blog/, function (err) {
        expect(getMember.calledWith(dummymember.nickname())).to.be(true);
        expect(getSubscribedGroupsForUser.calledWith(dummymember.email())).to.be(true);
        done(err);
      });
  });

  it('allows a member to edit her own data', function (done) {
    request(createApp('memberID'))
      .get('/edit/hada')
      .expect(200)
      .expect(/Profil bearbeiten/, done);
  });

  it('does not allow a member to edit another member\'s data', function (done) {
    request(createApp('memberID1'))
      .get('/edit/hada')
      .expect(302)
      .expect('location', /members/, done);
  });

  it('allows a superuser member to edit another member\'s data', function (done) {
    request(createApp('superuserID'))
      .get('/edit/hada')
      .expect(200)
      .expect(/Profil bearbeiten/, done);
  });

  it('validates a duplicate email address via ajax - email is same as previous', function (done) {
    request(app)
      .get('/checkemail?email=my.mail@yourmail.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('true', done);
  });

  it('validates a duplicate email address via ajax - email is valid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (mail, callback) {
      callback(null, true);
    });
    request(app)
      .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('true', done);
  });

  it('validates a duplicate email address via ajax - email is invalid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (mail, callback) {
      callback(null, false);
    });
    request(app)
      .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('false', done);
  });

  it('validates a duplicate email address via ajax - email query yields and error and email is different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (mail, callback) {
      callback(new Error());
    });
    request(app)
      .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('false', done);
  });

  it('validates a duplicate nickname via ajax - nickname is same as previous', function (done) {
    request(app)
      .get('/checknickname?nickname=nickerinack&previousNickname=nickerinack')
      .expect(200)
      .expect('true', done);
  });

  it('validates a duplicate nickname via ajax - nickname is valid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, true);
    });
    request(app)
      .get('/checknickname?nickname=nickerinack&previousNickname=bibabu')
      .expect(200)
      .expect('true', done);
  });

  it('validates a duplicate nickname via ajax - nickname is invalid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, false);
    });
    request(app)
      .get('/checknickname?nickname=nickerinack&previousNickname=bibabu')
      .expect(200)
      .expect('false', done);
  });

  it('validates a duplicate nickname via ajax - nickname query yields and error and email is different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(new Error());
    });
    request(app)
      .get('/checknickname?nickname=nickerinack&previousNickname=bibabu')
      .expect(200)
      .expect('false', done);
  });

  it('rejects a member with invalid and different nickname on submit', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, false);
    });

    request(app)
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&email=c@d.de&previousEmail=c@d.de&location=x&profession=y&reference=z')
      .send('nickname=nickerinack')
      .send('previousNickname=bibabu')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Dieser Nickname ist leider nicht verfügbar\./, done);
  });

  it('rejects a member with invalid and different email address on submit', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (nickname, callback) {
      callback(null, false);
    });

    request(app)
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z')
      .send('email=here@there.org')
      .send('previousEmail=there@wherever.com')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Diese Adresse ist schon registriert\. Hast Du bereits ein Profil angelegt?/, done);
  });

  it('rejects a member with missing first and last name on submit', function (done) {

    request(app)
      .post('/submit')
      .send('id=0815&&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z&email=here@there.org&previousEmail=here@there.org')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Vorname ist ein Pflichtfeld\./)
      .expect(/Nachname ist ein Pflichtfeld\./, done);
  });

  it('rejects a member with missing first name who validly changed their nickname and mailaddress on submit', function (done) {
    // attention: This combination is required to prove the invocations of the callbacks in case of no error!
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, true);
    });
    sinon.stub(membersAPI, 'isValidEmail', function (nickname, callback) {
      callback(null, true);
    });

    request(app)
      .post('/submit')
      .send('id=0815&&nickname=nuckNew&previousNickname=nuck&lastname=x&location=x&profession=y&reference=z&email=hereNew@there.org&previousEmail=here@there.org')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Vorname ist ein Pflichtfeld\./, done);
  });

  it('rejects a member with invalid nickname and email address on submit, giving two error messages', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, false);
    });
    sinon.stub(membersAPI, 'isValidEmail', function (nickname, callback) {
      callback(null, false);
    });

    request(app)
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z')
      .send('nickname=nickerinack')
      .send('previousNickname=bibabu')
      .send('email=here@there.org')
      .send('previousEmail=there@wherever.com')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Dieser Nickname ist leider nicht verfügbar\./)
      .expect(/Diese Adresse ist schon registriert\. Hast Du bereits ein Profil angelegt?/, done);
  });

  it('saves an existing member and does not triggers notification sending', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) { callback(null, true); });
    sinon.stub(membersAPI, 'isValidEmail', function (nickname, callback) { callback(null, true); });
    sinon.stub(groupsAndMembersAPI, 'updateSubscriptions', function (member, oldEmail, subscriptions, callback) { callback(); });
    sinon.stub(memberstore, 'saveMember', function (member, callback) { callback(null); });
    var notificationCall = sinon.spy(notifications, 'newMemberRegistered', function () { return undefined; });

    // the following stub indicates that the member already exists 
    sinon.stub(groupsAndMembersAPI, 'getUserWithHisGroups', function (nickname, callback) { callback(null, dummymember); });
    request(createApp('memberID'))
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z')
      .send('nickname=nickerinack')
      .send('email=here@there.org')
      .expect(function () { return notificationCall.called; }) // must return false to indicate correctness (thx supertest)
      .expect(302)
      .expect('location', /members\/nickerinack/, done);
  });

  it('saves a new member and does not triggers notification sending', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) { callback(null, true); });
    sinon.stub(membersAPI, 'isValidEmail', function (nickname, callback) { callback(null, true); });
    sinon.stub(groupsAndMembersAPI, 'updateSubscriptions', function (member, oldEmail, subscriptions, callback) { callback(); });
    sinon.stub(memberstore, 'saveMember', function (member, callback) { callback(null); });
    var notificationCall = sinon.spy(notifications, 'newMemberRegistered', function () { return undefined; });

    // the following stub indicates that the member not yet exists 
    sinon.stub(groupsAndMembersAPI, 'getUserWithHisGroups', function (nickname, callback) { callback(null); });
    request(createApp('memberID'))
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z')
      .send('nickname=nickerinack')
      .send('email=here@there.org')
      .expect(function () { return !notificationCall.called; }) // must return false to indicate correctness (thx supertest)
      .expect(302)
      .expect('location', /members\/nickerinack/, done);
  });

});
