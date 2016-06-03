import React from 'react';
import DataTable from './DataTable.js';
import {reduce} from 'lodash';

import {endOfStayFor} from '../../../lib/activities/roomOptions';

export default (props) => {
  var columns = [
    {dataField: 'registered', title: 'Registriert'},
    {dataField: 'roomType', title: 'Room Type'},
    {dataField: 'nickname', title: 'Nickname'},
    {dataField: 'firstname', title: 'Vorname'},
    {dataField: 'lastname', title: 'Nachname'},
    {dataField: 'email', title: 'E-Mail'},
    {dataField: 'location', title: 'Ort/Region'},
    {dataField: 'tShirtSize', title: 'T-Shirt'},
    {dataField: 'desiredRoommate', title: 'Zimmer mit'}
  ];

  const participants = reduce(props.participants,
    (acc, participantsForRoom) =>
      acc.concat(participantsForRoom.participants.map(participant => Object.assign({roomType: participantsForRoom.roomType}, participant))),
    []
  );

  return (
    <div>
      <h4>Alle Teilnehmer mit Zahlungen</h4>
      <DataTable data={participants} columns={columns}/>
    </div>
  );
};
