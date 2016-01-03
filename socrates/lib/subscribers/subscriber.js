'use strict';

var beans = require('simple-configure').get('beans');
var Addon = beans.get('socratesAddon');
var Participation = beans.get('socratesParticipation');
var socratesConstants = beans.get('socratesConstants');

function Subscriber(object) {
  this.state = object || {};
}

Subscriber.prototype.fillFromUI = function (uiInputObject) {
  if (Addon.hasAddonInformation(uiInputObject)) {
    this.addon().fillFromUI(uiInputObject);
  }
  if (Participation.hasParticipationInformation(uiInputObject)) {
    this.currentParticipation().fillFromUI(uiInputObject);
  }
  this.state.notifyOnWikiChangesSoCraTes = !!uiInputObject.notifyOnWikiChangesSoCraTes;
  return this;
};

Subscriber.prototype.id = function () {
  return this.state.id;
};

Subscriber.prototype.addon = function () {
  /*eslint no-underscore-dangle: 0*/
  if (!this.state._addon) {
    this.state._addon = {};
  }
  return new Addon(this.state._addon);
};

Subscriber.prototype.payment = function () {
  return this.currentParticipation().payment();
};

Subscriber.prototype.participations = function () {
  if (!this.state.participations) {
    this.state.participations = {};
  }
  return this.state.participations;
};

Subscriber.prototype.currentParticipation = function () {
  return this.participationOf(socratesConstants.currentYear);
};

Subscriber.prototype.notifyOnWikiChangesSoCraTes = function () {
  return this.state.notifyOnWikiChangesSoCraTes;
};

Subscriber.prototype.participationOf = function (year) {
  if (!this.participations()[year]) {
    this.state.participations[year] = {};
  }
  return new Participation(this.participations()[year]);
};

Subscriber.prototype.isParticipating = function () {
  return !!this.participations()[socratesConstants.currentYear];
};

Subscriber.prototype.hasParticipatedAnyYear = function () {
  return Object.getOwnPropertyNames(this.participations()).length > 0;
};

Subscriber.prototype.needsToPay = function () {
  return this.participations()[socratesConstants.currentYear] && !this.payment().paymentConfirmed();
};

module.exports = Subscriber;
