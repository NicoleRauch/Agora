import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import createLogger from "redux-logger";
import { Provider } from "react-redux";

import Management from './management.js';
import reducers from './reducers.js';

const logger = createLogger();

const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware,
  logger
)(createStore);

const store = createStoreWithMiddleware(reducers);
window.store = store;

ReactDOM.render(
  <Provider store={store}>
    <Management />
  </Provider>,
  document.getElementById('start')
);
