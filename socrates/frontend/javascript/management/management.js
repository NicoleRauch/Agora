import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import Addresses from './addresses.js';
import * as actions from './Actions.js';

export class ManagementComponent extends Component {

  componentDidMount() {
    this.props.dispatch(actions.loadAddonLines());
  }

  render() {
    return (
      <div className='row'>
        <div className='col-md-12'>
          <div className='page-header'>
            <h2>
              SoCraTes 2015 - Verwaltung
              <a href='/registration' className='btn pull-right btn-default'>Zurück</a>
            </h2>
          </div>
          <Tabs selectedIndex={0}>
            <TabList>
              <Tab>Übersicht</Tab>
              <Tab>Participants</Tab>
              <Tab>Wartelisten</Tab>
              <Tab>Zahlungen</Tab>
              <Tab>Zimmerzuordnungen</Tab>
              <Tab>T-Shirt-Bestellungen</Tab>
              <Tab>Zusatzinformationen</Tab>
              <Tab>Abgemeldete</Tab>
              <Tab>Adressen</Tab>
            </TabList>
            <TabPanel>A</TabPanel>
            <TabPanel>B</TabPanel>
            <TabPanel>C</TabPanel>
            <TabPanel>D</TabPanel>
            <TabPanel>E</TabPanel>
            <TabPanel>F</TabPanel>
            <TabPanel>G</TabPanel>
            <TabPanel>H</TabPanel>
            <TabPanel>
              <Addresses displayed='Teilnehmer' data={this.props.addonLines}/>
              <hr />
              <Addresses displayed='Wartenden' data={[{
    firstname: 'B', lastname: 'BB', email: 'b@b', homeAddress: 'BH', billingAddress: 'BaB', resourceNames: 'BR'
    }]}/>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default connect(state => state)(ManagementComponent);