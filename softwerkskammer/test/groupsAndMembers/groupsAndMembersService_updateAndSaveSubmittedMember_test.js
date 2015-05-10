'use strict';

var sinon = require('sinon').sandbox.create();
var beans = require('../../testutil/configureForTest').get('beans');

var expect = require('must');

var Member = beans.get('member');

var memberstore = beans.get('memberstore');

var groupsAndMembersService = beans.get('groupsAndMembersService');

describe('Groups and Members Service', function () {

  afterEach(function () {
    sinon.restore();
  });

  describe('- updateAndSaveSubmittedMember -', function () {

    var memberformData = {previousNickname: 'nick', nickname: 'nick in memberform'};
    var member = new Member({id: 'memberId', nickname: 'nick nack'});

    describe('when some error occurs', function () {

      it('returns an error when the member loading caused an error', function (done) {
        sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(new Error('some error')); });

        groupsAndMembersService.updateAndSaveSubmittedMemberWithSubscriptions(undefined, {previousNickname: 'nick'}, undefined, undefined, function (err, nickname) {
          expect(err.message).to.equal('some error');
          expect(nickname).to.be.undefined();
          done();
        });
      });

      it('returns an error when the submitted member is a new member and saving the member caused an error', function (done) {
        sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null, null); });
        sinon.stub(memberstore, 'saveMember', function (anyMember, callback) { callback(new Error('some error')); });

        groupsAndMembersService.updateAndSaveSubmittedMemberWithSubscriptions(undefined, {previousNickname: 'nick'}, undefined, undefined, function (err, nickname) {
          expect(err.message).to.equal('some error');
          expect(nickname).to.be.undefined();
          done();
        });
      });

      it('returns an error when the submitted member is an existing member and we are allowed to edit the member but saving causes an error', function (done) {
        sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null, member); });
        var accessrights = {canEditMember: function () { return true; }};
        sinon.stub(memberstore, 'saveMember', function (anyMember, callback) { callback(new Error('some error')); });

        groupsAndMembersService.updateAndSaveSubmittedMemberWithSubscriptions(undefined, memberformData, accessrights, undefined, function (err, nickname) {
          expect(err.message).to.equal('some error');
          expect(nickname).to.be.undefined();
          done();
        });
      });

    });

    describe('when the submitted member is a new member', function () {

      beforeEach(function () {
        sinon.stub(memberstore, 'saveMember', function (anyMember, callback) { callback(null); });
        sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null, null); });
        sinon.stub(groupsAndMembersService, 'updateSubscriptions', function (anyMember, oldEmail, subscriptions, callback) { callback(null); });
      });

      it('adds the new member to the sessionUser', function (done) {
        var sessionUser = {authenticationId: 'member authentication id'};
        var accessrights = {canEditMember: function () { return true; }};

        groupsAndMembersService.updateAndSaveSubmittedMemberWithSubscriptions(sessionUser, memberformData, accessrights, function () { return; },
          function (err, nickname) {
            expect(nickname).to.equal('nick in memberform');
            expect(sessionUser.member.id()).to.equal('member authentication id');
            done(err);
          });
      });
    });

    describe('when the submitted member is an existing member', function () {

      var canEditMember = {canEditMember: function () { return true; }};

      beforeEach(function () {
        sinon.stub(memberstore, 'saveMember', function (anyMember, callback) { callback(null); });
        sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null, member); });
        sinon.stub(groupsAndMembersService, 'updateSubscriptions', function (anyMember, oldEmail, subscriptions, callback) { callback(null); });
      });

      it('returns null when we are not allowed to edit the member', function (done) {
        var canNotEditMember = {canEditMember: function () { return false; }};

        groupsAndMembersService.updateAndSaveSubmittedMemberWithSubscriptions(undefined, memberformData, canNotEditMember, undefined, function (err, nickname) {
          expect(err).to.be.null();
          expect(nickname).to.be.undefined();
          done();
        });
      });

      it('adds the member to and removes the profile from the sessionUser when the sessionUser does not contain a member', function (done) {
        var sessionUser = {profile: {}};

        groupsAndMembersService.updateAndSaveSubmittedMemberWithSubscriptions(sessionUser, memberformData, canEditMember, undefined, function (err, nickname) {
          expect(nickname).to.equal('nick in memberform');
          expect(sessionUser.member).to.equal(member);
          expect(sessionUser.hasOwnProperty('profile')).to.be.false();
          done(err);
        });
      });

      it('modifies the sessionUser when the sessionUser contains a member with the same id', function (done) {
        var differentMemberWithSameId = new Member({id: 'memberId'});
        var sessionUser = {member: differentMemberWithSameId};

        groupsAndMembersService.updateAndSaveSubmittedMemberWithSubscriptions(sessionUser, memberformData, canEditMember, undefined, function (err, nickname) {
          expect(nickname).to.equal('nick in memberform');
          expect(sessionUser.member).to.equal(member);
          expect(sessionUser.member).to.not.equal(differentMemberWithSameId);
          done(err);
        });
      });

      it('does not modify the sessionUser when the sessionUser contains a member with a different id', function (done) {
        var anotherMember = new Member({id: 'anotherMemberId'});
        var sessionUser = {member: anotherMember};

        groupsAndMembersService.updateAndSaveSubmittedMemberWithSubscriptions(sessionUser, memberformData, canEditMember, undefined, function (err, nickname) {
          expect(nickname).to.equal('nick in memberform');
          expect(sessionUser.member).to.equal(anotherMember);
          done(err);
        });
      });

    });
  });
});
