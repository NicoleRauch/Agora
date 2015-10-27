import ajax from 'nanoajax';

export const RECEIVED_PARTICIPANTS = 'RECEIVED_ADDON_LINES';
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
