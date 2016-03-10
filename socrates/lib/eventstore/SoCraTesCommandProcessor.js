/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');

var beans = require('simple-configure').get('beans');
var fieldHelpers = beans.get('fieldHelpers');
var misc = beans.get('misc');

var events = beans.get('events');
var roomOptions = beans.get('roomOptions');

function SoCraTesCommandProcessor(writeModel) {
  this.writeModel = writeModel;
}

SoCraTesCommandProcessor.prototype.updateFromUI = function (uiData) {
  this.updateUrl(uiData.url);
  this.updateStartTime(uiData.startDate, uiData.startTime);
  this.updateEndTime(uiData.endDate, uiData.endTime);
  // update quotas:
  this._updateQuotasFromUI(uiData.resources);
};

SoCraTesCommandProcessor.prototype.updateUrl = function (newUrl) {
  var event = events.urlWasSet(newUrl);
  this._updateSoCraTesEvents(event);
};

SoCraTesCommandProcessor.prototype.updateStartTime = function (startDate, startTime) {
  var startMoment = fieldHelpers.parseToMomentUsingDefaultTimezone(startDate, startTime);
  this._updateSoCraTesEvents(events.startTimeWasSet(startMoment));
};

SoCraTesCommandProcessor.prototype.updateEndTime = function (endDate, endTime) {
  var endMoment = fieldHelpers.parseToMomentUsingDefaultTimezone(endDate, endTime);
  this._updateSoCraTesEvents(events.endTimeWasSet(endMoment));
};

SoCraTesCommandProcessor.prototype._updateQuotasFromUI = function (uiInputArrays) {
  function matchArrayEntries(input) {
    return R.zipObj(misc.toArray(input.names), misc.toArray(input.limits));
  }

  var self = this;
  var newQuotas = matchArrayEntries(uiInputArrays);

  R.map(function (roomType) {
    self.updateRoomQuota(roomType, newQuotas[roomType]);
  }, roomOptions.allIds());
};


SoCraTesCommandProcessor.prototype.updateRoomQuota = function (roomType, quota) {
  var event = events.roomQuotaWasSet(roomType, quota);
  this._updateSoCraTesEvents(event);
};

SoCraTesCommandProcessor.prototype._updateSoCraTesEvents = function (newEvents) {
  if (!(newEvents instanceof Array)) {
    newEvents = [newEvents];
  }
  this.writeModel.updateSoCraTesEvents(newEvents);
};

SoCraTesCommandProcessor.prototype.eventStore = function () {
  return this.writeModel.eventStore();
};

module.exports = SoCraTesCommandProcessor;
