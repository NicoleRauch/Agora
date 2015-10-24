import ajax from 'nanoajax';

export const RECEIVED_ADDON_LINES = 'RECEIVED_ADDON_LINES';

export function receiveAddonLines(addonLines) {
  return {
    type: RECEIVED_ADDON_LINES,
    payload: addonLines
  };
}

function fetchAddonLines(callback) {
  ajax.ajax('/registration/addonLines',
    (code, payload) => {
      callback(payload);
    }
  );
}

export function loadAddonLines() {
  return (dispatch, getState) => {
    fetchAddonLines(addonLines => {
      dispatch(receiveAddonLines(addonLines));
    });
  };
}
