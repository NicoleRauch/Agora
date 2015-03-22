'use strict';
var moment = require('moment-timezone');

module.exports = {
  language: 'en',
  t: function (string) { return string; },
  accessrights: {
    isRegistered: function () { return true; },
    isMember: function () { return true; },
    memberId: function () { return ''; }
  },
  activity: {
    id: function () { return ''; },
    url: function () { return ''; },
    title: function () { return ''; },
    startMoment: function () { return moment(); },
    endMoment: function () { return moment(); },
    description: function () { return ''; },
    location: function () { return ''; },
    direction: function () { return ''; },
    resourceNames: function () { return []; },
    isAlreadyRegistered: function () { return false; },
    selectedOptionFor: function () { return null; }
  },
  message: {
    receiver: ''
  },
  member: {
    id: function () { return ''; },
    created: function () { return ''; },
    email: function () { return ''; },
    firstname: function () { return ''; },
    lastname: function () { return ''; },
    nickname: function () { return ''; },
    twitter: function () { return ''; },
    location: function () { return ''; },
    profession: function () { return ''; },
    interests: function () { return ''; },
    site: function () { return ''; },
    reference: function () { return ''; },
    notifyOnWikiChanges: function () { return ''; },
    socratesOnly: function () { return false; },
    authentications: function () { return []; }
  },
  paymentInfo: {
    paymentDone: function () { return false; },
    paymentKey: function () { return 'paymentKey'; }
  },
  addon: {
    addon: function () { return 'addonInformation'; },
    addonInformationHTML: function () { return 'addonInformationHTML'; },
    homeAddress: function () { return 'yes'; },
    billingAddress: function () { return 'yes'; },
    tShirtSize: function () { return 'yes'; },
    roommate: function () { return 'yes'; },
    deposit: function () { return ''; }
  },
  roomOptions: [
    {id: 'single', name: 'Single', two: 200, three: 270, threePlus: 300, four: 370, displayAsBookable: true},
    {id: 'bed_in_double', name: 'Double shared …', shareable: true, two: 160, three: 210, threePlus: 240, four: 290, displayAsBookable: true},
    {id: 'junior', name: 'Junior shared …', shareable: true, two: 151, three: 197, threePlus: 227, four: 272, displayAsBookable: true},
    {id: 'bed_in_junior', name: 'Junior (exclusive)', two: 242, three: 333, threePlus: 363, four: 454, displayAsBookable: true}
  ]

};
