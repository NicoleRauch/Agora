import React from 'react';
import DataTable from './DataTable.js';
import { reduce } from 'lodash';

export default (props) => {
  const participantColumns = [
    { dataField: 'firstname', title: 'Vorname' },
    { dataField: 'lastname', title: 'Nachname' },
    { dataField: 'email', title: 'E-Mail' },
    { dataField: 'homeAddress', title: 'Heimatadresse' },
    { dataField: 'billingAddress', title: 'Rechnungsadresse' },
    { dataField: 'resourceName', title: 'Ressource' }
  ];
  const waitingColumns = [
    { dataField: 'firstname', title: 'Vorname' },
    { dataField: 'lastname', title: 'Nachname' },
    { dataField: 'email', title: 'E-Mail' },
    { dataField: 'tShirtSize', title: 'T-Shirt' },
    { dataField: 'desiredRoommate', title: 'Zimmer mit' },
    { dataField: 'homeAddress', title: 'Heimatadresse' },
    { dataField: 'billingAddress', title: 'Rechnungsadresse' },
    { dataField: 'resourceNames', title: 'Ressource' }
  ];

  const resourceNames = Object.keys(props.participants);
  const participants = reduce(resourceNames,
    (participants, resourceName) =>
      participants.concat(props.participants[resourceName].participants
        .map(participant => Object.assign({ resourceName: resourceName }, participant))),
    []
  );

  return (
    <div>
      <h4>Adressen der Teilnehmer</h4>
      <DataTable data={participants} columns={participantColumns}/>

      <h4>Adressen der Wartenden</h4>
      <DataTable data={props.waiting} columns={waitingColumns}/>
    </div>
  );
}
