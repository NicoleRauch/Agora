import React, { Component } from 'react';
import { connect } from 'react-redux';

import Addresses from './addresses.js';
import * as actions from './Actions.js';

export class ManagementComponent extends Component {

  componentDidMount() {
    this.props.dispatch(actions.loadAddonLines());
  }

  render() {
    return (
      <div>
        Management for the win!
        <Addresses displayed='Teilnehmer' data={this.props.addonLines}/>
        <hr />
        <Addresses displayed='Wartenden' data={[{
    firstname: 'B', lastname: 'BB', email: 'b@b', homeAddress: 'BH', billingAddress: 'BaB', resourceNames: 'BR'
    }]}/>
      </div>
    );
  }
}

export default connect(state => state)(ManagementComponent);