import ajax from 'nanoajax';
import Rx from 'rxjs/Rx.DOM';

export const RECEIVED_PARTICIPANTS = 'RECEIVED_PARTICIPANTS';
export const RECEIVED_WAITING = 'RECEIVED_WAITING';
export const RECEIVED_DURATIONS = 'RECEIVED_DURATIONS';

export function receiveParticipants(participants) {
  return {
    type: RECEIVED_PARTICIPANTS,
    payload: participants
  };
}

function fetchParticipants() {
  return Rx.Observable.ajax({ url: '/registration/participants'});
}

export function loadParticipants() {
  return (dispatch) => fetchParticipants().map(({response: participants}) => receiveParticipants(participants));
}

export function receiveWaiting(waiting) {
  return {
    type: RECEIVED_WAITING,
    payload: waiting
  };
}

function fetchWaiting() {
  return Rx.Observable.ajax({url: '/registration/waiting'});
}

export function loadWaiting() {
  return (dispatch) => fetchWaiting().map(({response: waiting}) => receiveWaiting(waiting));
}

export function receiveDurations(durations) {
  return {
    type: RECEIVED_DURATIONS,
    payload: durations
  };
}

function fetchDurations() {
  return Rx.Observable.ajax({url: '/registration/durations'});
}

export function loadDurations() {
  return (dispatch) => fetchDurations().map(({response: durations}) => receiveDurations(durations));
}
