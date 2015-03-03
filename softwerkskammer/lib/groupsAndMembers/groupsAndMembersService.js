'use strict';

var async = require('async');
var winston = require('winston');
var _ = require('lodash');

var conf = require('simple-configure');
var beans = conf.get('beans');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var Group = beans.get('group');
var misc = beans.get('misc');
var Member = beans.get('member');

var membersOfList = function (listname, callback) {
  groupsService.getMailinglistUsersOfList(listname, function (err, emailAddresses) {
    if (err) { return callback(err); }
    memberstore.getMembersForEMails(emailAddresses, callback);
  });
};

var addMembersToGroup = function (group, callback) {
  if (!group) { return callback(null); }
  membersOfList(group.id, function (err, members) {
    if (err) { return callback(err); }
    async.each(members, membersService.getImage, function () {
      group.members = members;
      group.membercount = members.length;
      callback(err, group);
    });
  });
};

var addGroupsToMember = function (member, callback) {
  if (!member) { return callback(null); }
  groupsService.getSubscribedGroupsForUser(member.email(), function (err, subscribedGroups) {
    if (err) { return callback(err); }
    member.subscribedGroups = subscribedGroups;
    callback(err, member);
  });
};

var updateAndSaveSubmittedMember = function (self, sessionUser, memberformData, accessrights, notifyNewMemberRegistration, updateSubscriptions, callback) {
  self.getMemberWithHisGroups(memberformData.previousNickname, function (err, persistentMember) {
    if (err) { return callback(err); }
    if (persistentMember && !accessrights.canEditMember(persistentMember)) {
      return callback(null);
    }
    var member = persistentMember || new Member().initFromSessionUser(sessionUser);
    var oldEmail = persistentMember ? member.email() : memberformData.previousEmail;
    member.addAuthentication(memberformData.id);
    member.fillFromUI(memberformData);
    memberstore.saveMember(member, function (err) {
      if (err) { return callback(err); }
      if (!sessionUser.member || sessionUser.member.id() === member.id()) {
        sessionUser.member = member;
        delete sessionUser.profile;
      }

      var subscriptions = misc.toArray(memberformData.newSubscriptions);
      if (!persistentMember) { // new member
        notifyNewMemberRegistration(member, subscriptions);
      }
      if (updateSubscriptions) {
        return self.updateSubscriptions(member, oldEmail, subscriptions, function (err) {
          return callback(err, member.nickname());
        });
      }
      return callback(null, member.nickname());
    });
  });
};

var groupsWithExtraEmailAddresses = function (members, groupNamesWithEmails) {
  var allEmailAddresses = _.map(members, function (member) { return member.email(); });
  return _.transform(groupNamesWithEmails, function (result, value, key) {
    var diff = _.difference(value, allEmailAddresses);
    if (diff.length > 0) { result.push({group: key, extraAddresses: diff}); }
  }, []);
};

module.exports = {
  getMemberWithHisGroups: function (nickname, callback) {
    memberstore.getMember(nickname, function (err, member) {
      if (err) { return callback(err); }
      addGroupsToMember(member, callback);
    });
  },

  getMemberWithHisGroupsByMemberId: function (memberID, callback) {
    memberstore.getMemberForId(memberID, function (err, member) {
      if (err) { return callback(err); }
      addGroupsToMember(member, callback);
    });
  },

  getAllMembersWithTheirGroups: function (callback) {
    groupsService.getAllAvailableGroups(function (err, groups) {
      if (err) { return callback(err); }

      function loadMembersAndFillInGroups(err, groupNamesWithEmails, callback) {
        if (err) { return callback(err); }

        memberstore.allMembers(function (err, members) {
          if (err) { return callback(err); }
          _.each(members, function (member) { member.fillSubscribedGroups(groupNamesWithEmails, groups); });
          callback(null, members, groupsWithExtraEmailAddresses(members, groupNamesWithEmails));
        });
      }

      async.reduce(groups, {}, function (memo, group, cb) {
        groupsService.getMailinglistUsersOfList(group.id, function (err, emails) {
          memo[group.id] = emails;
          cb(err, memo);
        });
      }, function (err, groupNamesWithEmails) {
        loadMembersAndFillInGroups(err, groupNamesWithEmails, callback);
      });
    });
  },

  getGroupAndMembersForList: function (groupname, globalCallback) {
    async.waterfall(
      [
        function (callback) {
          groupstore.getGroup(groupname, callback);
        },
        function (group, callback) {
          addMembersToGroup(group, callback);
        }
      ],
      function (err, group) {
        return globalCallback(err, group);
      }
    );
  },

  addMembersToGroup: addMembersToGroup,

  addMembercountToGroup: function (group, callback) {
    if (!group) { return callback(null); }
    groupsService.getMailinglistUsersOfList(group.id, function (err, mailinglistUsers) {
      group.membercount = mailinglistUsers.length;
      return callback(err, group);
    });
  },

  memberIsInMemberList: function (id, members) {
    return _(members).some(function (member) { return member.id() === id; });
  },

  updateAdminlistSubscriptions: function (memberID, callback) {
    this.getMemberWithHisGroupsByMemberId(memberID, function (err, member) {
      var adminListName = conf.get('adminListName');
      groupsService.getMailinglistUsersOfList(adminListName, function (err, emailAddresses) {
        var isInAdminList = _.contains(emailAddresses, member.email());
        if (member.isContactperson() && !isInAdminList) {
          return groupsService.addUserToList(member.email(), adminListName, callback);
        }
        if (!member.isContactperson() && isInAdminList) {
          return groupsService.removeUserFromList(member.email(), adminListName, callback);
        }
        callback();
      });
    });
  },

  saveGroup: function (newGroup, callback) {
    var self = this;
    groupsService.createOrSaveGroup(newGroup, function (err, existingGroup) {
      if (err) { return callback(err); }
      async.each(Group.organizersOnlyInOneOf(newGroup, existingGroup), function (memberID, callback) {
        self.updateAdminlistSubscriptions(memberID, callback);
      });
      callback();
    });
  },

  updateSubscriptions: function (member, oldEmail, subscriptions, callback) {
    var self = this;
    return groupsService.updateSubscriptions(member.email(), oldEmail, subscriptions, function (err) {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  subscribeMemberToGroup: function (member, groupname, callback) {
    var self = this;
    groupsService.addUserToList(member.email(), groupname, function (err) {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  unsubscribeMemberFromGroup: function (member, groupname, callback) {
    var self = this;
    groupsService.removeUserFromList(member.email(), groupname, function (err) {
      if (err) { return callback(err); }
      self.updateAdminlistSubscriptions(member.id(), callback);
    });
  },

  updateAndSaveSubmittedMemberWithoutSubscriptions: function (sessionUser, memberformData, accessrights, notifyNewMemberRegistration, callback) {
    updateAndSaveSubmittedMember(this, sessionUser, memberformData, accessrights, notifyNewMemberRegistration, false, callback);
  },

  updateAndSaveSubmittedMemberWithSubscriptions: function (sessionUser, memberformData, accessrights, notifyNewMemberRegistration, callback) {
    updateAndSaveSubmittedMember(this, sessionUser, memberformData, accessrights, notifyNewMemberRegistration, true, callback);
  }

};

