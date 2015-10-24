import * as Actions from "./Actions.js";

const INITIAL_STATE = {
  addonLines: []
};

function reduceAddonLines(state = [], action = undefined) {
  switch (action.type) {
  case Actions.RECEIVED_ADDON_LINES:
    return action.payload;
  default:
    return state;
  }
}

export default function(state = INITIAL_STATE, action = undefined) {
  return {
    addonLines: reduceAddonLines(state.addonLines, action)
  };
}