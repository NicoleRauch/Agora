import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';

import Addresses from './addresses';
import Payments from './payments';
import Participants from './participants';
import BedOccupation from './BedOccupation';
import Waiting from './Waiting';
import * as Actions from './Actions';

export class ManagementComponent extends Component {

  constructor(props) {
    super(props);

    this._handleDurationChange = this._handleDurationChange.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(Actions.loadParticipants());
    this.props.dispatch(Actions.loadWaiting());
    this.props.dispatch(Actions.loadDurations());
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
          <Tabs>
            <TabList>
              <Tab>Overview</Tab>
              <Tab>Participants</Tab>
              <Tab>Participants by Rooms</Tab>
              <Tab>Waiting Lists</Tab>
              <Tab>Zimmerzuordnungen</Tab>
              <Tab>T-Shirt-Bestellungen</Tab>
              <Tab>Zusatzinformationen</Tab>
              <Tab>Adressen</Tab>
            </TabList>
            <TabPanel>
              <BedOccupation occupations={[]} durations={this.props.durations}/>
            </TabPanel>
            <TabPanel>
              <Payments participants={this.props.participants}/>
            </TabPanel>
            <TabPanel>
              <Participants participants={this.props.participants} handleDurationChange={this._handleDurationChange}/>
            </TabPanel>
            <TabPanel>
              <Waiting waiting={this.props.waiting}/>
            </TabPanel>
            <TabPanel>E</TabPanel>
            <TabPanel>F</TabPanel>
            <TabPanel>G</TabPanel>
            <TabPanel>
              <Addresses participants={this.props.participants} waiting={this.props.waiting}/>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    );
  }

  _handleDurationChange(roomType, nickname, newDuration) {
    this.props.dispatch(Actions.changeDuration(roomType, nickname, newDuration));
  }
}

export default connect(state => state)(ManagementComponent);
