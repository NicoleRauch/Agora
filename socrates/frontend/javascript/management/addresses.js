import React from 'react';
import DataTable from './DataTable.js';

export default (props) => {
  const participantColumns = [
    { dataField: 'firstname', title: 'Vorname' },
    { dataField: 'lastname', title: 'Nachname' },
    { dataField: 'email', title: 'E-Mail' },
    { dataField: 'homeAddress', title: 'Heimatadresse' },
    { dataField: 'billingAddress', title: 'Rechnungsadresse' },
    { dataField: 'resourceNames', title: 'Ressource' }
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

  return (
    <div>
      <h1>Adressen der Teilnehmer</h1>
      <DataTable data={props.participants} columns={participantColumns}/>

      <h1>Adressen der Wartenden</h1>
      <DataTable data={props.waiting} columns={waitingColumns}/>
    </div>
  );
}
