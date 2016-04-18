import { combineReducers } from 'redux';

import * as actions from './Actions.js';

const INITIAL_STATE = {
  participants: [],
  waiting: [],
  durations: {}
};

function participants(state = INITIAL_STATE.participants, action = undefined) {
  switch (action.type) {
  case actions.RECEIVED_PARTICIPANTS:
    return action.payload;
  default:
    return state;
  }
}

function waiting(state = INITIAL_STATE.waiting, action = undefined) {
  switch (action.type) {
  case actions.RECEIVED_WAITING:
    return action.payload;
  default:
    return state;
  }
}

function durations(state = INITIAL_STATE.durations, action = undefined) {
  switch (action.type) {
  case actions.RECEIVED_DURATIONS:
    return action.payload;
  default:
    return state;
  }
}

export default combineReducers({
  participants,
  waiting,
  durations
});
