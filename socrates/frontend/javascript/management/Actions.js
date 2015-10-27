import ajax from 'nanoajax';

export const RECEIVED_PARTICIPANTS = 'RECEIVED_PARTICIPANTS';
export const RECEIVED_WAITING = 'RECEIVED_WAITING';

export function receiveParticipants(participants) {
  return {
    type: RECEIVED_PARTICIPANTS,
    payload: participants
  };
}

function fetchParticipants(callback) {
  ajax.ajax({url: '/registration/participants' },
    (code, responseText) => {
      callback(JSON.parse(responseText));
    }
  );
}

export function loadParticipants() {
  return (dispatch, getState) => {
    fetchParticipants(participants => {
      dispatch(receiveParticipants(participants));
    });
  };
}

export function receiveWaiting(waiting) {
  return {
    type: RECEIVED_WAITING,
    payload: waiting
  };
}

function fetchWaiting(callback) {
  ajax.ajax({url: '/registration/waiting' },
    (code, responseText) => {
      callback(JSON.parse(responseText));
    }
  );
}

export function loadWaiting() {
  return (dispatch, getState) => {
    fetchWaiting(participants => {
      dispatch(receiveWaiting(participants));
    });
  };
}
