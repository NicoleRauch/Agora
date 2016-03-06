'use strict';
var conf = require('simple-configure');
var beans = conf.get('beans');
var Member = beans.get('member');
var socratesConstants = beans.get('socratesConstants');
var eventstore = beans.get('eventstore');

module.exports = function accessrights(req, res, next) {
  eventstore.getEventStore(socratesConstants.currentUrl, function (err, eventStore) {
    var socrates = err ? null : eventStore;
    res.locals.accessrights = {
      req: req,

      member: function () {
        return this.req.user && this.req.user.member;
      },

      isRegistered: function () {
        return !!this.member();
      },

      memberId: function () {
        return this.isRegistered() ? this.member().id() : null;
      },

      isMember: function (member) {
        return this.isRegistered() && this.memberId() === member.id();
      },

      isSuperuser: function () {
        return Member.isSuperuser(this.memberId()); // same superusers as in SWK
      },

      isSoCraTesAdmin: function () { // superusers are automatically SoCraTes admins
        return this.isRegistered() && (conf.get('socratesAdmins').indexOf(this.memberId()) > -1 || this.isSuperuser());
      },

      canEditMember: function (member) {
        return this.isMember(member);
      },

      canDeleteMember: function (memberOrSubscriber) {
        return this.isSuperuser() && !this.isMember(memberOrSubscriber);
      },

      canCreateActivity: function () {
        return this.isSuperuser();
      },

      canEditActivity: function () {
        return this.isSoCraTesAdmin();
      },

      canDeleteActivity: function () {
        return this.isSuperuser();
      },

      needsToPay: function () {
        return !!socrates && !!socrates.participantsByMemberId()[this.memberId()]
          && this.isRegistered() && !!this.req.user.subscriber && this.req.user.subscriber.needsToPay();
      },

      canEditPhoto: function (photo) {
        return this.isSuperuser() || (photo && photo.uploadedBy && photo.uploadedBy() === this.memberId());
      },

      canDeletePhoto: function () {
        return this.isSuperuser();
      }

    };
    next();
  });

};
