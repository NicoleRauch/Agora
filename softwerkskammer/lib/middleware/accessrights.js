'use strict';
var moment = require('moment-timezone');
var conf = require('nconf');
var Member = conf.get('beans').get('member');

module.exports = function accessrights(req, res, next) {
  res.locals.accessrights = {
    req: req,

    member: function () {
      return this.req.user && this.req.user.member;
    },

    memberId: function () {
      return this.isRegistered() ? this.member().id() : null;
    },

    isRegistered: function () {
      return !!this.member();
    },

    isSuperuser: function () {
      return Member.isSuperuser(this.memberId());
    },

    canCreateActivityResult: function () {
      // TODO Nutzerkreis erweitern; Superuser sind nur Nicole und der Leider.
      return this.isSuperuser();
    },

    canCreateActivity: function () {
      return this.isRegistered();
    },

    canEditActivity: function (activity) {
      return this.isSuperuser() || (activity.group && activity.group.isOrganizer(this.memberId())) || activity.owner() === this.memberId()
        || activity.editorIds().indexOf(this.memberId()) > -1;
    },

    canDeleteActivity: function (activity) {
      return this.isSuperuser() || (activity.owner() === this.memberId() && activity.startMoment().isAfter(moment()));
    },

    canCreateAnnouncement: function () {
      return this.isRegistered();
    },

    canEditAnnouncement: function (announcement) {
      return this.isSuperuser() || announcement.author === this.memberId();
    },

    canCreateGroup: function () {
      return this.isRegistered();
    },

    canEditGroup: function (group) {
      return this.isSuperuser() || group.isOrganizer(this.memberId());
    },

    canEditMember: function (member) {
      return this.isSuperuser() || this.isMember(member);
    },

    canDeleteMember: function (member) {
      return this.isSuperuser() && !this.isMember(member);
    },

    isMember: function (member) {
      return this.isRegistered() && this.memberId() === member.id();
    },

    canCreateColor: function () {
      return this.isSuperuser();
    },

    canViewGroupDetails: function () {
      return this.isRegistered();
    },

    canParticipateInGroup: function () {
      return this.isRegistered();
    }

  };
  next();
};
